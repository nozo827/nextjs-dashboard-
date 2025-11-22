import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// データベースからユーザーを取得
async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await sql`
      SELECT id, email, name, password, role, avatar_url, created_at
      FROM users
      WHERE email = ${email}
    `;
    return result.rows[0] as User | undefined;
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return undefined;
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;

          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Googleログインの場合、データベースにユーザーが存在しない場合は作成
      if (account?.provider === 'google' && user.email) {
        try {
          const existingUser = await sql`
            SELECT id FROM users WHERE email = ${user.email}
          `;

          if (existingUser.rows.length === 0) {
            // 新規ユーザーを作成（一般ユーザーとして）
            await sql`
              INSERT INTO users (name, email, password, role, avatar_url, created_at)
              VALUES (${user.name || 'Google User'}, ${user.email}, '', 'user', ${user.image || null}, NOW())
            `;
          }
        } catch (error) {
          console.error('Failed to create user:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // 初回ログイン時
      if (user) {
        // Googleログインの場合、データベースから最新のユーザー情報を取得
        if (account?.provider === 'google' && user.email) {
          try {
            const dbUser = await getUser(user.email);
            if (dbUser) {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.sub = dbUser.id;
            }
          } catch (error) {
            console.error('Failed to fetch user in jwt callback:', error);
          }
        } else if (user.id) {
          // 通常のログイン（Credentials）
          token.id = user.id;
          token.role = (user as any).role || 'user';
          token.sub = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // セッションにユーザー情報を追加
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = (token.role as 'admin' | 'user') || 'user';
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute = nextUrl.pathname.startsWith('/admin');

      // 管理画面は認証が必要
      if (isAdminRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },
});
