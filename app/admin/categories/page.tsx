import { fetchCategories } from '@/app/lib/data';
import CategoriesClient from './categories-client';

// カテゴリ管理ページ（Server Component）
export default async function CategoriesPage() {
  // データベースからカテゴリを取得
  const categories = await fetchCategories();

  return <CategoriesClient initialCategories={categories} />;
}
