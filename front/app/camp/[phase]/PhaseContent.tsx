'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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

type Props = { phase: Phase; initialLevel?: number };

export function PhaseContent({ phase, initialLevel = 1 }: Props) {
  const { user, isLoading } = useAuth();
  const { progress, isProgressLoading, isPhaseUnlocked, isLevelUnlocked, isLevelCleared, isPageCleared, isPageUnlocked, getPhaseProgress, getLevelProgress, completePage, completeLevel } = useProgress();
  const router = useRouter();

  const [currentLevelId, setCurrentLevelId] = useState(initialLevel);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // ページ/レベル切替時にスクロールトップ
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPageIndex, currentLevelId]);

  // クイズ/アウトプット用状態
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [answered, setAnswered] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [showHint2, setShowHint2] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isCleared, setIsCleared] = useState(false);
  const [gradingPending, setGradingPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // 修了フィードバック用（最終ページ専用）
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.replace('/');
  }, [user, isLoading, router]);

  // ロックされたフェーズへのアクセスはキャンプページへリダイレクト
  // isProgressLoading が false になってから判定（非同期ロード中の誤リダイレクト防止）
  useEffect(() => {
    if (!isLoading && user && !isProgressLoading && !isPhaseUnlocked(phase.id)) {
      router.replace('/camp');
    }
  }, [isLoading, isProgressLoading, user, phase.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentLevel = phase.levels.find((l) => l.id === currentLevelId) ?? phase.levels[0];
  const currentPage = currentLevel.pages[currentPageIndex];
  const totalPages = currentLevel.pages.length;
  // Phase 5 / Level id=2 / Page id=6 が修了フィードバックページ
  const isFinalGraduationPage =
    phase.id === 5 && currentLevelId === 2 && currentPage.id === 6;

  // 次レベルをIDではなく配列インデックスで特定（レベルID非連続・途中挿入でも正確）
  const currentLevelIndex = phase.levels.findIndex((l) => l.id === currentLevelId);
  const nextLevel =
    currentLevelIndex >= 0 && currentLevelIndex < phase.levels.length - 1
      ? phase.levels[currentLevelIndex + 1]
      : null;

  // ページ切替・レベル切替・リロードのたびに選択肢をシャッフルしてマンネリ防止
  const shuffledOptions = useMemo(() => {
    if (currentPage.type !== 'output') return [];
    const out = currentPage as OutputPage;
    if (!out.options) return [];
    return [...out.options].sort(() => Math.random() - 0.5);
  // currentPage オブジェクト参照ではなくインデックスを依存にして必ず再シャッフル
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageIndex, currentLevelId]);
  const levelProgress = getLevelProgress(phase.id, currentLevelId);

  function scrollTop() {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetPageState() {
    setSelectedOption(null);
    setSelectedOptions([]);
    setAnswered(false);
    setShortAnswer('');
    setChatInput('');
    setChatMessages([]);
    setShowHint(false);
    setShowHint2(false);
    setIsCleared(false);
    setGradingPending(false);
    setSaveError(false);
    setFeedbackRating(null);
    setFeedbackComment('');
    setFeedbackSubmitted(false);
    setFeedbackSubmitting(false);
  }

  function goToLevel(levelId: number) {
    if (!isLevelUnlocked(phase.id, levelId)) return;
    setCurrentLevelId(levelId);
    setCurrentPageIndex(0);
    resetPageState();
    scrollTop();
  }

  function goToPage(index: number) {
    const page = currentLevel.pages[index];
    if (!isPageUnlocked(phase.id, currentLevelId, page.id)) return;
    setCurrentPageIndex(index);
    resetPageState();
    scrollTop();
  }

  async function handleNext() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveError(false);
    try {
      await completePage(phase.id, currentLevelId, currentPage.id);
      if (currentPageIndex < totalPages - 1) {
        // goToPage は isPageUnlocked を参照するが、completePage 直後は
        // setProgress の再レンダリングが完了していないため古いstateを見てしまう。
        // ここでは明示的に「次へ進む」操作なのでロックチェックを省いて直接遷移する。
        setCurrentPageIndex(currentPageIndex + 1);
        resetPageState();
        scrollTop();
      } else {
        await completeLevel(phase.id, currentLevelId);
      }
    } catch {
      setSaveError(true);
    } finally {
      setIsSaving(false);
    }
  }

  function handleMultipleChoice(idx: number) {
    if (answered) return;
    setSelectedOption(idx);
    setAnswered(true);
  }

  function handleMultiSelectToggle(idx: number) {
    if (answered) return;
    setSelectedOptions((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx],
    );
  }

  function handleMultiSelectSubmit() {
    if (answered || selectedOptions.length === 0) return;
    setAnswered(true);
  }

  function handleShortAnswerSubmit() {
    if (!shortAnswer.trim()) return;
    setAnswered(true);
  }

  async function handleChatSend() {
    if (!chatInput.trim() || isTyping) return;
    const text = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text }]);
    setIsTyping(true);
    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          phase: phase.id,
          levelId: currentLevelId,
          pageId: currentPage.id,
          interactionType: isFinalGraduationPage ? 'graduation_chat' : 'question',
        }),
      });
      const data = await res.json();
      const rawReply = data.reply || 'メンターから返答がありませんでした。';
      // DifyがJSON形式で返した場合はfeedback_messageのみ表示
      let displayText = rawReply;
      try {
        const parsed = JSON.parse(rawReply);
        if (parsed.feedback_message) displayText = parsed.feedback_message;
        // 質問モードで採点結果が返った場合はクリア判定も処理する
        if (parsed.is_cleared === true) {
          setIsCleared(true);
          displayText = `✅ 合格です！\n${parsed.feedback_message ?? ''}`;
        }
      } catch { /* JSON以外はそのまま */ }
      setChatMessages((prev) => [...prev, { role: 'assistant', text: displayText }]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'メンターへの接続に失敗しました。もう一度お試しください。' },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  async function handleSubmitAnswer() {
    if (gradingPending || isCleared) return;

    const lastUserMsg = [...chatMessages].reverse().find((m) => m.role === 'user')?.text;
    if (!lastUserMsg) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'まずメンターに「〇〇しました」と達成内容を伝えてから採点を依頼してください。' },
      ]);
      return;
    }

    setGradingPending(true);
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: `【採点依頼】${lastUserMsg}` },
    ]);

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: lastUserMsg,
          phase: phase.id,
          levelId: currentLevelId,
          interactionType: 'answer',
        }),
      });
      const data = await res.json();
      const reply: string = data.reply ?? '';

      try {
        const parsed = JSON.parse(reply);
        if (parsed.is_cleared === true) {
          setIsCleared(true);
          setChatMessages((prev) => [
            ...prev,
            { role: 'assistant', text: `✅ 合格です！\n${parsed.feedback_message ?? ''}` },
          ]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              text: parsed.feedback_message ?? 'もう少し！内容を補足してから再提出してください。',
            },
          ]);
        }
      } catch {
        // JSON以外（Dify未設定等）はそのまま表示
        setChatMessages((prev) => [...prev, { role: 'assistant', text: reply || '採点結果を取得できませんでした。' }]);
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: '採点サービスへの接続に失敗しました。もう一度お試しください。' },
      ]);
    } finally {
      setGradingPending(false);
    }
  }

  async function handleFeedbackSubmit() {
    if (feedbackRating === null || feedbackSubmitting) return;
    setFeedbackSubmitting(true);
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: feedbackRating,
          comment: feedbackComment.trim() || null,
          phaseId: phase.id,
          levelId: currentLevelId,
          pageId: currentPage.id,
        }),
      });
    } catch {
      // フィードバック保存失敗でも修了処理は続行
    } finally {
      setFeedbackSubmitting(false);
    }
    setFeedbackSubmitted(true);
    await handleNext();
  }

  const canProceed: boolean = (() => {
    if (currentPage.type === 'input') return true;
    const out = currentPage as OutputPage;
    if (out.format === 'multiple-choice') return answered;
    if (out.format === 'multi-select') return answered;
    if (out.format === 'short-answer') return answered;
    if (out.format === 'chat') {
      if (isFinalGraduationPage) return feedbackSubmitted;
      return isCleared; // AI採点でis_cleared: trueになるまで進めない
    }
    return false;
  })();

  if (isLoading || !user || isProgressLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const phaseProgress = getPhaseProgress(phase.id);

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
                const lUnlocked = isLevelUnlocked(phase.id, level.id);
                const lActive = level.id === currentLevelId;
                const lPct = getLevelProgress(phase.id, level.id);

                return (
                  <div key={level.id}>
                    <button
                      onClick={() => goToLevel(level.id)}
                      disabled={!lUnlocked}
                      className={`w-full rounded-xl p-3 text-left transition-colors ${
                        !lUnlocked
                          ? 'border border-transparent opacity-40 cursor-not-allowed'
                          : lActive
                          ? `${phase.borderColor} border bg-slate-800`
                          : 'border border-transparent hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {!lUnlocked && <span className="text-xs">🔒</span>}
                        <span className={`text-xs font-bold ${lActive ? phase.textColor : 'text-slate-500'}`}>
                          Level {level.id}
                        </span>
                        {lCleared && <span className="ml-auto text-xs">✅</span>}
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{level.title}</p>
                      {lUnlocked && (
                        <div className="mt-2">
                          <Progress value={lPct} className="h-0.5 bg-slate-700" />
                        </div>
                      )}
                    </button>

                    {lActive && (
                      <div className="ml-2 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                        {level.pages.map((page, idx) => {
                          const pCleared = isPageCleared(phase.id, level.id, page.id);
                          const pActive = idx === currentPageIndex;
                          const pUnlocked = isPageUnlocked(phase.id, level.id, page.id);
                          return (
                            <button
                              key={page.id}
                              onClick={() => goToPage(idx)}
                              disabled={!pUnlocked}
                              className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors ${
                                !pUnlocked
                                  ? 'text-slate-700 cursor-not-allowed'
                                  : pActive
                                  ? `${phase.textColor} bg-slate-800 font-medium`
                                  : pCleared
                                  ? 'text-slate-400 hover:bg-slate-800'
                                  : 'text-slate-600 hover:bg-slate-800/50'
                              }`}
                            >
                              <span>
                                {!pUnlocked ? '🔒' : pCleared ? '✅' : page.type === 'input' ? '📖' : '✏️'}
                              </span>
                              <span className="line-clamp-1">
                                P{idx + 1}. {page.title}
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
            {phase.levels.map((level) => {
              const lUnlocked = isLevelUnlocked(phase.id, level.id);
              return (
                <button
                  key={level.id}
                  onClick={() => goToLevel(level.id)}
                  disabled={!lUnlocked}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                    !lUnlocked
                      ? 'border-white/5 text-slate-700 cursor-not-allowed'
                      : level.id === currentLevelId
                      ? `${phase.borderColor} ${phase.textColor} bg-slate-800`
                      : 'border-white/10 text-slate-500'
                  }`}
                >
                  {!lUnlocked ? '🔒 ' : isLevelCleared(phase.id, level.id) ? '✅ ' : ''}Lv.{level.id}
                </button>
              );
            })}
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
              <span>ページ {currentPageIndex + 1}</span>
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
                  const pUnlocked = isPageUnlocked(phase.id, currentLevelId, page.id);
                  return (
                    <button
                      key={page.id}
                      onClick={() => goToPage(idx)}
                      disabled={!pUnlocked}
                      className={`shrink-0 flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        !pUnlocked
                          ? 'border-white/5 text-slate-700 cursor-not-allowed'
                          : pActive
                          ? `${phase.borderColor} ${phase.textColor} bg-slate-800 font-medium`
                          : pCleared
                          ? 'border-white/10 text-slate-400 hover:bg-slate-800'
                          : 'border-white/5 text-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      {!pUnlocked ? '🔒 ' : pCleared && !pActive ? '✅ ' : page.type === 'input' ? '📖 ' : '✏️ '}
                      ページ{idx + 1}
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
                  <span className="text-xs text-slate-500">ページ {currentPageIndex + 1} / {totalPages}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-white">{currentPage.title}</h3>
              </div>

              <div className="p-6">
                {currentPage.type === 'input' ? (
                  <InputPageContent page={currentPage as InputPage} phaseColor={phase.textColor} />
                ) : (
                  <OutputPageContent
                    page={currentPage as OutputPage}
                    shuffledOptions={shuffledOptions}
                    phaseColor={phase.textColor}
                    phaseBorderColor={phase.borderColor}
                    selectedOption={selectedOption}
                    selectedOptions={selectedOptions}
                    answered={answered}
                    shortAnswer={shortAnswer}
                    chatInput={chatInput}
                    chatMessages={chatMessages}
                    showHint={showHint}
                    showHint2={showHint2}
                    isTyping={isTyping}
                    isCleared={isCleared}
                    gradingPending={gradingPending}
                    onSelectOption={handleMultipleChoice}
                    onToggleMultiSelect={handleMultiSelectToggle}
                    onSubmitMultiSelect={handleMultiSelectSubmit}
                    onShortAnswerChange={setShortAnswer}
                    onShortAnswerSubmit={handleShortAnswerSubmit}
                    onChatInputChange={setChatInput}
                    onChatSend={handleChatSend}
                    onSubmitAnswer={handleSubmitAnswer}
                    onToggleHint={() => setShowHint((v) => !v)}
                    onToggleHint2={() => setShowHint2((v) => !v)}
                    isFinalGraduationPage={isFinalGraduationPage}
                    feedbackRating={feedbackRating}
                    feedbackComment={feedbackComment}
                    feedbackSubmitted={feedbackSubmitted}
                    feedbackSubmitting={feedbackSubmitting}
                    onFeedbackRatingChange={setFeedbackRating}
                    onFeedbackCommentChange={setFeedbackComment}
                    onFeedbackSubmit={handleFeedbackSubmit}
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
                    {saveError && (
                      <span className="text-xs text-rose-400">保存に失敗しました。もう一度お試しください。</span>
                    )}
                    {isPageCleared(phase.id, currentLevelId, currentPage.id) && !saveError && (
                      <span className="text-xs text-emerald-400">✅ クリア済み</span>
                    )}

                    {currentPageIndex < totalPages - 1 ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed || isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        {isSaving ? '保存中...' : '次のページへ →'}
                      </Button>
                    ) : !isLevelCleared(phase.id, currentLevelId) ? (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed || isSaving}
                        className="bg-indigo-600 hover:bg-indigo-500"
                      >
                        {isSaving ? '保存中...' : 'レベルをクリア 🎉'}
                      </Button>
                    ) : nextLevel ? (
                      <Button
                        onClick={() => goToLevel(nextLevel.id)}
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
  shuffledOptions: { label: string; isCorrect: boolean }[];
  phaseColor: string;
  phaseBorderColor: string;
  selectedOption: number | null;
  selectedOptions: number[];
  answered: boolean;
  shortAnswer: string;
  chatInput: string;
  chatMessages: { role: 'user' | 'assistant'; text: string }[];
  showHint: boolean;
  showHint2: boolean;
  isTyping: boolean;
  isCleared: boolean;
  gradingPending: boolean;
  onSelectOption: (idx: number) => void;
  onToggleMultiSelect: (idx: number) => void;
  onSubmitMultiSelect: () => void;
  onShortAnswerChange: (val: string) => void;
  onShortAnswerSubmit: () => void;
  onChatInputChange: (val: string) => void;
  onChatSend: () => void;
  onSubmitAnswer: () => void;
  onToggleHint: () => void;
  onToggleHint2: () => void;
  // 最終ページ専用
  isFinalGraduationPage: boolean;
  feedbackRating: number | null;
  feedbackComment: string;
  feedbackSubmitted: boolean;
  feedbackSubmitting: boolean;
  onFeedbackRatingChange: (n: number) => void;
  onFeedbackCommentChange: (s: string) => void;
  onFeedbackSubmit: () => void;
};

function OutputPageContent({
  page,
  shuffledOptions,
  selectedOption,
  selectedOptions,
  answered,
  shortAnswer,
  chatInput,
  chatMessages,
  showHint,
  showHint2,
  isTyping,
  isCleared,
  gradingPending,
  onSelectOption,
  onToggleMultiSelect,
  onSubmitMultiSelect,
  onShortAnswerChange,
  onShortAnswerSubmit,
  onChatInputChange,
  onChatSend,
  onSubmitAnswer,
  onToggleHint,
  onToggleHint2,
  isFinalGraduationPage,
  feedbackRating,
  feedbackComment,
  feedbackSubmitted,
  feedbackSubmitting,
  onFeedbackRatingChange,
  onFeedbackCommentChange,
  onFeedbackSubmit,
}: OutputProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatFocused, setChatFocused] = useState(false);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  return (
    <div>
      <div className="mb-6 rounded-xl border border-white/10 bg-slate-800/50 p-5">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{page.question}</p>
      </div>

      {/* 選択肢（shuffledOptions でランダム順表示） */}
      {page.format === 'multiple-choice' && shuffledOptions.length > 0 && (
        <div className="space-y-2.5">
          {shuffledOptions.map((opt, idx) => {
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
                shuffledOptions[selectedOption ?? 0]?.isCorrect
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
              }`}
            >
              {shuffledOptions[selectedOption ?? 0]?.isCorrect
                ? '✅ 正解です！次のページへ進みましょう。'
                : `❌ 不正解。正解は「${shuffledOptions.find((o) => o.isCorrect)?.label}」です。もう一度復習してから次へ進みましょう。`}
            </div>
          )}
          {answered && page.explanation && (
            <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200 whitespace-pre-line">
              <p className="mb-2 font-semibold text-sky-300">📖 解説</p>
              {page.explanation}
            </div>
          )}
        </div>
      )}

      {/* 複数選択 */}
      {page.format === 'multi-select' && shuffledOptions.length > 0 && (
        <div className="space-y-2.5">
          {!page.question.includes('すべて') && !page.question.includes('全て') && (
            <p className="text-xs text-slate-400">
              正しいものを {shuffledOptions.filter((o) => o.isCorrect).length} つ選んでください
            </p>
          )}
          {shuffledOptions.map((opt, idx) => {
            const isSelected = selectedOptions.includes(idx);
            let cls = 'w-full rounded-xl border p-4 text-left text-sm transition-all flex items-start gap-3 ';
            if (!answered) {
              cls += isSelected
                ? 'border-indigo-500 bg-indigo-500/20 text-white cursor-pointer'
                : 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/30 hover:bg-slate-700 cursor-pointer';
            } else if (isSelected && opt.isCorrect) {
              cls += 'border-emerald-500 bg-emerald-500/20 text-emerald-300 cursor-default';
            } else if (isSelected && !opt.isCorrect) {
              cls += 'border-rose-500 bg-rose-500/20 text-rose-300 cursor-default';
            } else if (!isSelected && opt.isCorrect) {
              cls += 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400/70 cursor-default';
            } else {
              cls += 'border-white/5 bg-slate-800/30 text-slate-600 cursor-default';
            }
            return (
              <button
                key={idx}
                className={cls}
                onClick={() => !answered && onToggleMultiSelect(idx)}
                disabled={answered}
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-[10px] font-bold text-white ${
                    isSelected && !answered
                      ? 'border-indigo-400 bg-indigo-500'
                      : isSelected && answered && opt.isCorrect
                      ? 'border-emerald-400 bg-emerald-500'
                      : isSelected && answered && !opt.isCorrect
                      ? 'border-rose-400 bg-rose-500'
                      : 'border-slate-500 bg-transparent'
                  }`}
                >
                  {isSelected ? '✓' : ''}
                </span>
                {opt.label}
              </button>
            );
          })}
          {!answered && (
            <Button
              onClick={onSubmitMultiSelect}
              disabled={selectedOptions.length === 0}
              className="mt-2 w-full bg-indigo-600 hover:bg-indigo-500"
            >
              回答する{selectedOptions.length > 0 ? `（${selectedOptions.length}個選択中）` : ''}
            </Button>
          )}
          {answered && (() => {
            const correctCount = shuffledOptions.filter((o) => o.isCorrect).length;
            const correctlySelected = selectedOptions.filter((i) => shuffledOptions[i]?.isCorrect).length;
            const wronglySelected = selectedOptions.filter((i) => !shuffledOptions[i]?.isCorrect).length;
            const isAllCorrect = correctlySelected === correctCount && wronglySelected === 0;
            const isAllType = page.question.includes('すべて') || page.question.includes('全て');
            return (
              <>
                <div
                  className={`mt-2 rounded-xl border p-3 text-sm ${
                    isAllCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {isAllCorrect
                    ? isAllType
                      ? '✅ 正解！すべて正しく選べましたね。次のページへ進みましょう。'
                      : `✅ 正解！${correctCount}つとも選べましたね。次のページへ進みましょう。`
                    : isAllType
                      ? '❌ 不正解。緑でハイライトされた選択肢がすべて正解です。次のページへ進む前に確認しておきましょう。'
                      : `❌ 不正解。緑でハイライトされた${correctCount}つが正解です。次のページへ進む前に確認しておきましょう。`}
                </div>
                {page.explanation && (
                  <div className="mt-3 rounded-xl border border-sky-500/30 bg-sky-500/10 p-4 text-sm text-sky-200 whitespace-pre-line">
                    <p className="mb-2 font-semibold text-sky-300">📖 解説</p>
                    {page.explanation}
                  </div>
                )}
              </>
            );
          })()}
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
            className="w-full resize-y rounded-xl border border-white/10 bg-slate-800 p-4 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
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
          {!isCleared && (
            <div className="flex gap-2 items-end">
              {/* フローティングラベル付きテキストエリア */}
              <div className="relative flex-1">
                <textarea
                  value={chatInput}
                  onChange={(e) => onChatInputChange(e.target.value)}
                  onFocus={() => setChatFocused(true)}
                  onBlur={() => setChatFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isTyping && !gradingPending) {
                      e.preventDefault();
                      onChatSend();
                    }
                  }}
                  disabled={isTyping || gradingPending}
                  rows={2}
                  className="w-full resize-y rounded-xl border border-white/10 bg-slate-800 px-3 pb-2.5 pt-5 text-sm text-white outline-none focus:border-indigo-500 disabled:opacity-50 min-h-[4rem] max-h-48"
                />
                <span
                  className={`pointer-events-none absolute left-3 select-none transition-all duration-200 ease-out ${
                    chatFocused || chatInput
                      ? '-top-2 bg-slate-900 px-1 text-[10px] text-indigo-400 rounded'
                      : 'top-3 text-xs text-slate-500'
                  }`}
                >
                  メンターに話しかける... (Enterで送信 / Shift+Enterで改行)
                </span>
              </div>
              <Button
                onClick={onChatSend}
                disabled={!chatInput.trim() || isTyping || gradingPending}
                className="bg-indigo-600 hover:bg-indigo-500 shrink-0"
              >
                送信
              </Button>
            </div>
          )}

          {/* 採点ボタン: 最終ページ以外・会話が始まっていて・まだ合格していない場合に表示 */}
          {!isFinalGraduationPage && chatMessages.length > 0 && !isCleared && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="mb-2 text-xs text-slate-400">
                課題を完了したら採点を依頼してください（最後に送ったメッセージが採点対象になります）
              </p>
              <p className="mb-2 text-xs text-slate-500">
                採点されない場合は、もう一度内容を送ってから下のボタンを押してみてください。
              </p>
              <Button
                onClick={onSubmitAnswer}
                disabled={gradingPending || isTyping}
                className="w-full bg-emerald-600 text-sm hover:bg-emerald-500 disabled:opacity-60"
              >
                {gradingPending ? '採点中...' : '✅ 採点してもらう'}
              </Button>
            </div>
          )}

          {/* 合格後メッセージ（最終ページ以外） */}
          {!isFinalGraduationPage && isCleared && (
            <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
              ✅ 合格！下の「レベルをクリア」ボタンで次へ進みましょう。
            </div>
          )}

          {/* 修了フィードバックウィジェット（最終ページ専用） */}
          {isFinalGraduationPage && !feedbackSubmitted && (
            <div className="mt-5 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
              <p className="mb-1 text-sm font-semibold text-violet-300">
                コース修了アンケート（必須）
              </p>
              <p className="mb-4 text-xs text-slate-400">
                以下のアンケートを送信するとコースが修了します。AIメンターとの会話もお楽しみください。
              </p>

              {/* 星評価 */}
              <p className="mb-2 text-xs text-slate-300">満足度を選んでください</p>
              <div className="mb-4 flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => onFeedbackRatingChange(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      feedbackRating !== null && star <= feedbackRating
                        ? 'text-yellow-400'
                        : 'text-slate-600'
                    }`}
                    aria-label={`${star}点`}
                  >
                    ★
                  </button>
                ))}
                {feedbackRating && (
                  <span className="ml-2 self-center text-xs text-slate-400">
                    {['', '不満', 'やや不満', '普通', 'やや満足', '大満足'][feedbackRating]}
                  </span>
                )}
              </div>

              {/* コメント欄 */}
              <p className="mb-1 text-xs text-slate-300">ご意見・感想（任意）</p>
              <textarea
                value={feedbackComment}
                onChange={(e) => onFeedbackCommentChange(e.target.value)}
                placeholder="改善点や感想があればお聞かせください..."
                rows={3}
                className="mb-3 w-full resize-y rounded-xl border border-white/10 bg-slate-800 p-3 text-sm text-white placeholder-slate-600 outline-none focus:border-violet-500"
              />

              <Button
                onClick={onFeedbackSubmit}
                disabled={feedbackRating === null || feedbackSubmitting}
                className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50"
              >
                {feedbackSubmitting ? '送信中...' : 'フィードバックを送信してコースを修了する 🎊'}
              </Button>
            </div>
          )}

          {/* 修了後メッセージ */}
          {isFinalGraduationPage && feedbackSubmitted && (
            <div className="mt-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-center text-sm text-yellow-200">
              🎊 フィードバックを送信しました！お疲れ様でした！
            </div>
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

      {/* ヒント2（ほぼ答え）：chatPlaceholderから移植した例文 */}
      {page.hint2 && (
        <div className="mt-3">
          <button
            onClick={onToggleHint2}
            className="text-xs text-orange-500/70 underline hover:text-orange-400"
          >
            {showHint2 ? 'ヒント2を隠す ▲' : 'ヒント2（困ったら）を見る ▼'}
          </button>
          {showHint2 && (
            <div className="mt-2 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 text-sm text-orange-200">
              📝 <span className="font-semibold">記入例：</span>{page.hint2}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

