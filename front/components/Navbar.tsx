'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  const navLinks = [
    { href: '/home', label: 'ホーム' },
    { href: '/camp', label: 'キャンプ' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            ⛺ Dify mini Camp
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-indigo-600 text-xs text-white">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm text-slate-300 sm:inline">{user.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-xs text-slate-400 hover:text-white"
              >
                ログアウト
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
