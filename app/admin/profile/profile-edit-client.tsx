'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/app/lib/definitions';
import { updateProfile } from '@/app/lib/actions';
import ImageUpload from '@/app/ui/image-upload';

interface ProfileEditClientProps {
  user: User;
}

// プロフィール編集ページ（クライアントコンポーネント）
export default function ProfileEditClient({ user }: ProfileEditClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [state, setState] = useState<{ message?: string | null; errors?: Record<string, string[]> }>({ message: null, errors: {} });

  // フォーム送信ハンドラ
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // avatarUrlをフォームデータに追加
    formData.set('avatar_url', avatarUrl);

    startTransition(async () => {
      const result = await updateProfile({ message: null, errors: {} }, formData);
      // サーバー側でリダイレクトするため、クライアント側では何もしない
      if (result) {
        setState(result);
      }
    });
  };

  const handleImageUpload = (url: string) => {
    setAvatarUrl(url);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">プロフィール編集</h1>

      {state.message && (
        <div
          className={`mb-6 rounded-md p-4 ${
            state.message.includes('失敗')
              ? 'bg-red-50 border border-red-200 text-red-600'
              : 'bg-green-50 border border-green-200 text-green-600'
          }`}
        >
          {state.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* プロフィール画像 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            プロフィール画像
          </label>

          <div className="flex items-center gap-6">
            {/* 現在の画像プレビュー */}
            <div className="flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="プロフィール画像"
                  className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* 画像アップロード */}
            <div className="flex-1">
              <ImageUpload onImageSelect={handleImageUpload} currentImage={avatarUrl} />
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl('')}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  画像を削除
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 名前 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            名前 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            defaultValue={user.name}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.errors?.name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        {/* 自己紹介文 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            自己紹介文
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={5}
            defaultValue={user.bio || ''}
            placeholder="あなたの経歴や興味のあることを書いてください"
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.errors?.bio && (
            <p className="mt-1 text-sm text-red-600">{state.errors.bio[0]}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            テックブログのプロフィール欄に表示されます
          </p>
        </div>

        {/* 送信ボタン */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPending ? '更新中...' : '更新する'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="rounded-md border border-gray-300 bg-white px-8 py-3 text-gray-700 font-medium hover:bg-gray-50"
            disabled={isPending}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
