'use client'; // 👈 1. ファイルの一番上に追加

import {
  UserGroupIcon,
  HomeIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link'; // 👈 2. Link をインポート
import { usePathname } from 'next/navigation'; // 👈 3. usePathname をインポート
import clsx from 'clsx'; // 👈 4. clsx をインポート

// Map of links to display in the side navigation.
// Depending on the size of the application, this would be stored in a database.
const links = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Invoices',
    href: '/dashboard/invoices',
    icon: DocumentDuplicateIcon,
  },
  { name: 'Customers', href: '/dashboard/customers', icon: UserGroupIcon },
];

export default function NavLinks() {
  const pathname = usePathname(); // 👈 5. 現在のパスを取得

  return (
    <>
      {links.map((link) => {
        const LinkIcon = link.icon;
        return (
          <Link // 👈 6. <a> を <Link> に変更
            key={link.name}
            href={link.href}
            // 👇 7. className を clsx を使うように変更
            className={clsx(
              'flex h-[48px] grow items-center justify-center gap-2 rounded-md bg-gray-50 p-3 text-sm font-medium hover:bg-sky-100 hover:text-blue-600 md:flex-none md:justify-start md:p-2 md:px-3',
              {
                'bg-sky-100 text-blue-600': pathname === link.href, // 👈 ハイライトの条件
              },
            )}
          >
            <LinkIcon className="w-6" />
            <p className="hidden md:block">{link.name}</p>
          </Link> // 👈 6. </a> を </Link> に変更
        );
      })}
    </>
  );
}