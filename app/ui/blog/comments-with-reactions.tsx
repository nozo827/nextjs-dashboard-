'use client';

import { Comment, ReactionType } from '@/app/lib/definitions';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createComment, toggleCommentReaction } from '@/app/lib/actions';

// リアクションアイコンマップ
const reactionIcons: { [key in ReactionType]: string } = {
  like: '👍',
  love: '❤️',
  clap: '👏',
  rocket: '🚀',
  fire: '🔥',
};

interface CommentWithReactions extends Comment {
  replies: Comment[];
  reactions: { [key in ReactionType]: number };
  user_reaction?: ReactionType | null;
}

interface CommentListProps {
  comments: CommentWithReactions[];
  postId: string;
}

interface CommentFormProps {
  postId: string;
  parentId?: string | null;
  onCancel?: () => void;
}

// コメント一覧表示（ネスト対応）
export function CommentList({ comments, postId }: CommentListProps) {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  if (comments.length === 0) {
    return (
      <p className="text-gray-600">
        まだコメントがありません。最初のコメントを投稿しましょう！
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          onReply={(commentId) => setReplyingTo(commentId)}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      ))}
    </div>
  );
}

// 個別コメント表示
function CommentItem({
  comment,
  postId,
  onReply,
  replyingTo,
  onCancelReply,
  isReply = false,
}: {
  comment: CommentWithReactions;
  postId: string;
  onReply: (commentId: string) => void;
  replyingTo: string | null;
  onCancelReply: () => void;
  isReply?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // セッションIDを取得（ローカルストレージに保存）
  const getSessionId = () => {
    if (typeof window === 'undefined') return '';
    let sessionId = localStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  };

  // リアクションハンドラ
  const handleReaction = (reactionType: ReactionType) => {
    startTransition(async () => {
      try {
        const sessionId = getSessionId();
        await toggleCommentReaction(comment.id, reactionType, sessionId);
        router.refresh();
      } catch (error) {
        console.error('リアクションの追加/削除に失敗しました:', error);
      }
    });
  };

  return (
    <div className={`${isReply ? 'ml-8 mt-4' : ''}`}>
      <div className="border-b border-gray-200 pb-4">
        {/* コメントヘッダー */}
        <div className="flex items-center gap-2 mb-2">
          <span className="font-medium text-gray-900">{comment.author_name}</span>
          <span className="text-sm text-gray-500">
            {new Date(comment.created_at).toLocaleDateString('ja-JP')}
          </span>
        </div>

        {/* コメント本文 */}
        <p className="text-gray-700 mb-3">{comment.content}</p>

        {/* リアクションとアクション */}
        <div className="flex items-center gap-4">
          {/* リアクションボタン */}
          <div className="flex items-center gap-2">
            {(Object.keys(reactionIcons) as ReactionType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={isPending}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors ${
                  comment.user_reaction === type
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={type}
              >
                <span>{reactionIcons[type]}</span>
                {comment.reactions[type] > 0 && (
                  <span className="text-xs">{comment.reactions[type]}</span>
                )}
              </button>
            ))}
          </div>

          {/* 返信ボタン */}
          {!isReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              返信
            </button>
          )}
        </div>

        {/* 返信フォーム */}
        {replyingTo === comment.id && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onCancel={onCancelReply}
            />
          </div>
        )}

        {/* 返信コメント */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply as CommentWithReactions}
                postId={postId}
                onReply={onReply}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
                isReply={true}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// コメント投稿フォーム
export function CommentForm({ postId, parentId, onCancel }: CommentFormProps) {
  const router = useRouter();
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
    if (parentId) {
      formData.append('parent_id', parentId);
    }
    formData.append('author_name', name);
    formData.append('author_email', email);
    formData.append('content', content);

    startTransition(async () => {
      try {
        const result = await createComment({ message: null, errors: {} }, formData);

        if (result.errors && Object.keys(result.errors).length > 0) {
          const errorMessages = Object.values(result.errors).flat().join(', ');
          setMessage(errorMessages);
        } else if (result.message) {
          setMessage(result.message);
          if (!result.message.includes('失敗')) {
            setName('');
            setEmail('');
            setContent('');

            setTimeout(() => {
              router.refresh();
              if (onCancel) onCancel();
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
      {parentId && (
        <p className="text-sm text-gray-600 font-medium">返信を投稿</p>
      )}

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
        <p className="text-xs text-gray-500 mt-1">メールアドレスは公開されません</p>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
          {parentId ? '返信内容' : 'コメント'} <span className="text-red-500">*</span>
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
            message.includes('エラー') || message.includes('失敗')
              ? 'bg-red-50 text-red-800'
              : 'bg-green-50 text-green-800'
          }`}
        >
          {message}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? '送信中...' : parentId ? '返信を投稿' : 'コメントを投稿'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-gray-200 px-6 py-2 text-gray-700 font-medium hover:bg-gray-300"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
