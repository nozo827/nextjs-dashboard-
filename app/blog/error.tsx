'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function BlogError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Blog error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">エラー</h1>
          <p className="mt-4 text-xl text-gray-600">
            ブログの読み込み中に問題が発生しました。
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <p className="mb-6 text-sm text-gray-700">
            {error.message || '記事の読み込みに失敗しました。'}
          </p>

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              再試行
            </button>

            <Link
              href="/blog"
              className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              ブログ一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
