import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchBlogs, fetchCategories, fetchTags } from '@/app/lib/data';
import CreatePostClient from './create-post-client';

export const dynamic = 'force-dynamic';

// 記事作成ページ（サーバーコンポーネント）
export default async function CreatePostPage() {
  // 認証チェック
  const session = await auth();

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login?callbackUrl=/admin/posts/create');
  }

  // データベースからブログ、カテゴリ、タグを取得
  const [blogs, categories, tags] = await Promise.all([
    fetchBlogs(),
    fetchCategories(),
    fetchTags(),
  ]);

  return (
    <CreatePostClient
      blogs={blogs}
      categories={categories}
      tags={tags}
    />
  );
}
