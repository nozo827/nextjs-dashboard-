import BlogHeader from '@/app/ui/blog/header';
import BlogFooter from '@/app/ui/blog/footer';
import { auth } from '@/auth';
import { fetchAccessibleBlogs, fetchBlogBySlug } from '@/app/lib/data';

// ブログ全体のレイアウト
export default async function BlogLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams?: Promise<{ site?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const blogSlug = params?.site || 'tech';

  // アクセス可能なブログを取得（管理者の場合は全てのブログ）
  const accessibleBlogs = await fetchAccessibleBlogs(session?.user?.id, session?.user?.role);

  // 現在のブログを取得
  const currentBlog = await fetchBlogBySlug(blogSlug);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <BlogHeader
        accessibleBlogs={accessibleBlogs}
        currentBlog={currentBlog}
        session={session}
      />
      <main className="flex-grow">{children}</main>
      <BlogFooter />
    </div>
  );
}
