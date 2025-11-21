'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Category } from '@/app/lib/definitions';
import { createCategory, updateCategory, deleteCategory } from '@/app/lib/actions';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

interface CategoriesClientProps {
  initialCategories: Category[];
}

export default function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isPending, startTransition] = useTransition();
  const [formState, setFormState] = useState<{ message?: string | null; errors?: Record<string, string[]> }>({ message: null, errors: {} });

  // モーダルを開く（新規作成）
  const handleCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  // モーダルを開く（編集）
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  // カテゴリを削除
  const handleDelete = async (id: string) => {
    if (!confirm('このカテゴリを削除してもよろしいですか？')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteCategory(id);
        // 削除後、リストから除外
        setCategories(categories.filter((c) => c.id !== id));
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました。');
      }
    });
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        let state;
        if (editingCategory) {
          // 更新
          state = await updateCategory(editingCategory.id, { message: null, errors: {} }, formData);
        } else {
          // 新規作成
          state = await createCategory({ message: null, errors: {} }, formData);
        }

        setFormState(state);

        if (state && state.message && !state.errors) {
          // 成功したらモーダルを閉じて、ページをリフレッシュ
          setIsModalOpen(false);
          router.refresh();
        }
      } catch (error) {
        console.error('保存に失敗しました:', error);
      }
    });
  };

  const currentState = formState;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">カテゴリ管理</h1>
          <p className="mt-1 text-sm text-gray-600">
            記事のカテゴリを追加・編集・削除できます。
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5" />
          新規作成
        </button>
      </div>

      {/* カテゴリ一覧テーブル */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                名前
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                スラッグ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                説明
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                作成日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {category.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {category.slug}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {category.description || '-'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(category.created_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(category)}
                    className="mr-3 text-blue-600 hover:text-blue-900"
                    disabled={isPending}
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={isPending}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* カテゴリ作成/編集モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              {editingCategory ? 'カテゴリを編集' : 'カテゴリを作成'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* エラーメッセージ */}
                {currentState.message && (
                  <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                    {currentState.message}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCategory?.name || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="テクノロジー"
                    required
                  />
                  {currentState.errors?.name && (
                    <p className="mt-1 text-sm text-red-600">{currentState.errors.name[0]}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    スラッグ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    defaultValue={editingCategory?.slug || ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="technology"
                    required
                  />
                  {currentState.errors?.slug && (
                    <p className="mt-1 text-sm text-red-600">{currentState.errors.slug[0]}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    URL用の識別子（英数字とハイフンのみ）
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    説明
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingCategory?.description || ''}
                    rows={3}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    placeholder="カテゴリの説明文"
                  />
                  {currentState.errors?.description && (
                    <p className="mt-1 text-sm text-red-600">{currentState.errors.description[0]}</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  disabled={isPending}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  disabled={isPending}
                >
                  {isPending ? '保存中...' : editingCategory ? '更新' : '作成'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
