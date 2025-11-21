'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ChevronDownIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import type { Blog } from '@/app/lib/definitions';
import type { Session } from 'next-auth';

interface BlogHeaderProps {
  accessibleBlogs: Blog[];
  currentBlog: Blog | null;
  session: Session | null;
}

// ブログのヘッダー
export default function BlogHeader({
  accessibleBlogs,
  currentBlog,
  session,
}: BlogHeaderProps) {
  const [isBlogMenuOpen, setIsBlogMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchParams = useSearchParams();
  const blogSlug = searchParams.get('site') || 'tech';

  // ドロップダウンを閉じる処理（外側クリック時）
  useEffect(() => {
    const handleClickOutside = () => {
      setIsBlogMenuOpen(false);
      setIsUserMenuOpen(false);
    };
    if (isBlogMenuOpen || isUserMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isBlogMenuOpen, isUserMenuOpen]);

  return (
    <header className="border-b border-blue-200 bg-blue-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-2xl font-bold text-blue-900">
              天青
            </Link>
          </div>

          <nav className="hidden md:flex md:gap-x-8 items-center">
            <Link
              href={`/blog?site=${blogSlug}`}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              HOME
            </Link>

            {/* ブログ切り替えドロップダウン */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsBlogMenuOpen(!isBlogMenuOpen);
                }}
                className="flex items-center gap-1 text-gray-700 hover:text-gray-900 font-medium"
              >
                おうち
                <ChevronDownIcon className="w-4 h-4" />
              </button>

              {isBlogMenuOpen && (
                <div className="absolute top-full mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                  <div className="p-2">
                    {accessibleBlogs.map((blog) => (
                      <Link
                        key={blog.id}
                        href={`/blog?site=${blog.slug}`}
                        onClick={() => setIsBlogMenuOpen(false)}
                        className={`block rounded-md px-4 py-3 hover:bg-gray-50 transition-colors ${
                          blog.slug === blogSlug ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-900">{blog.name}</div>
                        <div className="text-sm text-gray-500 mt-1">
                          {blog.description}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 p-2">
                    <Link
                      href="/"
                      onClick={() => setIsBlogMenuOpen(false)}
                      className="block rounded-md px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-medium text-center"
                    >
                      すべてのブログを見る
                    </Link>
                  </div>
                </div>
              )}
            </div>

      

            {/* ユーザーメニュー */}
            {session ? (
              <div className="relative ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUserMenuOpen(!isUserMenuOpen);
                  }}
                  className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">{session.user?.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
                    <div className="p-2">
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        管理者画面
                      </Link>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          signOut({ callbackUrl: '/' });
                        }}
                        className="w-full text-left rounded-md px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="ml-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                ログイン
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
