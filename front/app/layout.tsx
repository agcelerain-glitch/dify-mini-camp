import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
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

const SITE_URL = 'https://dify-minicamp.vercel.app';
const SITE_TITLE = 'Dify mini Camp — AIワークフローを学ぶ学習プラットフォーム';
const SITE_DESCRIPTION =
  'Difyの学習をDifyを使って行う。AIメンター付き5段階フェーズ学習プラットフォーム。初心者から中上級者まで、実践的なハンズオンでDifyをマスターしよう。';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: '%s | Dify mini Camp',
  },
  description: SITE_DESCRIPTION,
  keywords: [
    'Dify', 'AIワークフロー', 'LLM', 'ノーコードAI', 'プロンプトエンジニアリング',
    'RAG', 'AIメンター', '学習プラットフォーム', 'ハンズオン', 'Dify入門',
    'AIアプリ開発', 'チャットボット作成', 'Dify使い方',
  ],
  alternates: {
    canonical: SITE_URL + '/',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: SITE_URL,
    siteName: 'Dify mini Camp',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    other: [
      { rel: 'android-chrome-192x192', url: '/android-chrome-192x192.png' },
      { rel: 'android-chrome-512x512', url: '/android-chrome-512x512.png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Dify mini Camp',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  provider: {
    '@type': 'Organization',
    name: 'Dify mini Camp',
    url: SITE_URL,
  },
  educationalLevel: '初級〜上級',
  inLanguage: 'ja',
  courseMode: 'online',
  teaches: 'Dify AIワークフロー, LLM, RAG, プロンプトエンジニアリング',
  hasCourseInstance: [
    { '@type': 'CourseInstance', name: 'Phase 1 — LLMの基本とGUI操作', courseMode: 'online' },
    { '@type': 'CourseInstance', name: 'Phase 2 — 変数とプロンプトエンジニアリング', courseMode: 'online' },
    { '@type': 'CourseInstance', name: 'Phase 3 — 条件分岐とロジック', courseMode: 'online' },
    { '@type': 'CourseInstance', name: 'Phase 4 — ナレッジ機能と環境変数', courseMode: 'online' },
    { '@type': 'CourseInstance', name: 'Phase 5 — オーケストレートと堅牢性', courseMode: 'online' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full bg-slate-950 text-white">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LCVT8DNFG8"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LCVT8DNFG8');
          `}
        </Script>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
