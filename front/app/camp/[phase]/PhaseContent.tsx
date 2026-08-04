'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Phase, Level, InputPage, OutputPage, Page, PHASES } from '@/lib/phases-data';
import { Navbar } from '@/components/Navbar';
import { ChatbotButton } from '@/components/ChatbotButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Props = { phase: Phase };

export function PhaseContent({ phase }: Props) {
  const { user, isLoading } = useAuth();
  const { progress, isLevelCleared, isPageCleared, completePage, completeLevel } = useProgress();
  const router = useRouter();

  const [currentLevelId, setCurrentLevelId] = useState(1);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // ページ/レベル切替時にスクロールトップ
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageIndex, currentLevelId]);

  // クイズ/アウトプット用状態
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [user, isLoading, router]);

  const currentLevel = phase.levels.find((l) => l.id === currentLevelId) ?? phase.levels[0];
  const currentPage = currentLevel.pages[currentPageIndex];
  const totalPages = currentLevel.pages.length;
  const levelProgress = Math.round(
    ((progress.phases[phase.id]?.levels[currentLevelId]?.clearedPages.length ?? 0) / totalPages) * 100,
  );

  function scrollTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetPageState() {
    setSelectedOption(null);
    setAnswered(false);
    setShortAnswer('');
    setChatInput('');
    setChatMessages([]);
    setShowHint(false);
  }

  function goToLevel(levelId: number) {
    setCurrentLevelId(levelId);
    setCurrentPageIndex(0);
    resetPageState();
    scrollTop();
  }

  function goToPage(index: number) {
    setCurrentPageIndex(index);
    resetPageState();
    scrollTop();
  }

  function handleNext() {
    completePage(phase.id, currentLevelId, currentPage.id);
    if (currentPageIndex < totalPages - 1) {
      goToPage(currentPageIndex + 1);
    } else {
      completeLevel(phase.id, currentLevelId);
    }
  }

  function handleMultipleChoice(idx: number) {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
  }

  function handleShortAnswerSubmit() {
    if (!shortAnswer.trim()) return;
    setAnswered(true);
  }

  function handleChatSend() {
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    setTimeout(() => {
      const reply = mockMentorReply(text, phase.id, currentLevelId, currentPage.id);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  }

  const canProceed: boolean = (() => {
    if (currentPage.type === 'input') return true;
    const out = currentPage as OutputPage;
    if (out.format === 'multiple-choice') return answered;
    if (out.format === 'short-answer') return answered;
    if (out.format === 'chat') return chatMessages.length > 0;
    return false;
  })();

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const phaseAllClearedLevels = Object.values(progress.phases[phase.id]?.levels ?? {}).filter(
    (l) => l.clearedAt,
  ).length;
  const phaseProgress = Math.round((phaseAllClearedLevels / phase.levels.length) * 100);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* ===== 左サイドバー ===== */}
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-white/10 lg:block">
          <div className="p-4">
            <Link href="/camp" className="mb-4 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
              ← キャンプに戻る
            </Link>

            <div className="mb-4">
              <p className="text-xs text-slate-500">{phase.subtitle}</p>
              <h2 className={`text-sm font-bold ${phase.textColor}`}>{phase.title}</h2>
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-xs text-slate-600">
                  <span>フェーズ進捗</span>
                  <span>{phaseProgress}%</span>
                </div>
                <Progress value={phaseProgress} className="h-1 bg-slate-800" />
              </div>
            </div>

            <div className="space-y-2">
              {phase.levels.map((level) => {
                const lCleared = isLevelCleared(phase.id, level.id);
                const lActive = level.id === currentLevelId;
                const lPageCount = level.pages.length;
                const lClearedPages =
                  progress.phases[phase.id]?.levels[level.id]?.clearedPages.length ?? 0;
                const lPct = Math.round((lClearedPages / lPageCount) * 100);

                return (
                  <div key={level.id}>
                    <button
                      onClick={() => goToLevel(level.id)}
                      className={`w-full rounded-xl p-3 text-left transition-colors ${
                        lActive
                          ? `${phase.borderColor} border bg-slate-800`
                          : 'border border-transparent hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${lActive ? phase.textColor : 'text-slate-500'}`}>
                          Level {level.id}
                        </span>
                        {lCleared && <span className="ml-auto text-xs">✅</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{level.title}</p>
                      <div className="mt-2">
                        <Progress value={lPct} className="h-0.5 bg-slate-700" />
                      </div>
                    </button>

                    {lActive && (
                      <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                        {level.pages.map((page, idx) => {
                          const pCleared = isPageCleared(phase.id, level.id, page.id);
                          const pActive = idx === currentPageIndex;
                          return (
                            <button
                              key={page.id}
                              onClick={() => goToPage(idx)}
                              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                                pActive
                                  ? `${phase.textColor} bg-slate-800 font-medium`
                                  : pCleared
                                  ? 'text-slate-400 hover:bg-slate-800'
                                  : 'text-slate-600 hover:bg-slate-800/50'
                              }`}
                            >
                              <span>
                                {pCleared ? '✅' : page.type === 'input' ? '📖' : '✏️'}
                              </span>
                              <span className="line-clamp-1">
                                P{page.id}. {page.title}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ===== メインコンテンツ ===== */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div id="page-top" />
          {/* モバイルレベル切替 */}
          <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-950/95 px-4 py-2 lg:hidden">
            {phase.levels.map((level) => (
              <button
                key={level.id}
                onClick={() => goToLevel(level.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                  level.id === currentLevelId
                    ? `${phase.borderColor} ${phase.textColor} bg-slate-800`
                    : 'border-white/10 text-slate-500'
                }`}
              >
                {isLevelCleared(phase.id, level.id) ? '✅ ' : ''}Lv.{level.id}
              </button>
            ))}
          </div>

          <div className="mx-auto max-w-3xl px-4 py-6">
            {/* パンくず */}
            <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
              <Link href="/camp" className="hover:text-slate-300">キャンプ</Link>
              <span>/</span>
              <span>{phase.subtitle}</span>
              <span>/</span>
              <span className={phase.textColor}>Level {currentLevelId}</span>
              <span>/</span>
              <span>ページ {currentPage.id}</span>
            </div>

            {/* レベルヘッダー */}
            <div className={`mb-4 rounded-xl border ${phase.borderColor} bg-gradient-to-r ${phase.bgGradient} p-4`}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`text-xs ${phase.badgeBg}`}>Level {currentLevelId}</Badge>
                <Badge className="bg-slate-700 text-xs text-slate-300">
                  {currentLevel.estimatedTime}
                </Badge>
              </div>
              <h2 className="mt-2 text-lg font-bold text-white">{currentLevel.title}</h2>
              <p className="text-sm text-slate-400">{currentLevel.description}</p>
            </div>

            {/* ページタブ */}
            <div className="mb-4 flex items-center gap-2">
              <div className="flex flex-1 gap-1.5 overflow-x-auto pb-1">
                {currentLevel.pages.map((page, idx) => {
                  const pCleared = isPageCleared(phase.id, currentLevelId, page.id);
                  const pActive = idx === currentPageIndex;
                  return (
                    <button
                      key={page.id}
                      onClick={() => goToPage(idx)}
                      className={`shrink-0 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        pActive
                          ? `${phase.borderColor} ${phase.textColor} bg-slate-800 font-medium`
                          : pCleared
                          ? 'border-white/10 text-slate-400 hover:bg-slate-800'
                          : 'border-white/5 text-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      {pCleared && !pActive ? '✅ ' : page.type === 'input' ? '📖 ' : '✏️ '}
                      ページ{page.id}
                    </button>
                  );
                })}
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {currentPageIndex + 1} / {totalPages}
              </span>
            </div>

            {/* ページコンテンツ */}
            <div className={`rounded-2xl border ${phase.borderColor} bg-slate-900`}>
              {/* ページヘッダー */}
              <div className={`border-b ${phase.borderColor} px-6 py-4 bg-gradient-to-r ${phase.bgGradient}`}>
                <div className="flex items-center gap-2">
                  <Badge className={`text-xs ${phase.badgeBg}`}>
                    {currentPage.type === 'input' ? '📖 インプット' : '✏️ アウトプット'}
                  </Badge>
                  <span className="text-xs text-slate-500">ページ {currentPage.id} / {totalPages}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">{currentPage.title}</h3>
              </div>

              <div className="p-6">
                {currentPage.type === 'input' ? (
                  <InputPageContent page={currentPage as InputPage} phaseColor={phase.textColor} />
                ) : (
                  <OutputPageContent
                    page={currentPage as OutputPage}
                    phaseColor={phase.textColor}
                    phaseBorderColor={phase.borderColor}
                    selectedOption={selectedOption}
                    answered={answered}
                    shortAnswer={shortAnswer}
                    chatInput={chatInput}
                    chatMessages={chatMessages}
                    showHint={showHint}
                    isTyping={isTyping}
                    onSelectOption={handleMultipleChoice}
                    onShortAnswerChange={setShortAnswer}
                    onShortAnswerSubmit={handleShortAnswerSubmit}
                    onChatInputChange={setChatInput}
                    onChatSend={handleChatSend}
                    onToggleHint={() => setShowHint((v) => !v)}
                  />
                )}

                {/* ナビゲーション */}
                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (currentPageIndex > 0) goToPage(currentPageIndex - 1);
                      else if (currentLevelId > 1) goToLevel(currentLevelId - 1);
                    }}
                    disabled={currentPageIndex === 0 && currentLevelId === 1}
                    className="text-slate-400 hover:text-white"
                  >
                    ← 前へ
                  </Button>

                  <div className="flex items-center gap-3">
                    {isPageCleared(phase.id, currentLevelId, currentPage.id) && (
                      <span className="text-xs text-emerald-400">✅ クリア済み</span>
                    )}

                    {currentPageIndex < totalPages - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        次のページへ →
                      </Button>
                    ) : !isLevelCleared(phase.id, currentLevelId) ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        レベルをクリア 🎉
                      </Button>
                    ) : currentLevelId < phase.levels.length ? (
                      <Button
                        onClick={() => goToLevel(currentLevelId + 1)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        次のレベルへ →
                      </Button>
                    ) : phase.id < PHASES.length ? (
                      <Button
                        onClick={() => router.push(`/camp/${phase.id + 1}`)}
                        className="bg-emerald-600 hover:bg-emerald-500"
                      >
                        次のフェーズへ →
                      </Button>
                    ) : (
                      <Button
                        onClick={() => router.push('/camp')}
                        className="bg-yellow-600 hover:bg-yellow-500"
                      >
                        🎊 全コース完了！
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* レベル進捗インジケーター */}
            <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/50 p-3">
              <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                <span>Level {currentLevelId} 進捗</span>
                <span>{levelProgress}%</span>
              </div>
              <Progress value={levelProgress} className="h-1 bg-slate-800" />
            </div>
          </div>
        </div>
      </div>

      <ChatbotButton />
    </div>
  );
}

// ============================================================
// コピーボタン付きコードブロック
// ============================================================
function CopyableCodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  function handleCopy() {
    const text = preRef.current?.textContent ?? '';
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="relative my-4">
      <pre
        ref={preRef}
        className="overflow-x-auto rounded-xl bg-slate-800 p-4 pr-24 font-mono text-sm text-slate-300 border border-white/10"
      >
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-600 transition-colors"
      >
        {copied ? '✓ コピー済み' : 'コピー'}
      </button>
    </div>
  );
}

// ============================================================
// インプットページ
// ============================================================
function InputPageContent({ page, phaseColor }: { page: InputPage; phaseColor: string }) {
  return (
    <div>
      <article className="prose-dify">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2: ({ children }) => (
              <h2 className="mb-3 mt-8 flex items-center gap-2 border-b border-white/10 pb-2 text-lg font-bold text-white first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-base font-semibold text-slate-200">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-relaxed text-slate-300">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-5 space-y-1.5 list-disc text-slate-300">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-5 space-y-1.5 list-decimal text-slate-300">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-relaxed text-slate-300">{children}</li>,
            code: ({ children, className }) => {
              const isBlock = className?.includes('language-');
              if (isBlock) return <code className="text-indigo-300">{children}</code>;
              return (
                <code className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-sm text-indigo-300">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <CopyableCodeBlock>{children}</CopyableCodeBlock>,
            table: ({ children }) => (
              <div className="my-6 overflow-x-auto rounded-2xl border border-white/10 shadow-lg shadow-black/20">
                <table className="w-full text-sm border-collapse">{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-gradient-to-r from-slate-800 to-slate-700/80">{children}</thead>
            ),
            th: ({ children }) => (
              <th className="px-5 py-3 text-left text-xs font-semibold tracking-wider text-slate-200 uppercase">
                {children}
              </th>
            ),
            tbody: ({ children }) => <tbody className="divide-y divide-white/5">{children}</tbody>,
            tr: ({ children }) => (
              <tr className="transition-colors hover:bg-white/[0.02]">{children}</tr>
            ),
            td: ({ children }) => (
              <td className="px-5 py-3 text-slate-300 align-top leading-relaxed">{children}</td>
            ),
            strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-indigo-500/50 pl-4 text-slate-400 italic">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-6 border-white/10" />,
          }}
        >
          {page.content}
        </ReactMarkdown>
      </article>

      {page.keyPoints && page.keyPoints.length > 0 && (
        <div className={`mt-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4`}>
          <p className="mb-3 text-sm font-semibold text-indigo-400">💡 このページのまとめ</p>
          <ul className="space-y-2">
            {page.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className={`mt-0.5 shrink-0 font-bold text-indigo-400`}>✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================
// アウトプットページ
// ============================================================
type OutputProps = {
  page: OutputPage;
  phaseColor: string;
  phaseBorderColor: string;
  selectedOption: number | null;
  answered: boolean;
  shortAnswer: string;
  chatInput: string;
  chatMessages: { role: 'user' | 'assistant'; text: string }[];
  showHint: boolean;
  isTyping: boolean;
  onSelectOption: (idx: number) => void;
  onShortAnswerChange: (val: string) => void;
  onShortAnswerSubmit: () => void;
  onChatInputChange: (val: string) => void;
  onChatSend: () => void;
  onToggleHint: () => void;
};

function OutputPageContent({
  page,
  selectedOption,
  answered,
  shortAnswer,
  chatInput,
  chatMessages,
  showHint,
  isTyping,
  onSelectOption,
  onShortAnswerChange,
  onShortAnswerSubmit,
  onChatInputChange,
  onChatSend,
  onToggleHint,
}: OutputProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-white/10 bg-slate-800/50 p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{page.question}</p>
      </div>

      {/* 選択肢 */}
      {page.format === 'multiple-choice' && page.options && (
        <div className="space-y-2.5">
          {page.options.map((opt, idx) => {
            let cls =
              'w-full rounded-xl border p-4 text-left text-sm transition-all ';
            if (!answered) {
              cls += 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/30 hover:bg-slate-700 cursor-pointer';
            } else if (selectedOption === idx) {
              cls += opt.isCorrect
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 cursor-default'
                : 'border-rose-500 bg-rose-500/20 text-rose-300 cursor-default';
            } else if (opt.isCorrect) {
              cls += 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400/70 cursor-default';
            } else {
              cls += 'border-white/5 bg-slate-800/30 text-slate-600 cursor-default';
            }
            return (
              <button key={idx} className={cls} onClick={() => onSelectOption(idx)}>
                <span className="mr-3 font-mono font-bold">{String.fromCharCode(65 + idx)}.</span>
                {opt.label}
              </button>
            );
          })}
          {answered && (
            <div
              className={`mt-2 rounded-xl border p-3 text-sm ${
                page.options[selectedOption ?? 0]?.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {page.options[selectedOption ?? 0]?.isCorrect
                ? '✅ 正解です！次のページへ進みましょう。'
                : `❌ 不正解。正解は「${page.options.find((o) => o.isCorrect)?.label}」です。もう一度復習してから次へ進みましょう。`}
            </div>
          )}
        </div>
      )}

      {/* 短答 */}
      {page.format === 'short-answer' && (
        <div>
          <textarea
            value={shortAnswer}
            onChange={(e) => onShortAnswerChange(e.target.value)}
            disabled={answered}
            placeholder="ここに回答を入力してください..."
            rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-800 p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          {!answered ? (
            <Button
              onClick={onShortAnswerSubmit}
              disabled={!shortAnswer.trim()}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500"
            >
              回答する
            </Button>
          ) : (
            <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-slate-300">
              ✅ 回答しました。AIメンターへの報告も活用しながら次のページへ進みましょう。
            </div>
          )}
        </div>
      )}

      {/* チャット */}
      {page.format === 'chat' && (
        <div>
          <div className="mb-3 h-56 overflow-y-auto rounded-xl border border-white/10 bg-slate-800 p-3 space-y-2">
            {chatMessages.length === 0 && (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-slate-600">AIメンターに話しかけてみましょう</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'rounded-br-sm bg-indigo-600 text-white'
                      : 'rounded-bl-sm bg-slate-700 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-700 px-3 py-2">
                  <span className="flex gap-1 text-slate-400">
                    {[0, 150, 300].map((d) => (
                      <span
                        key={d}
                        className="animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      >•</span>
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isTyping && onChatSend()}
              placeholder="メンターに話しかける... (Enterで送信)"
              disabled={isTyping}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <Button
              onClick={onChatSend}
              disabled={!chatInput.trim() || isTyping}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              送信
            </Button>
          </div>
          {chatMessages.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              AIメンターと会話できたら「次のページへ」ボタンで進めます。
            </p>
          )}
        </div>
      )}

      {/* ヒント */}
      {page.hint && (
        <div className="mt-5">
          <button
            onClick={onToggleHint}
            className="text-xs text-slate-500 underline hover:text-slate-300"
          >
            {showHint ? 'ヒントを隠す ▲' : 'ヒントを見る ▼'}
          </button>
          {showHint && (
            <div className="mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
              💡 {page.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// モックメンター応答
// ============================================================
function mockMentorReply(input: string, phaseId: number, levelId: number, pageId: number): string {
  const lower = input.toLowerCase();
  if (lower.includes('完了') || lower.includes('できました') || lower.includes('しました') || lower.includes('繋ぎ')) {
    return `素晴らしいです！Phase ${phaseId} Level ${levelId} ページ${pageId}の内容を実践されたんですね。\n\n実際に手を動かすことで概念が体感として定着します。「次のページへ」ボタンを押して次へ進みましょう！何か気になった点があればいつでも聞いてください。`;
  }
  if (lower.includes('わからない') || lower.includes('教えて') || lower.includes('ヒント') || lower.includes('詰まっ')) {
    const hints: Record<number, string> = {
      1: 'まずcloud.dify.aiにアクセスして、「スタジオ」タブを開いてみましょう。+ボタンからアプリを作成できます。',
      2: '開始ブロックの設定パネルを開くと「入力フィールドを追加」ボタンがあります。変数名はスペルミスに注意してください。',
      3: '質問分類器ブロックを追加したら、各クラスの出口から別々のLLMブロックに矢印を繋いでみましょう。',
      4: 'ナレッジ機能はサイドバーの「ナレッジ」から作成します。ドキュメントをアップロードしてから知識検索ブロックで参照します。',
      5: '並列処理は同じブロックから複数の矢印を出します。変数集約器で結果をまとめることを忘れずに。',
    };
    return hints[phaseId] || 'もう少し詳しく教えてもらえますか？どの操作でつまずいているか教えていただければ、より具体的なアドバイスができます。';
  }
  return `なるほど！Phase ${phaseId}のLevel ${levelId}について教えてくれてありがとうございます。\n\nDifyは実際に手を動かすことが上達の近道です。もし詰まったら具体的に「〇〇の操作で困っている」と教えてください。一緒に解決しましょう！\n\n課題が完了したら「次のページへ」を押して進みましょう。`;
}
