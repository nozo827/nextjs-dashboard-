import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchBlogs, fetchCategories, fetchTags } from '@/app/lib/data';
import { sql } from '@vercel/postgres';
import PostsClient from './posts-client';
import type { PostWithAuthor } from '@/app/lib/definitions';

// 記事一覧管理ページ（サーバーコンポーネント）
export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ blog?: string }>;
}) {
  // 認証チェック
  const session = await auth();

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login?callbackUrl=/admin/posts');
  }

  const params = await searchParams;
  const blogId = params.blog;

  // データベースからブログ、カテゴリ、タグを取得
  const [blogs, categories, tags] = await Promise.all([
    fetchBlogs(),
    fetchCategories(),
    fetchTags(),
  ]);

  // 記事一覧を取得
  let postsQuery;
  if (blogId) {
    postsQuery = sql`
      SELECT
        posts.*,
        users.name as author_name,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.blog_id = ${blogId}
      ORDER BY posts.updated_at DESC
    `;
  } else {
    postsQuery = sql`
      SELECT
        posts.*,
        users.name as author_name,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      ORDER BY posts.updated_at DESC
    `;
  }

  const postsResult = await postsQuery;
  const posts = postsResult.rows as PostWithAuthor[];

  return (
    <PostsClient
      initialPosts={posts}
      blogs={blogs}
      categories={categories}
      tags={tags}
      initialBlogId={blogId || blogs[0]?.id || ''}
    />
  );
}
