'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import type { Blog } from '@/app/lib/definitions';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  blogs: Blog[];
}

export default function AdminLayoutClient({
  children,
  blogs,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedBlog, setSelectedBlog] = useState(blogs[0]?.id || '');

  // URLパラメータからブログIDを取得
  useEffect(() => {
    const blogId = searchParams.get('blog');
    if (blogId) {
      setSelectedBlog(blogId);
    } else if (blogs.length > 0) {
      setSelectedBlog(blogs[0].id);
    }
  }, [searchParams, blogs]);

  const currentBlog = blogs.find((b) => b.id === selectedBlog) || blogs[0];

  // リンクにブログIDを追加
  const addBlogParam = (path: string) => {
    return `${path}?blog=${selectedBlog}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                管理者画面
              </Link>

              {/* ブログ切り替え */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">ブログ:</span>
                <select
                  value={selectedBlog}
                  onChange={(e) => {
                    setSelectedBlog(e.target.value);
                    // パスを維持したままブログIDを変更
                    const url = new URL(window.location.href);
                    url.searchParams.set('blog', e.target.value);
                    window.location.href = url.toString();
                  }}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {blogs.map((blog) => (
                    <option key={blog.id} value={blog.id}>
                      {blog.name}
                    </option>
                  ))}
                </select>
              </div>

              <nav className="hidden md:flex md:gap-x-6">
                <Link
                  href={addBlogParam('/admin/posts')}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  記事管理
                </Link>
                <Link
                  href="/admin/comments"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  コメント管理
                </Link>
                <Link
                  href={addBlogParam('/admin/categories')}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  カテゴリ管理
                </Link>
                <Link
                  href={addBlogParam('/admin/tags')}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  タグ管理
                </Link>
                <Link
                  href="/admin/users"
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  ユーザー管理
                </Link>
                <Link
                  href={`/blog?site=${currentBlog.slug}`}
                  className="text-gray-700 hover:text-gray-900 font-medium"
                >
                  ブログに戻る
                </Link>
              </nav>
            </div>
            <div className="text-sm text-gray-600">
              管理者としてログイン中
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
