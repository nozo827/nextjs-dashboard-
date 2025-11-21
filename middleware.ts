export { auth as middleware } from '@/auth';

export const config = {
  // 管理画面のみ認証を必須にする
  matcher: ['/admin/:path*'],
};
