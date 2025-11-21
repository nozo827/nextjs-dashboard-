import Link from 'next/link';
import { PostWithAuthor } from '@/app/lib/definitions';

// 記事カード（一覧表示用）
export default function PostCard({ post }: { post: PostWithAuthor }) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/blog/${post.slug}`}>
        <h2 className="mb-2 text-2xl font-bold text-gray-900 hover:text-blue-600">
          {post.title}
        </h2>
      </Link>

      <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
        <time dateTime={post.published_at?.toISOString()}>
          {formattedDate}
        </time>
        <span>•</span>
        <span>{post.author_name}</span>
      </div>

      {post.categories && post.categories.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {post.categories.map((category) => (
            <span
              key={category.id}
              className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
            >
              {category.name}
            </span>
          ))}
        </div>
      )}

      {post.excerpt && (
        <p className="mb-4 text-gray-700 line-clamp-3">{post.excerpt}</p>
      )}

      <Link
        href={`/blog/${post.slug}`}
        className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
      >
        続きを読む
        <svg
          className="ml-2 h-4 w-4"
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
    </article>
  );
}
