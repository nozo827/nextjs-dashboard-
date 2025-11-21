'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Blog } from '@/app/lib/definitions';

interface BlogStats {
  blogId: string;
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalComments: number;
  pendingComments: number;
}

interface AdminDashboardClientProps {
  blogs: Blog[];
  blogStats: BlogStats[];
}

export default function AdminDashboardClient({
  blogs,
  blogStats,
}: AdminDashboardClientProps) {
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

  // ブログ別の統計
  const stats = useMemo(() => {
    const blogStat = blogStats.find((s) => s.blogId === selectedBlog);
    return (
      blogStat || {
        totalPosts: 0,
        publishedPosts: 0,
        draftPosts: 0,
        totalComments: 0,
        pendingComments: 0,
      }
    );
  }, [selectedBlog, blogStats]);

  // リンクにブログIDを追加
  const addBlogParam = (path: string) => {
    return `${path}?blog=${selectedBlog}`;
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="mt-2 text-gray-600">ブログ: {currentBlog.name}</p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">総記事数</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPosts}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">公開中</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">{stats.publishedPosts}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">下書き</h3>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{stats.draftPosts}</p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-600">コメント</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">{stats.totalComments}</p>
          {stats.pendingComments > 0 && (
            <p className="mt-1 text-sm text-orange-600">
              承認待ち: {stats.pendingComments}件
            </p>
          )}
        </div>
      </div>

      {/* クイックアクション */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href={addBlogParam('/admin/posts/create')}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700"
          >
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            新規記事を作成
          </Link>

          <Link
            href={addBlogParam('/admin/posts')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            記事管理
          </Link>

          <Link
            href={addBlogParam('/admin/categories')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            カテゴリ管理
          </Link>

          <Link
            href={addBlogParam('/admin/tags')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            タグ管理
          </Link>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            ユーザー管理
          </Link>

          <Link
            href="/admin/profile"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
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
                d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            プロフィール編集
          </Link>

          <Link
            href={`/blog?site=${currentBlog.slug}`}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            ブログに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
