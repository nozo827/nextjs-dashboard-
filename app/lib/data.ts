import { sql } from '@vercel/postgres';
import {
  Post,
  PostWithAuthor,
  PostDetail,
  Category,
  Tag,
  Comment,
  Blog,
  User,
} from './definitions';

const ITEMS_PER_PAGE = 10;

// =====================
// ブログ関連
// =====================

// 全てのブログを取得
export async function fetchBlogs(): Promise<Blog[]> {
  try {
    const result = await sql`
      SELECT * FROM blogs
      ORDER BY created_at DESC
    `;
    return result.rows as Blog[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch blogs.');
  }
}

// スラッグからブログを取得
export async function fetchBlogBySlug(slug: string): Promise<Blog | null> {
  try {
    const result = await sql`
      SELECT * FROM blogs
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as Blog) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch blog.');
  }
}

// IDからブログを取得
export async function fetchBlogById(id: string): Promise<Blog | null> {
  try {
    const result = await sql`
      SELECT * FROM blogs
      WHERE id = ${id}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as Blog) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch blog.');
  }
}

// =====================
// ユーザー関連
// =====================

// メールアドレスからユーザーを取得
export async function fetchUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users
      WHERE email = ${email}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}

// IDからユーザーを取得
export async function fetchUserById(id: string): Promise<User | null> {
  try {
    const result = await sql`
      SELECT * FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as User) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch user.');
  }
}

// =====================
// 記事関連
// =====================

// 公開記事の一覧を取得（ページネーション対応）
export async function fetchPublishedPosts(
  currentPage: number = 1,
  blogId?: string
): Promise<PostWithAuthor[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    let query;
    if (blogId) {
      query = sql`
        SELECT
          posts.*,
          users.name as author_name,
          users.email as author_email
        FROM posts
        JOIN users ON posts.author_id = users.id
        WHERE posts.status = 'published'
          AND posts.visibility = 'public'
          AND posts.blog_id = ${blogId}
        ORDER BY posts.published_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
    } else {
      query = sql`
        SELECT
          posts.*,
          users.name as author_name,
          users.email as author_email
        FROM posts
        JOIN users ON posts.author_id = users.id
        WHERE posts.status = 'published'
          AND posts.visibility = 'public'
        ORDER BY posts.published_at DESC
        LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
      `;
    }

    const result = await query;
    const posts = result.rows as PostWithAuthor[];

    if (posts.length === 0) {
      return [];
    }

    // すべての記事IDを取得
    const postIds = posts.map((post) => post.id);

    // 1回のクエリで全記事のカテゴリを取得（N+1問題を回避）
    // UNNESTを使用してpostIdsを展開
    const categoriesResult = await sql.query(
      `SELECT
        pc.post_id,
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at
      FROM post_categories pc
      JOIN categories c ON pc.category_id = c.id
      WHERE pc.post_id = ANY($1)
      ORDER BY c.name ASC`,
      [postIds]
    );

    // 記事IDごとにカテゴリをグループ化
    const categoriesByPostId = categoriesResult.rows.reduce(
      (acc, row) => {
        if (!acc[row.post_id]) {
          acc[row.post_id] = [];
        }
        acc[row.post_id].push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          created_at: row.created_at,
        });
        return acc;
      },
      {} as Record<string, Category[]>
    );

    // 各記事にカテゴリを追加
    const postsWithCategories = posts.map((post) => ({
      ...post,
      categories: categoriesByPostId[post.id] || [],
    }));

    return postsWithCategories;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch published posts.');
  }
}

// 公開記事の総数を取得
export async function fetchPublishedPostsCount(blogId?: string): Promise<number> {
  try {
    let result;
    if (blogId) {
      result = await sql`
        SELECT COUNT(*) as count
        FROM posts
        WHERE status = 'published'
          AND visibility = 'public'
          AND blog_id = ${blogId}
      `;
    } else {
      result = await sql`
        SELECT COUNT(*) as count
        FROM posts
        WHERE status = 'published'
          AND visibility = 'public'
      `;
    }
    return Number(result.rows[0].count);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch posts count.');
  }
}

// スラッグから記事詳細を取得
export async function fetchPostBySlug(slug: string): Promise<PostDetail | null> {
  try {
    const result = await sql`
      SELECT
        posts.*,
        users.name as author_name,
        users.email as author_email,
        users.avatar_url as author_avatar
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.slug = ${slug}
      LIMIT 1
    `;

    if (result.rows.length === 0) {
      return null;
    }

    const post = result.rows[0];

    // カテゴリを取得
    const categoriesResult = await sql`
      SELECT categories.*
      FROM categories
      JOIN post_categories ON categories.id = post_categories.category_id
      WHERE post_categories.post_id = ${post.id}
    `;

    // タグを取得
    const tagsResult = await sql`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id = post_tags.tag_id
      WHERE post_tags.post_id = ${post.id}
    `;

    return {
      ...post,
      categories: categoriesResult.rows as Category[],
      tags: tagsResult.rows as Tag[],
    } as PostDetail;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch post by slug.');
  }
}

