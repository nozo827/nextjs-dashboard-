'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900">エラー</h1>
          <p className="mt-4 text-xl text-gray-600">
            申し訳ございません。問題が発生しました。
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <p className="mb-6 text-sm text-gray-700">
            {error.message || '予期しないエラーが発生しました。'}
          </p>

          {error.digest && (
            <p className="mb-6 text-xs text-gray-500">
              エラーID: {error.digest}
            </p>
          )}

          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              再試行
            </button>

            <Link
              href="/"
              className="block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
