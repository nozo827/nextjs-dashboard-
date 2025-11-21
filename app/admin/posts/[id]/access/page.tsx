import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchPostById } from '@/app/lib/data';
import { sql } from '@vercel/postgres';
import PostAccessClient from './post-access-client';
import type { User } from '@/app/lib/definitions';

// 記事のアクセス権限管理ページ（サーバーコンポーネント）
export default async function PostAccessPage({ params }: { params: Promise<{ id: string }> }) {
  // 認証チェック
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    const { id } = await params;
    redirect(`/login?callbackUrl=/admin/posts/${id}/access`);
  }

  const { id: postId } = await params;

  // 記事を取得
  const post = await fetchPostById(postId);

  if (!post) {
    redirect('/admin/posts');
  }

  // 全ユーザーを取得
  const usersResult = await sql`
    SELECT id, email, name, role, avatar_url
    FROM users
    ORDER BY name ASC
  `;
  const users = usersResult.rows as User[];

  // この記事へのアクセス権限を持つユーザーIDを取得
  const postAccessResult = await sql`
    SELECT user_id FROM post_access WHERE post_id = ${postId}
  `;
  const initialAccess = postAccessResult.rows.map((row: any) => row.user_id as string);

  return (
    <PostAccessClient
      post={post}
      users={users}
      initialAccess={initialAccess}
    />
  );
}