// IDから記事を取得
export async function fetchPostById(id: string): Promise<Post | null> {
  try {
    const result = await sql`
      SELECT * FROM posts
      WHERE id = ${id}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as Post) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch post by ID.');
  }
}

// ブログIDで記事を取得（管理画面用）
export async function fetchPostsByBlogId(
  blogId: string,
  filters?: {
    categoryId?: string;
    tagId?: string;
    status?: string;
    authorId?: string;
  }
): Promise<PostWithAuthor[]> {
  try {
    let query = `
      SELECT DISTINCT
        posts.*,
        users.name as author_name,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
    `;

    const conditions: string[] = [`posts.blog_id = '${blogId}'`];

    // カテゴリフィルタ
    if (filters?.categoryId) {
      query += ` JOIN post_categories pc ON posts.id = pc.post_id`;
      conditions.push(`pc.category_id = '${filters.categoryId}'`);
    }

    // タグフィルタ
    if (filters?.tagId) {
      query += ` JOIN post_tags pt ON posts.id = pt.post_id`;
      conditions.push(`pt.tag_id = '${filters.tagId}'`);
    }

    // ステータスフィルタ
    if (filters?.status) {
      conditions.push(`posts.status = '${filters.status}'`);
    }

    // 著者フィルタ
    if (filters?.authorId) {
      conditions.push(`posts.author_id = '${filters.authorId}'`);
    }

    query += ` WHERE ` + conditions.join(' AND ');
    query += ` ORDER BY posts.created_at DESC`;

    const result = await sql.query(query);
    const posts = result.rows as PostWithAuthor[];

    if (posts.length === 0) {
      return [];
    }

    // すべての記事IDを取得
    const postIds = posts.map((post) => post.id);

    // 1回のクエリで全記事のカテゴリを取得（N+1問題を回避）
    const categoriesResult = await sql.query(
      `SELECT
        pc.post_id,
        c.id,
        c.name,
        c.slug,
        c.description,
        c.created_at
      FROM post_categories pc
      JOIN categories c ON pc.category_id = c.id
      WHERE pc.post_id = ANY($1)
      ORDER BY c.name ASC`,
      [postIds]
    );

    // 記事IDごとにカテゴリをグループ化
    const categoriesByPostId = categoriesResult.rows.reduce(
      (acc: Record<string, Category[]>, row: any) => {
        if (!acc[row.post_id]) {
          acc[row.post_id] = [];
        }
        acc[row.post_id].push({
          id: row.id,
          name: row.name,
          slug: row.slug,
          description: row.description,
          created_at: row.created_at,
        });
        return acc;
      },
      {}
    );

    // 各記事にカテゴリを追加
    const postsWithCategories = posts.map((post) => ({
      ...post,
      categories: categoriesByPostId[post.id] || [],
    }));

    return postsWithCategories;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch posts by blog ID.');
  }
}

// ブログの記事統計を取得
export async function fetchBlogPostStats(blogId: string) {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_posts,
        COUNT(*) FILTER (WHERE status = 'published') as published_posts,
        COUNT(*) FILTER (WHERE status = 'draft') as draft_posts
      FROM posts
      WHERE blog_id = ${blogId}
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch blog post stats.');
  }
}

// 記事の閲覧数を増やす
export async function incrementPostViewCount(postId: string): Promise<void> {
  try {
    await sql`
      UPDATE posts
      SET view_count = view_count + 1
      WHERE id = ${postId}
    `;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to increment view count.');
  }
}

// =====================
// カテゴリ関連
// =====================

// 全てのカテゴリを取得
export async function fetchCategories(): Promise<Category[]> {
  try {
    const result = await sql`
      SELECT * FROM categories
      ORDER BY name ASC
    `;
    return result.rows as Category[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch categories.');
  }
}

// IDからカテゴリを取得
export async function fetchCategoryById(id: string): Promise<Category | null> {
  try {
    const result = await sql`
      SELECT * FROM categories
      WHERE id = ${id}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as Category) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch category.');
  }
}

