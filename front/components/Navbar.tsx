'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bug, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const [showBugReport, setShowBugReport] = useState(false);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);

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
      if (!res.ok) throw new Error('failed');
      setSubmitted(true);
    } catch {
      setSubmitError(true);
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

              {/* バグ報告ボタン（キャンプの右隣） */}
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

      {/* バグ報告モーダル */}
      {showBugReport && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeBugReport(); }}
        >
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            {/* ヘッダー */}
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
              /* 送信完了 */
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
              /* 入力フォーム */
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
                  <p className="mb-3 text-xs text-rose-400">送信に失敗しました。もう一度お試しください。</p>
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
