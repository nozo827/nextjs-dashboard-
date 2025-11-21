import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AllPostsClient from '@/app/ui/blog/all-posts-client';
import {
  fetchBlogBySlug,
  fetchPublishedPosts,
  canAccessBlog,
  fetchCategories,
} from '@/app/lib/data';

// すべての記事を表示するページ
export default async function AllPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  const params = await searchParams;
  const blogSlug = params.site || 'tech';
  const currentBlog = await fetchBlogBySlug(blogSlug);

  // ブログが見つからない場合はデフォルトブログにリダイレクト
  if (!currentBlog) {
    redirect('/blog?site=tech');
  }

  // 認証チェック
  const session = await auth();
  const userId = session?.user?.id;

  // アクセス権チェック
  const hasAccess = await canAccessBlog(userId, currentBlog.id);
  if (!hasAccess) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/blog/all?site=${blogSlug}`)}`);
  }

  // ブログの全公開記事を取得（ページネーションなし）
  const blogPosts = await fetchPublishedPosts(1, currentBlog.id);

  // カテゴリを取得
  const categories = await fetchCategories();

  return (
    <AllPostsClient
      blogPosts={blogPosts}
      currentBlog={currentBlog}
      categories={categories}
    />
  );
}
