import { notFound, redirect } from 'next/navigation';
import { auth } from '@/auth';
import { fetchPostBySlug, incrementPostViewCount, fetchPublishedPosts } from '@/app/lib/data';
import { sql } from '@vercel/postgres';
import { CommentList, CommentForm } from '@/app/ui/blog/comments-with-reactions';
import { PostReactions } from '@/app/ui/blog/post-reactions';
import { SafeHtmlContent } from '@/app/ui/blog/safe-html-content';
import type { Comment, ReactionType } from '@/app/lib/definitions';
import Image from 'next/image';

// 1分ごとに再検証（ISRキャッシュ）- コメントをすぐに反映させるため短めに設定
export const revalidate = 60;

// 動的ルートセグメント設定
export const dynamicParams = true;

// 静的パラメータを生成（人気記事を事前生成）
export async function generateStaticParams() {
  try {
    // すべての公開記事を取得（techブログのID）
    const posts = await fetchPublishedPosts(1, '650e8400-e29b-41d4-a716-446655440001');

    // 最新20件の記事を事前生成
    return posts.slice(0, 20).map((post) => ({
      slug: post.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// メタデータ生成（SEOとOGP最適化）
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const post = await fetchPostBySlug(slug);

    if (!post) {
      return {
        title: '記事が見つかりません',
      };
    }

    return {
      title: post.title,
      description: post.excerpt || post.content.slice(0, 160),
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content.slice(0, 160),
        images: post.featured_image ? [post.featured_image] : [],
      },
    };
  } catch (error) {
    return {
      title: 'エラー',
    };
  }
}

// マークダウンを簡易的にHTMLに変換
function simpleMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // コードブロック（最初に処理して保護）
  html = html.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>');

  // インラインコード
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>');

  // 画像（リンクより先に処理）
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-lg" />');

  // リンク
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline">$1</a>');

  // ヘッダー
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-6 mb-3">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-8 mb-4">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-10 mb-5">$1</h1>');

  // 太字・イタリック
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // リスト
  html = html.replace(/^\* (.+)$/gim, '<li class="ml-4">$1</li>');
  html = html.replace(/(<li[\s\S]*?<\/li>)/g, '<ul class="list-disc my-4">$1</ul>');

  // 段落と改行の処理
  // まず、2つ以上の改行を段落の区切りに変換
  html = html.replace(/\n\n+/g, '</p><p class="mb-4">');

  // 単一の改行をbrタグに変換（ただし、既にHTMLタグの中にある改行は除外）
  html = html.replace(/\n/g, '<br />');

  // 段落で囲む
  html = '<p class="mb-4">' + html + '</p>';

  return html;
}

// 個別記事ページ
export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 並列実行: 認証と記事取得を同時に実行
  const [session, post] = await Promise.all([
    auth(),
    fetchPostBySlug(slug),
  ]);

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
    // 限定公開は指定されたユーザーのみアクセス可能
    if (!session?.user?.id) {
      redirect('/login?callbackUrl=/blog/' + slug);
    }

    // post_accessテーブルで個別のアクセス権限をチェック
    const accessCheckResult = await sql`
      SELECT user_id FROM post_access
      WHERE post_id = ${post.id} AND user_id = ${session.user.id}
    `;

    // 著者、管理者、または許可されたユーザーのみアクセス可能
    const isAuthor = post.author_id === session.user.id;
    const isAdmin = session.user.role === 'admin';
    const hasAccess = accessCheckResult.rows.length > 0;

    if (!isAuthor && !isAdmin && !hasAccess) {
      // アクセス権限がない場合はエラーページへ
      notFound();
    }
  }

  // 閲覧数をインクリメント（管理者の閲覧は除外、非同期で実行、ページレンダリングをブロックしない）
  incrementPostViewCount(post.id, session?.user?.role).catch(console.error);

  // コメントを取得（親コメントのみ）
  const commentsResult = await sql`
    SELECT * FROM comments
    WHERE post_id = ${post.id} AND approved = true AND parent_id IS NULL
    ORDER BY created_at DESC
  `;
  const parentComments = commentsResult.rows as Comment[];

  // 各コメントの返信とリアクションを取得
  const commentsWithReplies = await Promise.all(
    parentComments.map(async (comment) => {
      // 返信を取得
      const repliesResult = await sql`
        SELECT * FROM comments
        WHERE parent_id = ${comment.id} AND approved = true
        ORDER BY created_at ASC
      `;
      const replies = repliesResult.rows as Comment[];

      // リアクションを取得
      const reactionsResult = await sql`
        SELECT reaction_type, COUNT(*) as count
        FROM comment_reactions
        WHERE comment_id = ${comment.id}
        GROUP BY reaction_type
      `;

      const reactions: { [key in ReactionType]: number } = {
        like: 0,
        love: 0,
        clap: 0,
        rocket: 0,
        fire: 0,
      };

      reactionsResult.rows.forEach((row: any) => {
        reactions[row.reaction_type as ReactionType] = parseInt(row.count);
      });

      // ユーザーのリアクションを取得
      let userReaction: ReactionType | null = null;
      if (session?.user?.id) {
        const userReactionResult = await sql`
          SELECT reaction_type FROM comment_reactions
          WHERE comment_id = ${comment.id} AND user_id = ${session.user.id}
          LIMIT 1
        `;
        if (userReactionResult.rows.length > 0) {
          userReaction = userReactionResult.rows[0].reaction_type as ReactionType;
        }
      }

      return {
        ...comment,
        replies,
        reactions,
        user_reaction: userReaction,
      };
    })
  );

  // 記事のリアクションを取得
  const postReactionsResult = await sql`
    SELECT reaction_type, COUNT(*) as count
    FROM post_reactions
    WHERE post_id = ${post.id}
    GROUP BY reaction_type
  `;

  const postReactions: { [key in ReactionType]: number } = {
    like: 0,
    love: 0,
    clap: 0,
    rocket: 0,
    fire: 0,
  };

  postReactionsResult.rows.forEach((row: any) => {
    postReactions[row.reaction_type as ReactionType] = parseInt(row.count);
  });

  // ユーザーの記事リアクションを取得
  let userPostReaction: ReactionType | null = null;
  if (session?.user?.id) {
    const userPostReactionResult = await sql`
      SELECT reaction_type FROM post_reactions
      WHERE post_id = ${post.id} AND user_id = ${session.user.id}
      LIMIT 1
    `;
    if (userPostReactionResult.rows.length > 0) {
      userPostReaction = userPostReactionResult.rows[0].reaction_type as ReactionType;
    }
  }

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
    <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
      <div className="bg-white/70 backdrop-blur-md rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
        {/* 記事ヘッダー */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {post.title}
          </h1>

        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4 flex-wrap">
          <time dateTime={post.published_at?.toString() || undefined}>
            {formattedDate}
          </time>
          <span>•</span>
          <span>by {post.author_name}</span>
          <span>•</span>
          <span>{post.view_count.toLocaleString()} views</span>
        </div>

        {/* 抜粋 */}
        {post.excerpt && (
          <p className="text-base sm:text-lg text-gray-600 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* カテゴリとタグ */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {post.categories.map((category) => (
            <span
              key={category.id}
              className="rounded-full bg-blue-100 px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-blue-800"
            >
              {category.name}
            </span>
          ))}
          {post.tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-gray-100 px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-gray-700"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      </header>

      {/* アイキャッチ画像 */}
      {post.featured_image && (
        <div className="mb-6 sm:mb-8 relative w-full" style={{ aspectRatio: '16/9' }}>
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 896px, 896px"
            className="rounded-lg shadow-lg object-cover"
            priority
          />
        </div>
      )}

      {/* 記事本文 */}
      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none">
        <SafeHtmlContent html={contentHtml} />
      </div>

      {/* リアクションセクション */}
      <div className="mt-8 sm:mt-12">
        <PostReactions
          postId={post.id}
          reactions={postReactions}
          userReaction={userPostReaction}
        />
      </div>

      {/* コメントセクション */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
          コメント ({commentsWithReplies.length})
        </h2>

        <div className="mb-6 sm:mb-8">
          <CommentList comments={commentsWithReplies} postId={post.id} />
        </div>

        <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-4">
            コメントを投稿
          </h3>
          <CommentForm postId={post.id} />
        </div>
      </div>

      {/* 著者情報 */}
      <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
        <div className="flex items-center gap-3 sm:gap-4">
          {post.author_avatar && (
            <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
              <Image
                src={post.author_avatar}
                alt={post.author_name}
                fill
                sizes="(max-width: 640px) 48px, 64px"
                className="rounded-full object-cover"
              />
            </div>
          )}
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">{post.author_name}</h3>
          </div>
        </div>
      </div>

        {/* 戻るボタン */}
        <div className="mt-6 sm:mt-8">
          <a
            href="/blog"
            className="inline-flex items-center text-sm sm:text-base text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg
              className="mr-2 h-3 w-3 sm:h-4 sm:w-4"
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
      </div>
    </article>
  );
}
