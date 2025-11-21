import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import UserAccessClient from './user-access-client';
import type { User, Blog } from '@/app/lib/definitions';

// ユーザーのブログアクセス権限管理ページ（サーバーコンポーネント）
export default async function UserAccessPage({ params }: { params: Promise<{ id: string }> }) {
  // 認証チェック
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    const { id } = await params;
    redirect(`/login?callbackUrl=/admin/users/${id}/access`);
  }

  const { id: userId } = await params;

  // ユーザーを取得
  const userResult = await sql`
    SELECT id, email, name, role, avatar_url
    FROM users
    WHERE id = ${userId}
  `;

  if (userResult.rows.length === 0) {
    redirect('/admin/users');
  }

  const user = userResult.rows[0] as User;

  // すべてのブログを取得
  const blogsResult = await sql`
    SELECT id, name, slug, description, is_private
    FROM blogs
    ORDER BY name ASC
  `;
  const blogs = blogsResult.rows as Blog[];

  // このユーザーがアクセス権を持っているブログIDのリストを取得
  const blogAccessResult = await sql`
    SELECT blog_id FROM blog_access WHERE user_id = ${userId}
  `;
  const initialAccess = blogAccessResult.rows.map((row: any) => row.blog_id as string);

  return (
    <UserAccessClient
      user={user}
      blogs={blogs}
      initialAccess={initialAccess}
    />
  );
}
