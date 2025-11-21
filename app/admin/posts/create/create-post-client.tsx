'use client';

import { useState, useRef, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createPost } from '@/app/lib/actions';
import type { Blog, Category, Tag } from '@/app/lib/definitions';
import MediaUploader from '@/app/ui/media-uploader';

interface CreatePostClientProps {
  blogs: Blog[];
  categories: Category[];
  tags: Tag[];
}

// 記事作成ページ（クライアントコンポーネント）
export default function CreatePostClient({
  blogs,
  categories,
  tags,
}: CreatePostClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [blogId, setBlogId] = useState(blogs[0]?.id || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // フォーム状態管理
  const initialState = { message: null, errors: {} };
  const [state, formAction] = useFormState(createPost, initialState);

  // タイトルからスラッグを自動生成
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (!slug) {
      setSlug(generateSlug(newTitle));
    }
  };

  // メディアを本文に挿入
  const handleMediaInsert = (url: string, type: string) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    let markdown = '';

    if (type.startsWith('image/')) {
      // 画像のマークダウン
      markdown = `![画像](${url})`;
    } else if (type.startsWith('video/')) {
      // 動画のHTML（マークダウンは動画をサポートしていないため）
      markdown = `<video controls width="100%">\n  <source src="${url}" type="${type}">\n  お使いのブラウザは動画タグをサポートしていません。\n</video>`;
    }

    // カーソル位置にマークダウンを挿入
    const newContent =
      content.substring(0, cursorPosition) +
      '\n\n' +
      markdown +
      '\n\n' +
      content.substring(cursorPosition);

    setContent(newContent);

    // テキストエリアにフォーカスを戻す
    setTimeout(() => {
      textarea.focus();
      const newPosition = cursorPosition + markdown.length + 4;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    // カテゴリとタグをフォームデータに追加
    selectedCategories.forEach((categoryId) => {
      formData.append('category_ids', categoryId);
    });
    selectedTags.forEach((tagId) => {
      formData.append('tag_ids', tagId);
    });

    startTransition(async () => {
      const result = await formAction(formData);
      // エラーがなければリダイレクトされる
    });
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/posts"
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          記事一覧に戻る
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">新規記事作成</h1>

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
        {/* ブログ選択 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="blog_id" className="block text-sm font-medium text-gray-700 mb-2">
            ブログ <span className="text-red-500">*</span>
          </label>
          <select
            id="blog_id"
            name="blog_id"
            value={blogId}
            onChange={(e) => setBlogId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {blogs.map((blog) => (
              <option key={blog.id} value={blog.id}>
                {blog.name}
              </option>
            ))}
          </select>
          {state.errors?.blog_id && (
            <p className="mt-1 text-sm text-red-600">{state.errors.blog_id[0]}</p>
          )}
        </div>

        {/* タイトル */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 text-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.errors?.title && (
            <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>
          )}
        </div>

        {/* スラッグ */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
            スラッグ（URL） <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">URL: /blog/{slug}</p>
          {state.errors?.slug && (
            <p className="mt-1 text-sm text-red-600">{state.errors.slug[0]}</p>
          )}
        </div>

        {/* 抜粋 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700 mb-2">
            抜粋
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {state.errors?.excerpt && (
            <p className="mt-1 text-sm text-red-600">{state.errors.excerpt[0]}</p>
          )}
        </div>

        {/* 画像・動画アップロード */}
        <MediaUploader onInsert={handleMediaInsert} />

        {/* 本文 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            本文 <span className="text-red-500">*</span>
          </label>
          <textarea
            ref={contentTextareaRef}
            id="content"
            name="content"
            required
            rows={15}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            マークダウン形式で記述できます。画像・動画は上のアップローダーから挿入してください。
          </p>
          {state.errors?.content && (
            <p className="mt-1 text-sm text-red-600">{state.errors.content[0]}</p>
          )}
        </div>

        {/* カテゴリとタグ */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">カテゴリ</label>
            <div className="space-y-2">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={category.id}
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(
                          selectedCategories.filter((id) => id !== category.id)
                        );
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">タグ</label>
            <div className="space-y-2">
              {tags.map((tag) => (
                <label key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    value={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{tag.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* ステータス */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">ステータス</label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="draft"
                defaultChecked
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">下書き</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="published"
                className="border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">公開</span>
            </label>
          </div>
        </div>

        {/* 公開範囲 */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            公開範囲
          </label>
          <div className="space-y-2">
            <label className="flex items-start">
              <input
                type="radio"
                name="visibility"
                value="public"
                defaultChecked
                className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">公開</span>
                <p className="text-xs text-gray-500 mt-1">
                  誰でも閲覧できます
                </p>
              </div>
            </label>
            <label className="flex items-start">
              <input
                type="radio"
                name="visibility"
                value="restricted"
                className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">限定公開</span>
                <p className="text-xs text-gray-500 mt-1">
                  ログインユーザーのうち、アクセス権を付与されたユーザーのみ閲覧可能
                </p>
              </div>
            </label>
            <label className="flex items-start">
              <input
                type="radio"
                name="visibility"
                value="private"
                className="mt-1 border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="ml-2">
                <span className="text-sm font-medium text-gray-900">非公開</span>
                <p className="text-xs text-gray-500 mt-1">
                  管理者と著者のみ閲覧可能
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-8 py-3 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isPending ? '作成中...' : '作成する'}
          </button>
          <Link
            href="/admin/posts"
            className="rounded-md border border-gray-300 bg-white px-8 py-3 text-gray-700 font-medium hover:bg-gray-50"
          >
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
