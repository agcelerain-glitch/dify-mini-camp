import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/providers/Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Dify mini Camp — AIワークフローを学ぶ学習プラットフォーム',
  description:
    'Difyの学習をDifyを使って行う。AIメンター付き5段階フェーズ学習プラットフォーム。初心者から中上級者まで、実践的なハンズオンでDifyをマスターしよう。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-slate-950 text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
