'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { togglePostReaction } from '@/app/lib/actions';
import { ReactionType } from '@/app/lib/definitions';

// リアクションアイコンマップ
const reactionIcons: { [key in ReactionType]: string } = {
  like: '👍',
  love: '❤️',
  clap: '👏',
  rocket: '🚀',
  fire: '🔥',
};

const reactionLabels: { [key in ReactionType]: string } = {
  like: 'いいね',
  love: '最高',
  clap: '拍手',
  rocket: 'すごい',
  fire: '熱い',
};

interface PostReactionsProps {
  postId: string;
  reactions: { [key in ReactionType]: number };
  userReaction?: ReactionType | null;
}

export function PostReactions({ postId, reactions, userReaction }: PostReactionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReaction, setLocalUserReaction] = useState<ReactionType | null>(
    userReaction || null
  );

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

        // 楽観的UI更新
        const newReactions = { ...localReactions };
        if (localUserReaction === reactionType) {
          // 同じリアクションをクリックした場合は削除
          newReactions[reactionType] = Math.max(0, newReactions[reactionType] - 1);
          setLocalUserReaction(null);
        } else {
          // 別のリアクションをクリックした場合
          if (localUserReaction) {
            newReactions[localUserReaction] = Math.max(0, newReactions[localUserReaction] - 1);
          }
          newReactions[reactionType] = (newReactions[reactionType] || 0) + 1;
          setLocalUserReaction(reactionType);
        }
        setLocalReactions(newReactions);

        // サーバーアクション実行
        await togglePostReaction(postId, reactionType, sessionId);
        router.refresh();
      } catch (error) {
        console.error('リアクションの追加/削除に失敗しました:', error);
        // エラー時は元に戻す
        setLocalReactions(reactions);
        setLocalUserReaction(userReaction || null);
      }
    });
  };

  // 総リアクション数
  const totalReactions = Object.values(localReactions).reduce((sum, count) => sum + count, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        この記事への反応 {totalReactions > 0 && `(${totalReactions})`}
      </h3>

      <div className="grid grid-cols-5 gap-3">
        {(Object.keys(reactionIcons) as ReactionType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleReaction(type)}
            disabled={isPending}
            className={`flex flex-col items-center gap-2 p-4 rounded-lg transition-all ${
              localUserReaction === type
                ? 'bg-blue-100 border-2 border-blue-500 scale-105'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:scale-105'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={reactionLabels[type]}
          >
            <span className="text-3xl">{reactionIcons[type]}</span>
            <span className="text-xs font-medium text-gray-700">{reactionLabels[type]}</span>
            {localReactions[type] > 0 && (
              <span className="text-sm font-bold text-gray-900">{localReactions[type]}</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        気に入ったら反応してみましょう！
      </p>
    </div>
  );
}
