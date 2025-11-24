import Link from 'next/link';
import { redirect } from 'next/navigation';
import PostCard from '@/app/ui/blog/post-card';
import ProfileSection from '@/app/ui/blog/profile-section';
import { fetchBlogBySlug, fetchPublishedPosts, canAccessBlog, fetchUserById } from '@/app/lib/data';
import { auth } from '@/auth';

// ブログトップページ（記事一覧）
export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ site?: string }>;
}) {
  // URLパラメータからブログを識別（デフォルトはtech）
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

  // アクセス権チェック（管理者は全てアクセス可能）
  const hasAccess = await canAccessBlog(userId, currentBlog.id, session?.user?.role);
  if (!hasAccess) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/blog?site=${blogSlug}`)}`);
  }

  // ブログの記事を取得
  const blogPosts = await fetchPublishedPosts(1, currentBlog.id);

  // 最新3件のみ表示
  const latestPosts = blogPosts.slice(0, 3);

  // 管理者情報を取得（ブログのオーナー）
  const adminUser = await fetchUserById(currentBlog.owner_id);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 text-center">
        <div className="mb-4">
          <h1 className="text-5xl font-bold text-gray-900">{currentBlog.name}</h1>
        </div>
        <p className="text-gray-600">
          {currentBlog.description}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {latestPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {latestPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">まだ記事がありません。</p>
        </div>
      )}

      {/* すべての記事を見るボタン */}
      {latestPosts.length > 0 && (
        <div className="mt-12 text-center">
          <Link
            href={`/blog/all?site=${blogSlug}`}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-blue-600 bg-white px-8 py-4 text-lg font-medium text-blue-600 transition-colors hover:bg-blue-50"
          >
            <span>すべての記事を見る</span>
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      )}

      {/* プロフィール欄（テックブログのみ） */}
      {blogSlug === 'tech' && adminUser && (
        <ProfileSection user={adminUser} />
      )}
    </div>
  );
}
