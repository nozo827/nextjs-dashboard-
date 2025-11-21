import '@/app/ui/global.css';
import { inter } from '@/app/ui/fonts';
import { Metadata } from 'next';
import { Providers } from '@/app/providers';

export const metadata: Metadata = {
  title: {
    template: '%s | Blog Site',
    default: 'Blog Site',
  },
  description: 'ブログサイト',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

