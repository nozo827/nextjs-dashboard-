import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts'; // 👈 この行を追加

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* 👇 bodyタグのclassNameを変更 */}
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}