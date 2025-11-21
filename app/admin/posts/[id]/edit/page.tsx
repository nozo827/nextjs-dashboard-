import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import {
  fetchPostById,
  fetchBlogs,
  fetchCategories,
  fetchTags,
} from '@/app/lib/data';
import EditPostClient from './edit-post-client';
import { sql } from '@vercel/postgres';

// 記事編集ページ（サーバーコンポーネント）
export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  // 認証チェック
  const session = await auth();

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'admin') {
    const { id } = await params;
    redirect(`/login?callbackUrl=/admin/posts/${id}/edit`);
  }

  const { id } = await params;

  // データベースから記事、ブログ、カテゴリ、タグを取得
  const [post, blogs, categories, tags] = await Promise.all([
    fetchPostById(id),
    fetchBlogs(),
    fetchCategories(),
    fetchTags(),
  ]);

  if (!post) {
    redirect('/admin/posts');
  }

  // 記事に紐づくカテゴリIDとタグIDを取得
  const postCategories = await sql`
    SELECT category_id FROM post_categories WHERE post_id = ${id}
  `;
  const postTags = await sql`
    SELECT tag_id FROM post_tags WHERE post_id = ${id}
  `;

  const categoryIds = postCategories.rows.map((row) => row.category_id);
  const tagIds = postTags.rows.map((row) => row.tag_id);

  return (
    <EditPostClient
      post={post}
      blogs={blogs}
      categories={categories}
      tags={tags}
      initialCategoryIds={categoryIds}
      initialTagIds={tagIds}
    />
  );
}
