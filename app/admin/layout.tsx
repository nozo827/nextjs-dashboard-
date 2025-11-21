import { fetchBlogs } from '@/app/lib/data';
import AdminLayoutClient from './admin-layout-client';

export const dynamic = 'force-dynamic';

// 管理画面のレイアウト
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ブログ一覧を取得
  const blogs = await fetchBlogs();

  return <AdminLayoutClient blogs={blogs}>{children}</AdminLayoutClient>;
}
