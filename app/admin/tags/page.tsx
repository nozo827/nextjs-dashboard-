import { fetchTags } from '@/app/lib/data';
import TagsClient from './tags-client';

// タグ管理ページ（Server Component）
export default async function TagsPage() {
  // データベースからタグを取得
  const tags = await fetchTags();

  return <TagsClient initialTags={tags} />;
}
