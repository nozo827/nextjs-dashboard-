import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

// データベースからユーザーを取得
async function getUser(email: string): Promise<User | undefined> {
  try {
    const result = await sql`
      SELECT id, email, name, password, role, avatar_url, created_at, updated_at
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
});
