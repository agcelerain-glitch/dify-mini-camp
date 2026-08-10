'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bug, X, NotebookPen, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { NotesModal } from '@/components/NotesModal';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [showNotes, setShowNotes] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | false>(false);

  function handleSignOut() {
    signOut();
    router.push('/');
  }

  function openBugReport() {
    setSubject('');
    setContent('');
    setSubmitted(false);
    setSubmitError(false);
    setShowBugReport(true);
  }

  function closeBugReport() {
    if (submitting) return;
    setShowBugReport(false);
  }

  async function handleSubmit() {
    if (!subject.trim() || !content.trim() || submitting) return;
    setSubmitting(true);
    setSubmitError(false);
    try {
      const res = await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), content: content.trim() }),
      });
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw Object.assign(new Error('rate_limited'), { userMsg: data.error ?? '送信が多すぎます。しばらく経ってから再度お試しください。' });
      }
      if (!res.ok) throw new Error('failed');
      setSubmitted(true);
    } catch (e: unknown) {
      const msg = (e instanceof Error && (e as Error & { userMsg?: string }).userMsg) || '送信に失敗しました。もう一度お試しください。';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const navLinks = [
    { href: '/home', label: 'ホーム' },
    { href: '/camp', label: 'キャンプ' },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/home" className="flex items-center gap-2">
            <span className="text-lg font-bold text-white">
              ⛺ Dify mini Camp
            </span>
          </Link>

          {/* デスクトップ: ナビ + ユーザー情報 */}
          <div className="hidden items-center gap-6 sm:flex">
            <div className="flex items-center gap-1">
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

              {user && (
                <button
                  onClick={() => setShowNotes(true)}
                  title="ノート・メモを開く"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                >
                  <NotebookPen size={14} />
                  <span>メモ</span>
                </button>
              )}

              {user && (
                <button
                  onClick={openBugReport}
                  title="バグ・不具合を報告する"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-slate-400 transition-colors hover:text-white"
                >
                  <Bug size={14} />
                  <span>報告</span>
                </button>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-indigo-600 text-xs text-white">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-slate-300">{user.name}</span>
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

          {/* モバイル: ハンバーガー丸ボタン */}
          <button
            onClick={() => setShowMobileMenu(true)}
            aria-label="メニューを開く"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
          >
            <Menu size={20} />
          </button>
        </div>
      </nav>

      {/* モバイルメニュー: 背景オーバーレイ */}
      <div
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          showMobileMenu ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setShowMobileMenu(false)}
      />

      {/* モバイルメニュー: スライドパネル */}
      <div
        className={`fixed bottom-0 right-0 top-0 z-[70] flex w-72 flex-col bg-slate-900 border-l border-white/10 transition-transform duration-300 ease-in-out sm:hidden ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* パネルヘッダー */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="text-sm font-semibold text-white">メニュー</span>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="rounded-lg p-1.5 text-slate-500 hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* ユーザー情報 */}
          {user && (
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-indigo-600 text-sm text-white">
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-slate-500">学習者</p>
              </div>
            </div>
          )}

          {/* ページリンク */}
          <div className="px-3 py-4">
            <p className="mb-2 px-2 text-xs font-medium text-slate-500">ページ</p>
            <div className="space-y-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === link.href
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* アクション */}
          {user && (
            <div className="px-3 pb-4">
              <p className="mb-2 px-2 text-xs font-medium text-slate-500">アクション</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setShowNotes(true); setShowMobileMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <NotebookPen size={16} />
                  メモ
                </button>
                <button
                  onClick={() => { openBugReport(); setShowMobileMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
                >
                  <Bug size={16} />
                  バグ・不具合を報告
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ログアウト（フッター固定） */}
        {user && (
          <div className="border-t border-white/10 px-3 py-4">
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>

      {/* メモモーダル */}
      <NotesModal open={showNotes} onClose={() => setShowNotes(false)} />

      {/* バグ報告モーダル */}
      {showBugReport && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeBugReport(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bug size={18} className="text-rose-400" />
                <h2 className="text-base font-semibold text-white">バグ・不具合の報告</h2>
              </div>
              <button
                onClick={closeBugReport}
                className="rounded-lg p-1 text-slate-500 hover:text-slate-300"
              >
                <X size={18} />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <span className="text-3xl">✅</span>
                <p className="font-semibold text-white">報告を受け付けました</p>
                <p className="text-sm text-slate-400">ご報告ありがとうございます。確認次第対応します。</p>
                <Button
                  onClick={closeBugReport}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-500"
                >
                  閉じる
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-xs text-slate-500">
                  氏名・メールアドレスは非表示ですが、報告内容と共にシステムに記録されます。
                </p>

                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    件名 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="例：フェーズ3のページが表示されない"
                    maxLength={100}
                    className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    内容 <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="どのような操作をしたときに、どんな問題が起きたか教えてください。"
                    rows={5}
                    maxLength={1000}
                    className="w-full resize-none rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="mt-1 text-right text-xs text-slate-600">{content.length} / 1000</p>
                </div>

                {submitError && (
                  <p className="mb-3 text-xs text-rose-400">{submitError}</p>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={closeBugReport}
                    className="flex-1 border border-white/10 text-slate-400 hover:text-white"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!subject.trim() || !content.trim() || submitting}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
                  >
                    {submitting ? '送信中...' : '報告する'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
