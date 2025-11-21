'use client';

import { User } from '@/app/lib/definitions';
import { useState } from 'react';

interface ProfileSectionProps {
  user: User;
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="mt-16 border-t border-gray-200 pt-12">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">プロフィール</h2>
        <div className="rounded-lg border border-gray-200 bg-white p-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            {/* プロフィール画像 */}
            <div className="flex-shrink-0">
              {user.avatar_url && !imageError ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.name}のプロフィール写真`}
                  className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  onError={() => {
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                  <svg
                    className="h-16 w-16 text-gray-400"
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

            {/* プロフィール情報 */}
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {user.name}
              </h3>
              {user.bio && (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {user.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
