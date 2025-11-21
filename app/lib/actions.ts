'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { AuthError } from 'next-auth';
import { signIn, auth } from '@/auth';

// =====================
// バリデーションスキーマ
// =====================

const PostSchema = z.object({
  id: z.string().uuid().optional(),
  blog_id: z.string().uuid({ message: 'ブログIDを選択してください。' }),
  title: z.string().min(1, { message: 'タイトルを入力してください。' }),
  slug: z.string().min(1, { message: 'スラッグを入力してください。' }),
  content: z.string().min(1, { message: '本文を入力してください。' }),
  excerpt: z.string().optional(),
  featured_image: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived'], {
    invalid_type_error: 'ステータスを選択してください。',
  }),
  visibility: z.enum(['public', 'private', 'restricted'], {
    invalid_type_error: '公開範囲を選択してください。',
  }),
  category_ids: z.array(z.string().uuid()).optional(),
  tag_ids: z.array(z.string().uuid()).optional(),
});

const CategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, { message: 'カテゴリ名を入力してください。' }),
  slug: z.string().min(1, { message: 'スラッグを入力してください。' }),
  description: z.string().optional(),
});

const TagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, { message: 'タグ名を入力してください。' }),
  slug: z.string().min(1, { message: 'スラッグを入力してください。' }),
});

const CommentSchema = z.object({
  id: z.string().uuid().optional(),
  post_id: z.string().uuid(),
  author_name: z.string().min(1, { message: '名前を入力してください。' }),
  author_email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
  content: z.string().min(1, { message: 'コメントを入力してください。' }),
});

const UserProfileSchema = z.object({
  name: z.string().min(1, { message: '名前を入力してください。' }),
  avatar_url: z.string().optional(),
  bio: z.string().optional(),
});

// =====================
// 型定義
// =====================

export type State = {
  errors?: {
    [key: string]: string[];
  };
  message?: string | null;
};

// =====================
// ヘルパー関数
// =====================

// 認証チェック
async function checkAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('認証が必要です。');
  }
  return session.user;
}

// 管理者権限チェック
async function checkAdminRole() {
  const user = await checkAuth();
  const result = await sql`
    SELECT role FROM users WHERE id = ${user.id}
  `;

  if (result.rows.length === 0 || !['admin', 'editor'].includes(result.rows[0].role)) {
    throw new Error('この操作を実行する権限がありません。');
  }

  return user;
}

// =====================
// 認証関連のアクション
// =====================

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

// =====================
// 記事関連のアクション
// =====================

