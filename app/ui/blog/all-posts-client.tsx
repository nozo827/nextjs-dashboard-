'use client';

import { useState, useMemo } from 'react';
import PostCard from '@/app/ui/blog/post-card';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import type { PostWithAuthor, Blog, Category, Tag } from '@/app/lib/definitions';

interface AllPostsClientProps {
  blogPosts: PostWithAuthor[];
  currentBlog: Blog;
  categories: Category[];
  tags: Tag[];
}

export default function AllPostsClient({
  blogPosts,
  currentBlog,
  categories,
  tags,
}: AllPostsClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // フィルタリングされた記事
  const filteredPosts = useMemo(() => {
    let posts = blogPosts;

    // カテゴリでフィルタリング
    if (selectedCategories.length > 0) {
      posts = posts.filter((post) =>
        post.categories.some((cat) => selectedCategories.includes(cat.id))
      );
    }

    // タグでフィルタリング
    if (selectedTags.length > 0) {
      posts = posts.filter((post) =>
        post.tags.some((tag) => selectedTags.includes(tag.id))
      );
    }

    // 検索クエリでフィルタリング
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(query) ||
        post.excerpt?.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query)
      );
    }

    return posts;
  }, [blogPosts, selectedCategories, selectedTags, searchQuery]);

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedTags.length > 0 || searchQuery.trim() !== '';

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentBlog.name} - すべての記事</h1>
        <p className="text-gray-600">{currentBlog.description}</p>
      </div>

      {/* 検索バー */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="記事を検索..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-8">
        {/* サイドバー（カテゴリ・タグフィルター） */}
        <aside className="w-64 flex-shrink-0">
          <div className="sticky top-4 space-y-6">
            {/* カテゴリフィルター */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
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
            </div>

            {/* タグフィルター */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">タグ</h2>

              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTags.includes(tag.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* フィルタークリアボタン */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                すべてのフィルターをクリア
              </button>
            )}
          </div>
        </aside>

        {/* 記事一覧 */}
        <div className="flex-1">
          {hasActiveFilters && (
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
              <p className="text-gray-600 mb-2">
                {hasActiveFilters
                  ? '条件に一致する記事が見つかりませんでした。'
                  : '記事がありません。'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                >
                  フィルターをクリア
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
