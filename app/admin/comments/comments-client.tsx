'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { approveComment, deleteComment } from '@/app/lib/actions';
import type { Comment } from '@/app/lib/definitions';

type StatusFilter = 'all' | 'approved' | 'pending';

interface ExtendedComment extends Comment {
  post_title: string;
  post_slug: string;
  blog_name: string;
}

interface CommentsClientProps {
  initialComments: ExtendedComment[];
}

// コメント管理ページ（クライアントコンポーネント）
export default function CommentsClient({ initialComments }: CommentsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState<ExtendedComment[]>(initialComments);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 承認ハンドラ
  const handleApprove = async (commentId: string) => {
    startTransition(async () => {
      try {
        await approveComment(commentId);
        // 承認後、リストを更新
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, approved: true } : c
          )
        );
      } catch (error) {
        console.error('承認に失敗しました:', error);
        alert('承認に失敗しました。');
      }
    });
  };

  // 削除ハンドラ
  const handleDelete = async (commentId: string, author: string) => {
    if (
      !confirm(
        `${author}さんのコメントを削除してもよろしいですか？\n\nこの操作は取り消せません。`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteComment(commentId);
        // 削除後、リストから除外
        setComments(comments.filter((c) => c.id !== commentId));
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました。');
      }
    });
  };

  // フィルタリングとソート
  const filteredComments = useMemo(() => {
    let filtered = [...comments];

    // ステータスでフィルタリング
    if (statusFilter === 'approved') {
      filtered = filtered.filter((c) => c.approved);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter((c) => !c.approved);
    }

    // 検索でフィルタリング
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.author_name.toLowerCase().includes(lowerSearch) ||
          c.author_email.toLowerCase().includes(lowerSearch) ||
          c.content.toLowerCase().includes(lowerSearch) ||
          c.post_title.toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [comments, statusFilter, searchTerm]);

  // 統計情報
  const stats = useMemo(() => {
    return {
      total: comments.length,
      approved: comments.filter((c) => c.approved).length,
      pending: comments.filter((c) => !c.approved).length,
    };
  }, [comments]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">コメント管理</h1>
      </div>

      {/* 統計情報 */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                全コメント
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.total}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                承認済み
              </p>
              <p className="text-3xl font-bold text-green-900 mt-1">
                {stats.approved}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                承認待ち
              </p>
              <p className="text-3xl font-bold text-orange-900 mt-1">
                {stats.pending}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <svg
                className="h-6 w-6 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* フィルター・検索コントロール */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* ステータスフィルター */}
          <div>
            <label
              htmlFor="status-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ステータス
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべて</option>
              <option value="approved">承認済み</option>
              <option value="pending">承認待ち</option>
            </select>
          </div>

          {/* 検索 */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              検索
            </label>
            <input
              type="text"
              id="search"
              placeholder="投稿者名、メール、内容、記事タイトルで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* コメント一覧テーブル */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                投稿者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                内容
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                記事
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                投稿日時
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredComments.map((comment) => (
              <tr key={comment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      comment.approved
                        ? 'bg-green-100 text-green-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {comment.approved ? '承認済み' : '承認待ち'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {comment.author_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {comment.author_email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {comment.content}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {comment.post_title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {comment.blog_name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(comment.created_at).toLocaleString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/blog/${comment.post_slug}`}
                      className="text-gray-600 hover:text-gray-900"
                      target="_blank"
                    >
                      記事を見る
                    </Link>
                    {!comment.approved && (
                      <button
                        onClick={() => handleApprove(comment.id)}
                        disabled={isPending}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        承認
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleDelete(comment.id, comment.author_name)
                      }
                      disabled={isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredComments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
          <p className="text-gray-600">条件に一致するコメントがありません。</p>
        </div>
      )}
    </div>
  );
}
