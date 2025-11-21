'use client';

import { Comment } from '@/app/lib/definitions';
import { useState, useTransition } from 'react';
import { createComment } from '@/app/lib/actions';

// コメント一覧表示
export function CommentList({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <p className="text-gray-600">
        まだコメントがありません。最初のコメントを投稿しましょう！
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div key={comment.id} className="border-b border-gray-200 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">{comment.author_name}</span>
            <span className="text-sm text-gray-500">
              {new Date(comment.created_at).toLocaleDateString('ja-JP')}
            </span>
          </div>
          <p className="text-gray-700">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}

// コメント投稿フォーム
export function CommentForm({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const formData = new FormData();
    formData.append('post_id', postId);
    formData.append('author_name', name);
    formData.append('author_email', email);
    formData.append('content', content);

    startTransition(async () => {
      try {
        const result = await createComment({ message: null, errors: {} }, formData);

        if (result.errors && Object.keys(result.errors).length > 0) {
          // バリデーションエラーがある場合
          const errorMessages = Object.values(result.errors).flat().join(', ');
          setMessage(errorMessages);
        } else if (result.message) {
          setMessage(result.message);
          if (!result.message.includes('失敗')) {
            // 成功した場合はフォームをクリア
            setName('');
            setEmail('');
            setContent('');

            // ページをリロードしてコメントを表示
            setTimeout(() => {
              window.location.reload();
            }, 1500);
          }
        }
      } catch (error) {
        setMessage('エラーが発生しました。もう一度お試しください。');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          お名前 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          メールアドレス <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          メールアドレスは公開されません
        </p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          コメント <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {message && (
        <div
          className={`rounded-md p-3 ${
            message.includes('エラー')
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isPending ? '送信中...' : 'コメントを投稿'}
      </button>
    </form>
  );
}
