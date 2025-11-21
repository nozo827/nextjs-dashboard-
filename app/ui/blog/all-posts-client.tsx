'use client';

import { useState } from 'react';
import PostCard from '@/app/ui/blog/post-card';
import type { PostWithAuthor, Blog, Category } from '@/app/lib/definitions';

interface AllPostsClientProps {
  blogPosts: PostWithAuthor[];
  currentBlog: Blog;
  categories: Category[];
}

export default function AllPostsClient({
  blogPosts,
  currentBlog,
  categories,
}: AllPostsClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // カテゴリでフィルタリング
  const filteredPosts =
    selectedCategories.length === 0
      ? blogPosts
      : blogPosts.filter((post) => {
          // 選択されたカテゴリのいずれかが記事のカテゴリに含まれているかチェック
          return post.categories.some((cat) => selectedCategories.includes(cat.id));
        });

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentBlog.name} - すべての記事</h1>
        <p className="text-gray-600">{currentBlog.description}</p>
      </div>

      <div className="flex gap-8">
        {/* サイドバー（カテゴリフィルター） */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-4 rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">カテゴリ</h2>

            <div className="space-y-3">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-start cursor-pointer hover:bg-gray-50 rounded p-2 -m-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-4 w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                すべてクリア
              </button>
            )}
          </div>
        </aside>

        {/* 記事一覧 */}
        <div className="flex-1">
          {selectedCategories.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-600">
                {filteredPosts.length}件の記事が見つかりました
              </p>
            </div>
          )}

          {filteredPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600">
                選択したカテゴリの記事が見つかりませんでした。
              </p>
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                フィルターをクリア
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
