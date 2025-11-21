import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchPostBySlug, incrementPostViewCount } from '@/app/lib/data';
import { sql } from '@vercel/postgres';
import { CommentList, CommentForm } from '@/app/ui/blog/comments';
import type { Comment } from '@/app/lib/definitions';

// マークダウンを簡易的にHTMLに変換
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // ヘッダー
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>');

  // 太字・イタリック
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // リンク
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  // 画像
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-lg" />');

  // コードブロック
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>');

  // インラインコード
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>');

  // リスト
  html = html.replace(/^\* (.+)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li.*<\/li>)/s, '<ul class="list-disc my-4">$1</ul>');

  // 段落（2つ以上の改行を段落に）
  html = html.replace(/\n\n/g, '</p><p class="mb-4">');
  html = '<p class="mb-4">' + html + '</p>';

  return html;
}

// 個別記事ページ
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  // 記事を取得
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // アクセス権チェック
  if (post.visibility === 'private') {
    // 非公開記事は著者と管理者のみ
    if (!session?.user?.id || (post.author_id !== session.user.id && session.user.role !== 'admin')) {
      redirect('/login?callbackUrl=/blog/' + slug);
    }
  } else if (post.visibility === 'restricted') {
    // 限定公開はログインユーザーのみ（今後、個別の権限チェックを追加）
    if (!session?.user?.id) {
      redirect('/login?callbackUrl=/blog/' + slug);
    }
  }

  // 閲覧数をインクリメント
  await incrementPostViewCount(post.id);

  // コメントを取得
  const commentsResult = await sql`
    SELECT * FROM comments
    WHERE post_id = ${post.id} AND approved = true
    ORDER BY created_at DESC
  `;
  const comments = commentsResult.rows as Comment[];

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // マークダウンをHTMLに変換
  const contentHtml = simpleMarkdownToHtml(post.content);

  return (
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
      {/* 記事ヘッダー */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-gray-600 mb-4">
          <time dateTime={post.published_at}>
            {formattedDate}
          </time>
          <span>•</span>
          <span>by {post.author_name}</span>
          <span>•</span>
          <span>{post.view_count.toLocaleString()} views</span>
        </div>

        {/* 抜粋 */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* カテゴリとタグ */}
        <div className="flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
            >
              {category.name}
            </span>
          ))}
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </header>

      {/* アイキャッチ画像 */}
      {post.featured_image && (
        <div className="mb-8">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-auto rounded-lg shadow-lg"
          />
        </div>
      )}

      {/* 記事本文 */}
      <div className="prose prose-lg max-w-none">
        <div
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </div>

      {/* コメントセクション */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          コメント ({comments.length})
        </h2>

        <div className="mb-8">
          <CommentList comments={comments} />
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            コメントを投稿
          </h3>
          <CommentForm postId={post.id} />
        </div>
      </div>

      {/* 著者情報 */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="flex items-center gap-4">
          {post.author_avatar && (
            <img
              src={post.author_avatar}
              alt={post.author_name}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h3 className="font-bold text-gray-900">{post.author_name}</h3>
            <p className="text-gray-600 text-sm">{post.author_email}</p>
          </div>
        </div>
      </div>

      {/* 戻るボタン */}
      <div className="mt-8">
        <a
          href="/blog"
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          記事一覧に戻る
        </a>
      </div>
    </article>
  );
}
