import Link from 'next/link';

// 記事が見つからない場合のページ
export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          記事が見つかりません
        </h2>
        <p className="text-gray-600 mb-8">
          お探しの記事は存在しないか、削除された可能性があります。
        </p>
        <Link
          href="/blog"
          className="inline-block rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
        >
          記事一覧に戻る
        </Link>
      </div>
    </div>
  );
}
