import { sql } from '@vercel/postgres';
import AdminDashboardClient from './admin-dashboard-client';
import type { Blog } from '@/app/lib/definitions';

// 管理画面トップページ
export default async function AdminPage() {
  // すべてのブログを取得
  const blogsResult = await sql`
    SELECT id, name, slug, description, is_private
    FROM blogs
    ORDER BY name ASC
  `;
  const blogs = blogsResult.rows as Blog[];

  // 各ブログの統計を取得
  const blogStats = await Promise.all(
    blogs.map(async (blog) => {
      // 記事統計
      const postsResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'published') as published,
          COUNT(*) FILTER (WHERE status = 'draft') as draft
        FROM posts
        WHERE blog_id = ${blog.id}
      `;

      // コメント統計
      const commentsResult = await sql`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE NOT approved) as pending
        FROM comments
        WHERE post_id IN (SELECT id FROM posts WHERE blog_id = ${blog.id})
      `;

      return {
        blogId: blog.id,
        totalPosts: parseInt(postsResult.rows[0]?.total || '0'),
        publishedPosts: parseInt(postsResult.rows[0]?.published || '0'),
        draftPosts: parseInt(postsResult.rows[0]?.draft || '0'),
        totalComments: parseInt(commentsResult.rows[0]?.total || '0'),
        pendingComments: parseInt(commentsResult.rows[0]?.pending || '0'),
      };
    })
  );

  return <AdminDashboardClient blogs={blogs} blogStats={blogStats} />;
}
