'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteUser } from '@/app/lib/actions';
import type { User } from '@/app/lib/definitions';

interface UserWithBlogs extends User {
  accessible_blogs: string[];
}

interface UsersClientProps {
  initialUsers: UserWithBlogs[];
}

// ユーザー管理ページ（クライアントコンポーネント）
export default function UsersClient({ initialUsers }: UsersClientProps) {
  const router = useRouter();
  const [users] = useState<UserWithBlogs[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ userId: string; userName: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // フィルタリング
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // 検索でフィルタリング
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(lowerSearch) ||
          user.email.toLowerCase().includes(lowerSearch)
      );
    }

    // 役割でフィルタリング
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    return filtered;
  }, [users, searchTerm, roleFilter]);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'editor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理者';
      case 'editor':
        return '編集者';
      default:
        return 'ユーザー';
    }
  };

  const handleDeleteClick = (userId: string, userName: string) => {
    setDeleteConfirm({ userId, userName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteUser(deleteConfirm.userId);
      setDeleteConfirm(null);
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'ユーザーの削除に失敗しました。');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">ユーザー管理</h1>
      </div>

      {/* 検索・フィルターコントロール */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-2">
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
              placeholder="ユーザー名またはメールアドレスで検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* 役割フィルター */}
          <div>
            <label
              htmlFor="role-filter"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              役割
            </label>
            <select
              id="role-filter"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべての役割</option>
              <option value="admin">管理者</option>
              <option value="editor">編集者</option>
              <option value="user">ユーザー</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ユーザー
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メールアドレス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                役割
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アクセス可能なブログ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                登録日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getRoleBadgeColor(
                      user.role
                    )}`}
                  >
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.accessible_blogs.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {user.accessible_blogs.map((blogName, index) => (
                        <span
                          key={index}
                          className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                        >
                          {blogName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">なし</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-3">
                    <Link
                      href={`/admin/users/${user.id}/access`}
                      className="text-green-600 hover:text-green-900"
                    >
                      アクセス権限
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(user.id, user.name)}
                      className="text-red-600 hover:text-red-900"
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

      {filteredUsers.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
          <p className="text-gray-600">条件に一致するユーザーがいません。</p>
        </div>
      )}

      {/* 削除確認ダイアログ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">ユーザーの削除</h3>
            <p className="text-gray-600 mb-6">
              本当に <strong>{deleteConfirm.userName}</strong> を削除しますか？
              <br />
              この操作は取り消せません。
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
