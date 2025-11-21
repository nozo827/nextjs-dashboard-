import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
import UsersClient from './users-client';
import type { User } from '@/app/lib/definitions';

interface UserWithBlogs extends User {
  accessible_blogs: string[];
}

// ユーザー管理ページ（サーバーコンポーネント）
export default async function UsersPage() {
  // 認証チェック
  const session = await auth();

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login?callbackUrl=/admin/users');
  }

  // 全ユーザーを取得
  const usersResult = await sql`
    SELECT
      id,
      email,
      name,
      role,
      avatar_url,
      bio,
      created_at,
      updated_at
    FROM users
    ORDER BY created_at DESC
  `;

  const users = usersResult.rows as User[];

  // 各ユーザーのアクセス可能なブログを取得
  const usersWithAccess: UserWithBlogs[] = await Promise.all(
    users.map(async (user) => {
      const blogAccessResult = await sql`
        SELECT blogs.name
        FROM blog_access
        JOIN blogs ON blog_access.blog_id = blogs.id
        WHERE blog_access.user_id = ${user.id}
      `;

      return {
        ...user,
        accessible_blogs: blogAccessResult.rows.map((row: { name: string }) => row.name),
      };
    })
  );

  return <UsersClient initialUsers={usersWithAccess} />;
}
