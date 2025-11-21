import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchUserByEmail } from '@/app/lib/data';
import ProfileEditClient from './profile-edit-client';

// プロフィール編集ページ（サーバーコンポーネント）
export default async function ProfileEditPage() {
  // 認証チェック
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login?callbackUrl=/admin/profile');
  }

  // ユーザー情報を取得
  const user = await fetchUserByEmail(session.user.email);

  if (!user) {
    redirect('/login');
  }

  return <ProfileEditClient user={user} />;
}
