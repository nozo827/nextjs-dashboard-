'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updatePostAccess } from '@/app/lib/actions';
import type { Post, User } from '@/app/lib/definitions';

interface PostAccessClientProps {
  post: Post;
  users: User[];
  initialAccess: string[];
}

// 記事のアクセス権限管理ページ（クライアントコンポーネント）
export default function PostAccessClient({
  post,
  users,
  initialAccess,
}: PostAccessClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedUsers, setSelectedUsers] = useState<string[]>(initialAccess);
  const [message, setMessage] = useState('');

  const toggleUserAccess = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSave = async () => {
    setMessage('');

    startTransition(async () => {
      try {
        await updatePostAccess(post.id, selectedUsers);
        setMessage('アクセス権限を更新しました。');
        setTimeout(() => {
          router.push('/admin/posts');
        }, 1500);
      } catch (error) {
        setMessage('エラーが発生しました。もう一度お試しください。');
      }
    });
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return '公開';
      case 'restricted':
        return '限定公開';
      case 'private':
        return '非公開';
      default:
        return visibility;
    }
  };

  const getVisibilityBadgeColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-green-100 text-green-800';
      case 'restricted':
        return 'bg-orange-100 text-orange-800';
      case 'private':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← 戻る
        </button>
        <h1 className="text-3xl font-bold text-gray-900">記事のアクセス権限管理</h1>
        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h2 className="font-bold text-gray-900">{post.title}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getVisibilityBadgeColor(
                post.visibility
              )}`}
            >
              {getVisibilityLabel(post.visibility)}
            </span>
            <span className="text-sm text-gray-600">
              ステータス: {post.status === 'published' ? '公開中' : '下書き'}
            </span>
          </div>
        </div>
      </div>

      {post.visibility !== 'restricted' && (
        <div className="mb-6 rounded-md p-4 bg-yellow-50 border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ この記事は「{getVisibilityLabel(post.visibility)}」に設定されています。
            アクセス権限を管理するには、記事の編集画面で公開範囲を「限定公開」に変更してください。
          </p>
        </div>
      )}

      {message && (
        <div
          className={`mb-6 rounded-md p-4 ${
            message.includes('エラー')
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-green-50 border border-green-200 text-green-600'
          }`}
        >
          {message}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          閲覧を許可するユーザーを選択
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          この記事を閲覧できるユーザーにチェックを入れてください。
          管理者と記事の著者は自動的に閲覧できます。
        </p>

        <div className="space-y-3">
          {users.map((user) => {
            const isAuthor = post.author_id === user.id;
            const isAdmin = user.role === 'admin';
            const isDisabled = isAuthor || isAdmin;

            return (
              <label
                key={user.id}
                className={`flex items-start p-4 border border-gray-200 rounded-lg ${
                  isDisabled ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id) || isDisabled}
                  onChange={() => toggleUserAccess(user.id)}
                  disabled={isDisabled}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{user.name}</span>
                    {isAuthor && (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                        著者
                      </span>
                    )}
                    {isAdmin && (
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
                        管理者
                      </span>
                    )}
                    {user.role === 'editor' && (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        編集者
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{user.email}</p>
                  {isDisabled && (
                    <p className="mt-1 text-xs text-gray-500">
                      {isAuthor
                        ? '※ 著者は自動的にアクセスできます'
                        : '※ 管理者は自動的にすべての記事にアクセスできます'}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={isPending || post.visibility !== 'restricted'}
          className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? '保存中...' : 'アクセス権限を保存'}
        </button>
        <button
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 bg-white px-6 py-3 text-gray-700 font-medium hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