// カテゴリ別の記事を取得
export async function fetchPostsByCategory(
  categoryId: string,
  currentPage: number = 1
): Promise<PostWithAuthor[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const result = await sql`
      SELECT
        posts.*,
        users.name as author_name,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      JOIN post_categories ON posts.id = post_categories.post_id
      WHERE post_categories.category_id = ${categoryId}
        AND posts.status = 'published'
        AND posts.visibility = 'public'
      ORDER BY posts.published_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return result.rows as PostWithAuthor[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch posts by category.');
  }
}

// =====================
// タグ関連
// =====================

// 全てのタグを取得
export async function fetchTags(): Promise<Tag[]> {
  try {
    const result = await sql`
      SELECT * FROM tags
      ORDER BY name ASC
    `;
    return result.rows as Tag[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tags.');
  }
}

// IDからタグを取得
export async function fetchTagById(id: string): Promise<Tag | null> {
  try {
    const result = await sql`
      SELECT * FROM tags
      WHERE id = ${id}
      LIMIT 1
    `;
    return result.rows.length > 0 ? (result.rows[0] as Tag) : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch tag.');
  }
}

// タグ別の記事を取得
export async function fetchPostsByTag(
  tagId: string,
  currentPage: number = 1
): Promise<PostWithAuthor[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const result = await sql`
      SELECT
        posts.*,
        users.name as author_name,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      JOIN post_tags ON posts.id = post_tags.post_id
      WHERE post_tags.tag_id = ${tagId}
        AND posts.status = 'published'
        AND posts.visibility = 'public'
      ORDER BY posts.published_at DESC
      LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
    `;
    return result.rows as PostWithAuthor[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch posts by tag.');
  }
}

// =====================
// コメント関連
// =====================

// 記事のコメントを取得
export async function fetchCommentsByPostId(postId: string): Promise<Comment[]> {
  try {
    const result = await sql`
      SELECT * FROM comments
      WHERE post_id = ${postId} AND approved = true
      ORDER BY created_at DESC
    `;
    return result.rows as Comment[];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch comments.');
  }
}

// ブログのコメント統計を取得
export async function fetchBlogCommentStats(blogId: string) {
  try {
    const result = await sql`
      SELECT
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE approved = false) as pending_comments
      FROM comments
      WHERE post_id IN (
        SELECT id FROM posts WHERE blog_id = ${blogId}
      )
    `;
    return result.rows[0];
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch blog comment stats.');
  }
}

// =====================
// アクセス権限関連
// =====================

// ユーザーがブログにアクセスできるかチェック
export async function canAccessBlog(
  userId: string | undefined,
  blogId: string
): Promise<boolean> {
  try {
    // ブログの情報を取得
    const blog = await fetchBlogById(blogId);
    if (!blog) return false;

    // 公開ブログは誰でもアクセス可能
    if (!blog.is_private) return true;

    // プライベートブログはログインが必要
    if (!userId) return false;

    // オーナーまたはアクセス権を持つユーザーのみ
    if (blog.owner_id === userId) return true;

    const result = await sql`
      SELECT * FROM blog_access
      WHERE blog_id = ${blogId} AND user_id = ${userId}
      LIMIT 1
    `;

    return result.rows.length > 0;
  } catch (error) {
    console.error('Database Error:', error);
    return false;
  }
}

// ユーザーが記事にアクセスできるかチェック
export async function canAccessPost(
  userId: string | undefined,
  postId: string
): Promise<boolean> {
  try {
    const post = await fetchPostById(postId);
    if (!post) return false;

    // 公開記事は誰でもアクセス可能
    if (post.visibility === 'public') return true;

    // 非公開・限定公開はログインが必要
    if (!userId) return false;

    // 著者は常にアクセス可能
    if (post.author_id === userId) return true;

    // 非公開の場合は著者のみ
    if (post.visibility === 'private') return false;

    // 限定公開の場合はアクセス権をチェック
    if (post.visibility === 'restricted') {
      const result = await sql`
        SELECT * FROM post_access
        WHERE post_id = ${postId} AND user_id = ${userId}
        LIMIT 1
      `;
      return result.rows.length > 0;
    }

    return false;
  } catch (error) {
    console.error('Database Error:', error);
    return false;
  }
}

// ユーザーがアクセスできるブログ一覧を取得
export async function fetchAccessibleBlogs(userId: string | undefined): Promise<Blog[]> {
  try {
    if (!userId) {
      // ログインしていない場合は公開ブログのみ
      const result = await sql`
        SELECT * FROM blogs
        WHERE is_private = false
        ORDER BY created_at DESC
      `;
      return result.rows as Blog[];
    } else {
      // ログインしている場合は公開ブログ + アクセス権のあるプライベートブログ
      const result = await sql`
        SELECT DISTINCT blogs.*
        FROM blogs
        LEFT JOIN blog_access ON blogs.id = blog_access.blog_id AND blog_access.user_id = ${userId}
        WHERE blogs.is_private = false
           OR blogs.owner_id = ${userId}
           OR blog_access.user_id = ${userId}
        ORDER BY blogs.created_at DESC
      `;
      return result.rows as Blog[];
    }
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch accessible blogs.');
  }
}
