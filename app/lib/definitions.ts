// ブログ用の型定義
// データベーススキーマに対応する型を定義

export type UserRole = 'admin' | 'editor' | 'user';

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  avatar_url: string | null; // プロフィール画像URL
  bio: string | null; // 自己紹介文
  created_at: Date;
};

// メディアファイル
export type Media = {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_type: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  created_at: Date;
};

// ブログサイト
export type Blog = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  is_private: boolean; // プライベートブログかどうか（trueの場合、認証が必要）
  created_at: Date;
};

// ブログアクセス権限（プライベートブログへのアクセス権）
export type BlogAccess = {
  id: string;
  blog_id: string;
  user_id: string;
  granted_at: Date;
};

// 記事アクセス権限（限定公開記事へのアクセス権）
export type PostAccess = {
  id: string;
  post_id: string;
  user_id: string;
  granted_at: Date;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  blog_id: string | null;
  created_at: Date;
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  blog_id: string | null;
  created_at: Date;
};

export type PostVisibility = 'public' | 'private' | 'restricted';

export type Post = {
  id: string;
  blog_id: string | null;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  status: 'draft' | 'published' | 'archived';
  visibility: PostVisibility;
  author_id: string;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  view_count: number; // 閲覧数
};

// 記事一覧表示用（著者情報、カテゴリ、タグを含む）
export type PostWithAuthor = Post & {
  author_name: string;
  author_email: string;
  categories?: Category[];
  tags?: Tag[];
};

// 記事詳細表示用（カテゴリ、タグ、著者を含む）
export type PostDetail = Post & {
  author_name: string;
  author_email: string;
  author_avatar: string | null;
  categories: Category[];
  tags: Tag[];
};

// 記事フォーム用
export type PostForm = {
  id?: string;
  blog_id?: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image?: string;
  status: 'draft' | 'published' | 'archived';
  visibility: PostVisibility;
  category_ids: string[];
  tag_ids: string[];
  allowed_user_ids?: string[]; // 限定公開時の閲覧許可ユーザー
};

// 記事一覧のフィルタリング用
export type PostsFilter = {
  query?: string;
  category?: string;
  tag?: string;
  status?: 'draft' | 'published' | 'archived';
  author_id?: string;
};

// リアクションタイプ
export type ReactionType = 'like' | 'love' | 'clap' | 'rocket' | 'fire';

// コメント
export type Comment = {
  id: string;
  post_id: string;
  parent_id: string | null; // 返信先のコメントID
  author_name: string;
  author_email: string;
  content: string;
  created_at: Date;
  approved: boolean;
};

// コメント（返信とリアクション情報付き）
export type CommentWithReplies = Comment & {
  replies: Comment[];
  reactions: { [key in ReactionType]: number };
  user_reaction?: ReactionType | null; // ユーザーがつけたリアクション
};

// コメントフォーム用
export type CommentForm = {
  post_id: string;
  parent_id?: string | null; // 返信先のコメントID
  author_name: string;
  author_email: string;
  content: string;
};

// 記事へのリアクション
export type PostReaction = {
  id: string;
  post_id: string;
  user_id: string | null;
  session_id: string | null;
  reaction_type: ReactionType;
  created_at: Date;
};

// コメントへのリアクション
export type CommentReaction = {
  id: string;
  comment_id: string;
  user_id: string | null;
  session_id: string | null;
  reaction_type: ReactionType;
  created_at: Date;
};

// リアクション集計
export type ReactionSummary = {
  [key in ReactionType]: number;
};