export async function createPost(_prevState: State, formData: FormData): Promise<State> {
  try {
    const user = await checkAdminRole();

    // バリデーション
    const validatedFields = PostSchema.safeParse({
      blog_id: formData.get('blog_id'),
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      excerpt: formData.get('excerpt'),
      featured_image: formData.get('featured_image'),
      status: formData.get('status'),
      visibility: formData.get('visibility'),
      category_ids: formData.get('category_ids') ? JSON.parse(formData.get('category_ids') as string) : [],
      tag_ids: formData.get('tag_ids') ? JSON.parse(formData.get('tag_ids') as string) : [],
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { blog_id, title, slug, content, excerpt, featured_image, status, visibility, category_ids, tag_ids } = validatedFields.data;

    // スラッグの重複チェック
    const existingPost = await sql`
      SELECT id FROM posts WHERE slug = ${slug}
    `;

    if (existingPost.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    // 記事を作成
    const published_at = status === 'published' ? new Date().toISOString() : null;

    const result = await sql`
      INSERT INTO posts (blog_id, title, slug, content, excerpt, featured_image, status, visibility, author_id, published_at, created_at, updated_at)
      VALUES (${blog_id}, ${title}, ${slug}, ${content}, ${excerpt || null}, ${featured_image || null}, ${status}, ${visibility}, ${user.id}, ${published_at}, NOW(), NOW())
      RETURNING id
    `;

    const postId = result.rows[0].id;

    // カテゴリを関連付け
    if (category_ids && category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await sql`
          INSERT INTO post_categories (post_id, category_id)
          VALUES (${postId}, ${categoryId})
          ON CONFLICT (post_id, category_id) DO NOTHING
        `;
      }
    }

    // タグを関連付け
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${postId}, ${tagId})
          ON CONFLICT (post_id, tag_id) DO NOTHING
        `;
      }
    }

    // キャッシュを再検証
    revalidatePath('/admin/posts');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);

  } catch (error) {
    console.error('記事の作成に失敗しました:', error);
    return {
      message: '記事の作成に失敗しました。',
    };
  }

  redirect('/admin/posts');
}

export async function updatePost(id: string, _prevState: State, formData: FormData): Promise<State> {
  try {
    await checkAdminRole();

    // バリデーション
    const validatedFields = PostSchema.safeParse({
      id,
      blog_id: formData.get('blog_id'),
      title: formData.get('title'),
      slug: formData.get('slug'),
      content: formData.get('content'),
      excerpt: formData.get('excerpt'),
      featured_image: formData.get('featured_image'),
      status: formData.get('status'),
      visibility: formData.get('visibility'),
      category_ids: formData.get('category_ids') ? JSON.parse(formData.get('category_ids') as string) : [],
      tag_ids: formData.get('tag_ids') ? JSON.parse(formData.get('tag_ids') as string) : [],
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { blog_id, title, slug, content, excerpt, featured_image, status, visibility, category_ids, tag_ids } = validatedFields.data;

    // スラッグの重複チェック（自分以外）
    const existingPost = await sql`
      SELECT id FROM posts WHERE slug = ${slug} AND id != ${id}
    `;

    if (existingPost.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    // 公開日時の設定
    const currentPost = await sql`SELECT status FROM posts WHERE id = ${id}`;
    const wasPublished = currentPost.rows[0]?.status === 'published';
    const isPublishing = status === 'published' && !wasPublished;
    const published_at = isPublishing ? new Date().toISOString() : undefined;

    // 記事を更新
    if (published_at) {
      await sql`
        UPDATE posts
        SET blog_id = ${blog_id},
            title = ${title},
            slug = ${slug},
            content = ${content},
            excerpt = ${excerpt || null},
            featured_image = ${featured_image || null},
            status = ${status},
            visibility = ${visibility},
            published_at = ${published_at},
            updated_at = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE posts
        SET blog_id = ${blog_id},
            title = ${title},
            slug = ${slug},
            content = ${content},
            excerpt = ${excerpt || null},
            featured_image = ${featured_image || null},
            status = ${status},
            visibility = ${visibility},
            updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    // カテゴリを更新
    await sql`DELETE FROM post_categories WHERE post_id = ${id}`;
    if (category_ids && category_ids.length > 0) {
      for (const categoryId of category_ids) {
        await sql`
          INSERT INTO post_categories (post_id, category_id)
          VALUES (${id}, ${categoryId})
          ON CONFLICT (post_id, category_id) DO NOTHING
        `;
      }
    }

    // タグを更新
    await sql`DELETE FROM post_tags WHERE post_id = ${id}`;
    if (tag_ids && tag_ids.length > 0) {
      for (const tagId of tag_ids) {
        await sql`
          INSERT INTO post_tags (post_id, tag_id)
          VALUES (${id}, ${tagId})
          ON CONFLICT (post_id, tag_id) DO NOTHING
        `;
      }
    }

    // キャッシュを再検証
    revalidatePath('/admin/posts');
    revalidatePath('/blog');
    revalidatePath(`/blog/${slug}`);

  } catch (error) {
    console.error('記事の更新に失敗しました:', error);
    return {
      message: '記事の更新に失敗しました。',
    };
  }

  redirect('/admin/posts');
}

export async function deletePost(id: string): Promise<void> {
  try {
    await checkAdminRole();

    // 記事を削除（関連するカテゴリ・タグ・コメントも自動的に削除される）
    await sql`DELETE FROM posts WHERE id = ${id}`;

    // キャッシュを再検証
    revalidatePath('/admin/posts');
    revalidatePath('/blog');

  } catch (error) {
    console.error('記事の削除に失敗しました:', error);
    throw new Error('記事の削除に失敗しました。');
  }
}

// =====================
// カテゴリ関連のアクション
// =====================

export async function createCategory(_prevState: State, formData: FormData): Promise<State> {
  try {
    await checkAdminRole();

    const validatedFields = CategorySchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, slug, description } = validatedFields.data;

    // スラッグの重複チェック
    const existing = await sql`
      SELECT id FROM categories WHERE slug = ${slug}
    `;

    if (existing.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    await sql`
      INSERT INTO categories (name, slug, description, created_at)
      VALUES (${name}, ${slug}, ${description || null}, NOW())
    `;

    revalidatePath('/admin/categories');

    return {
      message: 'カテゴリを作成しました。',
    };

  } catch (error) {
    console.error('カテゴリの作成に失敗しました:', error);
    return {
      message: 'カテゴリの作成に失敗しました。',
    };
  }
}

export async function updateCategory(id: string, _prevState: State, formData: FormData): Promise<State> {
  try {
    await checkAdminRole();

    const validatedFields = CategorySchema.safeParse({
      id,
      name: formData.get('name'),
      slug: formData.get('slug'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, slug, description } = validatedFields.data;

    // スラッグの重複チェック（自分以外）
    const existing = await sql`
      SELECT id FROM categories WHERE slug = ${slug} AND id != ${id}
    `;

    if (existing.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    await sql`
      UPDATE categories
      SET name = ${name},
          slug = ${slug},
          description = ${description || null}
      WHERE id = ${id}
    `;

    revalidatePath('/admin/categories');

    return {
      message: 'カテゴリを更新しました。',
    };

  } catch (error) {
    console.error('カテゴリの更新に失敗しました:', error);
    return {
      message: 'カテゴリの更新に失敗しました。',
    };
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`DELETE FROM categories WHERE id = ${id}`;

    revalidatePath('/admin/categories');

  } catch (error) {
    console.error('カテゴリの削除に失敗しました:', error);
    throw new Error('カテゴリの削除に失敗しました。');
  }
}

// =====================
// タグ関連のアクション
// =====================

export async function createTag(_prevState: State, formData: FormData): Promise<State> {
  try {
    await checkAdminRole();

    const validatedFields = TagSchema.safeParse({
      name: formData.get('name'),
      slug: formData.get('slug'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, slug } = validatedFields.data;

    // スラッグの重複チェック
    const existing = await sql`
      SELECT id FROM tags WHERE slug = ${slug}
    `;

    if (existing.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    await sql`
      INSERT INTO tags (name, slug, created_at)
      VALUES (${name}, ${slug}, NOW())
    `;

    revalidatePath('/admin/tags');

    return {
      message: 'タグを作成しました。',
    };

  } catch (error) {
    console.error('タグの作成に失敗しました:', error);
    return {
      message: 'タグの作成に失敗しました。',
    };
  }
}

export async function updateTag(id: string, _prevState: State, formData: FormData): Promise<State> {
  try {
    await checkAdminRole();

    const validatedFields = TagSchema.safeParse({
      id,
      name: formData.get('name'),
      slug: formData.get('slug'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, slug } = validatedFields.data;

    // スラッグの重複チェック（自分以外）
    const existing = await sql`
      SELECT id FROM tags WHERE slug = ${slug} AND id != ${id}
    `;

    if (existing.rows.length > 0) {
      return {
        errors: { slug: ['このスラッグは既に使用されています。'] },
        message: 'スラッグが重複しています。',
      };
    }

    await sql`
      UPDATE tags
      SET name = ${name},
          slug = ${slug}
      WHERE id = ${id}
    `;

    revalidatePath('/admin/tags');

    return {
      message: 'タグを更新しました。',
    };

  } catch (error) {
    console.error('タグの更新に失敗しました:', error);
    return {
      message: 'タグの更新に失敗しました。',
    };
  }
}

export async function deleteTag(id: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`DELETE FROM tags WHERE id = ${id}`;

    revalidatePath('/admin/tags');

  } catch (error) {
    console.error('タグの削除に失敗しました:', error);
    throw new Error('タグの削除に失敗しました。');
  }
}

// =====================
// コメント関連のアクション
// =====================

export async function createComment(prevState: State, formData: FormData): Promise<State> {
  try {
    const validatedFields = CommentSchema.safeParse({
      post_id: formData.get('post_id'),
      author_name: formData.get('author_name'),
      author_email: formData.get('author_email'),
      content: formData.get('content'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { post_id, author_name, author_email, content } = validatedFields.data;

    await sql`
      INSERT INTO comments (post_id, author_name, author_email, content, created_at, approved)
      VALUES (${post_id}, ${author_name}, ${author_email}, ${content}, NOW(), false)
    `;

    revalidatePath(`/blog`);

    return {
      message: 'コメントを投稿しました。承認後に表示されます。',
    };

  } catch (error) {
    console.error('コメントの投稿に失敗しました:', error);
    return {
      message: 'コメントの投稿に失敗しました。',
    };
  }
}

export async function approveComment(id: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`
      UPDATE comments
      SET approved = true
      WHERE id = ${id}
    `;

    revalidatePath('/admin/comments');
    revalidatePath('/blog');

  } catch (error) {
    console.error('コメントの承認に失敗しました:', error);
    throw new Error('コメントの承認に失敗しました。');
  }
}

export async function deleteComment(id: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`DELETE FROM comments WHERE id = ${id}`;

    revalidatePath('/admin/comments');
    revalidatePath('/blog');

  } catch (error) {
    console.error('コメントの削除に失敗しました:', error);
    throw new Error('コメントの削除に失敗しました。');
  }
}

// =====================
// ユーザープロフィール関連のアクション
// =====================

export async function updateProfile(prevState: State, formData: FormData): Promise<State> {
  try {
    const user = await checkAuth();

    const validatedFields = UserProfileSchema.safeParse({
      name: formData.get('name'),
      avatar_url: formData.get('avatar_url'),
      bio: formData.get('bio'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, avatar_url, bio } = validatedFields.data;

    await sql`
      UPDATE users
      SET name = ${name},
          avatar_url = ${avatar_url || null},
          bio = ${bio || null}
      WHERE id = ${user.id}
    `;

    revalidatePath('/admin/profile');
    revalidatePath('/blog');

    return {
      message: 'プロフィールを更新しました。',
    };

  } catch (error) {
    console.error('プロフィールの更新に失敗しました:', error);
    return {
      message: 'プロフィールの更新に失敗しました。',
    };
  }
}

// =====================
// アクセス権限関連のアクション
// =====================

export async function grantBlogAccess(blogId: string, userId: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`
      INSERT INTO blog_access (blog_id, user_id, granted_at)
      VALUES (${blogId}, ${userId}, NOW())
      ON CONFLICT (blog_id, user_id) DO NOTHING
    `;

    revalidatePath('/admin/blogs');

  } catch (error) {
    console.error('ブログアクセス権限の付与に失敗しました:', error);
    throw new Error('ブログアクセス権限の付与に失敗しました。');
  }
}

export async function revokeBlogAccess(blogId: string, userId: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`
      DELETE FROM blog_access
      WHERE blog_id = ${blogId} AND user_id = ${userId}
    `;

    revalidatePath('/admin/blogs');

  } catch (error) {
    console.error('ブログアクセス権限の削除に失敗しました:', error);
    throw new Error('ブログアクセス権限の削除に失敗しました。');
  }
}

export async function grantPostAccess(postId: string, userId: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`
      INSERT INTO post_access (post_id, user_id, granted_at)
      VALUES (${postId}, ${userId}, NOW())
      ON CONFLICT (post_id, user_id) DO NOTHING
    `;

    revalidatePath('/admin/posts');

  } catch (error) {
    console.error('記事アクセス権限の付与に失敗しました:', error);
    throw new Error('記事アクセス権限の付与に失敗しました。');
  }
}

export async function revokePostAccess(postId: string, userId: string): Promise<void> {
  try {
    await checkAdminRole();

    await sql`
      DELETE FROM post_access
      WHERE post_id = ${postId} AND user_id = ${userId}
    `;

    revalidatePath('/admin/posts');

  } catch (error) {
    console.error('記事アクセス権限の削除に失敗しました:', error);
    throw new Error('記事アクセス権限の削除に失敗しました。');
  }
}

export async function updatePostAccess(postId: string, userIds: string[]): Promise<void> {
  try {
    await checkAdminRole();

    // 既存のアクセス権限をすべて削除
    await sql`
      DELETE FROM post_access WHERE post_id = ${postId}
    `;

    // 新しいアクセス権限を追加
    for (const userId of userIds) {
      await sql`
        INSERT INTO post_access (post_id, user_id, granted_at)
        VALUES (${postId}, ${userId}, NOW())
      `;
    }

    revalidatePath('/admin/posts');
    revalidatePath(`/admin/posts/${postId}/access`);

  } catch (error) {
    console.error('記事アクセス権限の更新に失敗しました:', error);
    throw new Error('記事アクセス権限の更新に失敗しました。');
  }
}

export async function updateUserBlogAccess(userId: string, blogIds: string[]): Promise<void> {
  try {
    await checkAdminRole();

    // 既存のアクセス権限をすべて削除
    await sql`
      DELETE FROM blog_access WHERE user_id = ${userId}
    `;

    // 新しいアクセス権限を追加
    for (const blogId of blogIds) {
      await sql`
        INSERT INTO blog_access (blog_id, user_id, granted_at)
        VALUES (${blogId}, ${userId}, NOW())
      `;
    }

    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}/access`);

  } catch (error) {
    console.error('ブログアクセス権限の更新に失敗しました:', error);
    throw new Error('ブログアクセス権限の更新に失敗しました。');
  }
}

// =====================
// ユーザー登録
// =====================

const RegisterSchema = z.object({
  name: z.string().min(1, { message: '名前を入力してください。' }),
  email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
  password: z.string().min(6, { message: 'パスワードは6文字以上で入力してください。' }),
  confirmPassword: z.string().min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});

export async function registerUser(_prevState: State, formData: FormData): Promise<State> {
  try {
    const validatedFields = RegisterSchema.safeParse({
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: '入力内容に誤りがあります。',
      };
    }

    const { name, email, password, confirmPassword } = validatedFields.data;

    // パスワード一致確認
    if (password !== confirmPassword) {
      return {
        errors: { confirmPassword: ['パスワードが一致しません。'] },
        message: 'パスワードが一致しません。',
      };
    }

    // メールアドレスの重複確認
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.rows.length > 0) {
      return {
        errors: { email: ['このメールアドレスは既に登録されています。'] },
        message: 'このメールアドレスは既に登録されています。',
      };
    }

    // パスワードのハッシュ化
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // ユーザーを作成
    await sql`
      INSERT INTO users (name, email, password, role, created_at, updated_at)
      VALUES (${name}, ${email}, ${hashedPassword}, 'user', NOW(), NOW())
    `;

    return {
      message: '会員登録が完了しました！ログインしてください。',
    };
  } catch (error) {
    console.error('ユーザー登録に失敗しました:', error);
    return {
      message: 'ユーザー登録に失敗しました。',
    };
  }
}
