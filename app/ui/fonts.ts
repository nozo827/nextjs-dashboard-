import { Inter, Lusitana } from 'next/font/google'; // 👈 Lusitana をインポートに追加

export const inter = Inter({ subsets: ['latin'] });

// 👇 この3行を追加
export const lusitana = Lusitana({
  weight: ['400', '700'],
  subsets: ['latin'],
});