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
    ...authConfig.callbacks,
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
  },
});
