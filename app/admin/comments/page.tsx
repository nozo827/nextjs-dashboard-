import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import CommentsClient from './comments-client';
import type { Comment } from '@/app/lib/definitions';

// コメント管理ページ（サーバーコンポーネント）
export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  // 認証チェック
  const session = await auth();

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login?callbackUrl=/admin/comments');
  }

  const params = await searchParams;
  const statusFilter = params.status;

  // コメント一覧を取得（記事情報と投稿者情報を含む）
  let commentsQuery;
  if (statusFilter === 'approved') {
    commentsQuery = sql`
      SELECT
        comments.*,
        posts.title as post_title,
        posts.slug as post_slug,
        blogs.name as blog_name
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      JOIN blogs ON posts.blog_id = blogs.id
      WHERE comments.approved = true
      ORDER BY comments.created_at DESC
    `;
  } else if (statusFilter === 'pending') {
    commentsQuery = sql`
      SELECT
        comments.*,
        posts.title as post_title,
        posts.slug as post_slug,
        blogs.name as blog_name
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      JOIN blogs ON posts.blog_id = blogs.id
      WHERE comments.approved = false
      ORDER BY comments.created_at DESC
    `;
  } else {
    commentsQuery = sql`
      SELECT
        comments.*,
        posts.title as post_title,
        posts.slug as post_slug,
        blogs.name as blog_name
      FROM comments
      JOIN posts ON comments.post_id = posts.id
      JOIN blogs ON posts.blog_id = blogs.id
      ORDER BY comments.created_at DESC
    `;
  }

  const commentsResult = await commentsQuery;
  const comments = commentsResult.rows as (Comment & {
    post_title: string;
    post_slug: string;
    blog_name: string;
  })[];

  return <CommentsClient initialComments={comments} />;
}
