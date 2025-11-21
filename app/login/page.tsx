export const dynamic = "force-dynamic";
import LoginForm from '@/app/ui/login-form';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ログイン</h1>
          <p className="text-gray-600">
            アカウントにログインしてください
          </p>
          <p className="mt-2 text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              新規登録
            </Link>
          </p>
        </div>
        <LoginForm />
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">テストアカウント:</p>
          <div className="space-y-1 text-xs">
            <p>管理者: admin@example.com / password123</p>
            <p>編集者: editor@example.com / password123</p>
            <p>一般: user@example.com / password123</p>
          </div>
        </div>
      </div>
    </main>
  );
}
