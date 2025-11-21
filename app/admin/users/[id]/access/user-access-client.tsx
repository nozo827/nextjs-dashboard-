'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserBlogAccess } from '@/app/lib/actions';
import type { User, Blog } from '@/app/lib/definitions';

interface UserAccessClientProps {
  user: User;
  blogs: Blog[];
  initialAccess: string[];
}

// ユーザーのブログアクセス権限管理ページ（クライアントコンポーネント）
export default function UserAccessClient({
  user,
  blogs,
  initialAccess,
}: UserAccessClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBlogs, setSelectedBlogs] = useState<string[]>(initialAccess);
  const [message, setMessage] = useState('');

  const toggleBlogAccess = (blogId: string) => {
    if (selectedBlogs.includes(blogId)) {
      setSelectedBlogs(selectedBlogs.filter((id) => id !== blogId));
    } else {
      setSelectedBlogs([...selectedBlogs, blogId]);
    }
  };

  const handleSave = async () => {
    setMessage('');

    startTransition(async () => {
      try {
        await updateUserBlogAccess(user.id, selectedBlogs);
        setMessage('アクセス権限を更新しました。');
        setTimeout(() => {
          router.push('/admin/users');
        }, 1500);
      } catch (error) {
        setMessage('エラーが発生しました。もう一度お試しください。');
      }
    });
  };

  const privateBlogs = blogs.filter((blog) => blog.is_private);

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-800 mb-4"
        >
          ← 戻る
        </button>
        <h1 className="text-3xl font-bold text-gray-900">アクセス権限の管理</h1>
        <p className="mt-2 text-gray-600">
          {user.name} ({user.email}) のブログアクセス権限を設定します。
        </p>
      </div>

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
          アクセス可能なブログを選択
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          このユーザーがアクセスできる限定公開ブログにチェックを入れてください。
          管理者は自動的にすべてのブログにアクセスできます。
        </p>

        {privateBlogs.length > 0 ? (
          <div className="space-y-4">
            {privateBlogs.map((blog) => (
              <label
                key={blog.id}
                className={`flex items-start p-4 border border-gray-200 rounded-lg ${
                  user.role === 'admin' ? 'bg-gray-50' : 'hover:bg-gray-50 cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedBlogs.includes(blog.id)}
                  onChange={() => toggleBlogAccess(blog.id)}
                  disabled={user.role === 'admin'}
                  className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {blog.name}
                    </span>
                    <span className="inline-flex rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800">
                      限定公開
                    </span>
                  </div>
                  {blog.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {blog.description}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">限定公開のブログがありません。</p>
          </div>
        )}

        {user.role === 'admin' && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 管理者は自動的にすべてのブログにアクセスできます。
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleSave}
          disabled={isPending || user.role === 'admin'}
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
