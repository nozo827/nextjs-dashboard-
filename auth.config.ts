import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');

      // 管理画面は認証が必要
      if (isAdminRoute) {
        return isLoggedIn;
      }

      return true;
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role;
      }
      return session;
    },
    async jwt({ token, user }) {
      // JWTにユーザー情報を追加
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
  },
  providers: [], // 後で追加
} satisfies NextAuthConfig;