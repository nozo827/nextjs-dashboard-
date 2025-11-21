'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deletePost } from '@/app/lib/actions';
import type { PostWithAuthor, Blog, Category, Tag } from '@/app/lib/definitions';

type SortOption = 'newest' | 'oldest' | 'most_viewed';

interface PostsClientProps {
  initialPosts: PostWithAuthor[];
  blogs: Blog[];
  categories: Category[];
  tags: Tag[];
  initialBlogId: string;
}

// 記事一覧管理ページ（クライアントコンポーネント）
export default function PostsClient({
  initialPosts,
  blogs,
  categories,
  tags,
  initialBlogId,
}: PostsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [posts, setPosts] = useState<PostWithAuthor[]>(initialPosts);
  const [selectedBlog, setSelectedBlog] = useState(initialBlogId);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // ブログ切り替えハンドラ
  const handleBlogChange = (blogId: string) => {
    setSelectedBlog(blogId);
    router.push(`/admin/posts?blog=${blogId}`);
  };

  // 削除ハンドラ
  const handleDelete = async (postId: string, postTitle: string) => {
    if (!confirm(`「${postTitle}」を削除してもよろしいですか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deletePost(postId);
        // 削除後、リストから除外
        setPosts(posts.filter((p) => p.id !== postId));
      } catch (error) {
        console.error('削除に失敗しました:', error);
        alert('削除に失敗しました。');
      }
    });
  };

  // フィルタリングとソート
  const filteredAndSortedPosts = useMemo(() => {
    let filtered = [...posts];

    // ブログIDでフィルタリング
    if (selectedBlog) {
      filtered = filtered.filter((post) => post.blog_id === selectedBlog);
    }

    // カテゴリでフィルタリング
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((post) =>
        post.categories?.some((cat) => cat.id === selectedCategory)
      );
    }

    // タグでフィルタリング
    if (selectedTag !== 'all') {
      filtered = filtered.filter((post) =>
        post.tags?.some((tag) => tag.id === selectedTag)
      );
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'most_viewed':
          return b.view_count - a.view_count;
        default:
          return 0;
      }
    });

    return filtered;
  }, [posts, selectedBlog, selectedCategory, selectedTag, sortBy]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">記事管理</h1>
        <Link
          href="/admin/posts/create"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          新規作成
        </Link>
      </div>

      {/* フィルター・ソートコントロール */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
        <div className="grid gap-4 md:grid-cols-3">
          {/* カテゴリフィルター */}
          <div>
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリで絞り込み
            </label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべてのカテゴリ</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* タグフィルター */}
          <div>
            <label htmlFor="tag-filter" className="block text-sm font-medium text-gray-700 mb-1">
              タグで絞り込み
            </label>
            <select
              id="tag-filter"
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">すべてのタグ</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>

          {/* ソート */}
          <div>
            <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
              並び替え
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="newest">新しい順</option>
              <option value="oldest">古い順</option>
              <option value="most_viewed">閲覧数順</option>
            </select>
          </div>
        </div>
      </div>

      {/* 記事一覧テーブル */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タイトル
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ステータス
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                公開範囲
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                著者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                閲覧数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                更新日
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedPosts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {post.title}
                  </div>
                  <div className="text-sm text-gray-500">/{post.slug}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      post.status === 'published'
                        ? 'bg-green-100 text-green-800'
                        : post.status === 'draft'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {post.status === 'published'
                      ? '公開中'
                      : post.status === 'draft'
                      ? '下書き'
                      : 'アーカイブ'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      post.visibility === 'public'
                        ? 'bg-green-100 text-green-800'
                        : post.visibility === 'restricted'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {post.visibility === 'public'
                      ? '公開'
                      : post.visibility === 'restricted'
                      ? '限定公開'
                      : '非公開'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {post.author_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {post.view_count.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(post.updated_at).toLocaleDateString('ja-JP')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-gray-600 hover:text-gray-900"
                      target="_blank"
                    >
                      表示
                    </Link>
                    <Link
                      href={`/admin/posts/${post.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </Link>
                    {post.visibility === 'restricted' && (
                      <Link
                        href={`/admin/posts/${post.id}/access`}
                        className="text-green-600 hover:text-green-900"
                      >
                        権限
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {filteredAndSortedPosts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mt-6">
          <p className="text-gray-600">条件に一致する記事がありません。</p>
        </div>
      )}
    </div>
  );
}
