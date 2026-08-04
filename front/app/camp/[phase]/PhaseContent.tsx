'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { Phase, InputLevel, OutputLevel } from '@/lib/phases-data';
import { PHASES } from '@/lib/phases-data';
import { Navbar } from '@/components/Navbar';
import { ChatbotButton } from '@/components/ChatbotButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

type Props = { phase: Phase };

export function PhaseContent({ phase }: Props) {
  const { user, isLoading } = useAuth();
  const { progress, isPhaseUnlocked, isLevelCleared, completeLevel, completePhase } = useProgress();
  const router = useRouter();

  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [shortAnswer, setShortAnswer] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const savedLevel = (progress.phases[phase.id]?.currentLevel ?? 1) - 1;
    setCurrentLevelIndex(Math.max(0, Math.min(savedLevel, phase.levels.length - 1)));
  }, [phase.id, phase.levels.length, progress.phases]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isPhaseUnlocked(phase.id)) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <p className="mb-4 text-6xl">🔒</p>
          <h2 className="text-xl font-bold text-white">フェーズがロックされています</h2>
          <p className="mt-2 text-slate-400">前のフェーズをクリアすると解放されます。</p>
          <Link href="/camp">
            <Button className="mt-6 bg-indigo-600 hover:bg-indigo-500">キャンプに戻る</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentLevel = phase.levels[currentLevelIndex];
  const levelProgress = Math.round(((currentLevelIndex) / phase.levels.length) * 100);
  const isLastLevel = currentLevelIndex === phase.levels.length - 1;
  const isCurrentLevelCleared = isLevelCleared(phase.id, currentLevel.id);

  function goToLevel(index: number) {
    setCurrentLevelIndex(index);
    setSelectedOption(null);
    setAnswered(false);
    setShortAnswer('');
    setShowHint(false);
    setChatInput('');
  }

  function handleNextLevel() {
    completeLevel(phase.id, currentLevel.id);
    if (isLastLevel) {
      completePhase(phase.id);
      setPhaseComplete(true);
    } else {
      goToLevel(currentLevelIndex + 1);
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
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setTimeout(() => {
      const reply = generateMockChatReply(userMsg, phase.id, currentLevel.id);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 800);
  }

  if (phaseComplete) {
    const nextPhase = PHASES.find((p) => p.id === phase.id + 1);
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex flex-col items-center justify-center py-24 text-center px-4">
          <p className="mb-4 text-6xl">🎉</p>
          <h2 className="text-2xl font-bold text-white">Phase {phase.id} クリア！</h2>
          <p className="mt-2 text-slate-400 max-w-md">
            {phase.title}を完了しました。{phase.icon} おめでとうございます！
          </p>
          <div className="mt-8 flex gap-3">
            {nextPhase ? (
              <Link href={`/camp/${nextPhase.id}`}>
                <Button className="bg-indigo-600 hover:bg-indigo-500">
                  Phase {nextPhase.id} へ進む →
                </Button>
              </Link>
            ) : (
              <p className="text-slate-300 font-semibold">全フェーズ制覇！素晴らしい！</p>
            )}
            <Link href="/home">
              <Button variant="outline" className="border-white/10 text-slate-300 hover:bg-white/5">
                ホームへ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <div className="mx-auto flex max-w-6xl gap-0 px-0 lg:px-4 py-0 lg:py-8 lg:gap-6">
        <aside className="hidden lg:flex w-64 shrink-0 flex-col">
          <div className={`rounded-2xl border ${phase.borderColor} bg-slate-900 p-4 sticky top-20`}>
            <p className="mb-1 text-xs text-slate-500">{phase.subtitle}</p>
            <h2 className={`text-sm font-bold ${phase.textColor}`}>{phase.title}</h2>
            <div className="mt-3 mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>進捗</span>
                <span>{levelProgress}%</span>
              </div>
              <Progress value={levelProgress} className="h-1.5 bg-slate-700" />
            </div>

            <div className="space-y-1">
              {phase.levels.map((level, idx) => {
                const cleared = isLevelCleared(phase.id, level.id);
                const isCurr = idx === currentLevelIndex;
                return (
                  <button
                    key={level.id}
                    onClick={() => goToLevel(idx)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isCurr
                        ? `${phase.textColor} bg-slate-800 font-medium`
                        : cleared
                        ? 'text-slate-400 hover:bg-slate-800'
                        : 'text-slate-600 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="mr-2">{cleared ? '✅' : level.type === 'input' ? '📖' : '✏️'}</span>
                    {level.title}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-slate-500 mb-2">ゴール</p>
              <p className="text-xs text-slate-400">{phase.goal}</p>
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex items-center gap-2 px-4 lg:px-0">
            <Link href="/camp" className="text-xs text-slate-500 hover:text-slate-300">
              ← キャンプ
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs text-slate-400">Phase {phase.id}</span>
            <span className="text-slate-700">/</span>
            <span className="text-xs text-slate-300">Lv.{currentLevel.id}</span>
          </div>

          <div className="lg:hidden mb-4 px-4 flex gap-2 overflow-x-auto pb-2">
            {phase.levels.map((level, idx) => {
              const cleared = isLevelCleared(phase.id, level.id);
              return (
                <button
                  key={level.id}
                  onClick={() => goToLevel(idx)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs border transition-colors ${
                    idx === currentLevelIndex
                      ? `${phase.borderColor} ${phase.textColor} bg-slate-800`
                      : cleared
                      ? 'border-white/10 text-slate-400'
                      : 'border-white/5 text-slate-600'
                  }`}
                >
                  {cleared ? '✅' : level.type === 'input' ? '📖' : '✏️'} Lv.{level.id}
                </button>
              );
            })}
          </div>

          <div className="px-4 lg:px-0">
            <div className={`rounded-2xl border ${phase.borderColor} bg-slate-900 overflow-hidden`}>
              <div className={`border-b ${phase.borderColor} bg-gradient-to-r ${phase.bgGradient} px-6 py-4`}>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs ${phase.badgeBg}`}>
                    {currentLevel.type === 'input' ? '📖 インプット' : '✏️ アウトプット'}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    Lv.{currentLevel.id} / {phase.levels.length}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{currentLevel.title}</h2>
                <p className="text-sm text-slate-400">{currentLevel.description}</p>
              </div>

              <div className="p-6">
                {currentLevel.type === 'input' ? (
                  <InputSection level={currentLevel as InputLevel} />
                ) : (
                  <OutputSection
                    level={currentLevel as OutputLevel}
                    selectedOption={selectedOption}
                    answered={answered}
                    shortAnswer={shortAnswer}
                    chatInput={chatInput}
                    chatMessages={chatMessages}
                    showHint={showHint}
                    onSelectOption={handleMultipleChoice}
                    onShortAnswerChange={setShortAnswer}
                    onShortAnswerSubmit={handleShortAnswerSubmit}
                    onChatInputChange={setChatInput}
                    onChatSend={handleChatSend}
                    onToggleHint={() => setShowHint(!showHint)}
                  />
                )}

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => currentLevelIndex > 0 && goToLevel(currentLevelIndex - 1)}
                    disabled={currentLevelIndex === 0}
                    className="text-slate-400 hover:text-white"
                  >
                    ← 前へ
                  </Button>

                  <div className="flex items-center gap-3">
                    {isCurrentLevelCleared ? (
                      <span className="text-xs text-emerald-400">✅ クリア済み</span>
                    ) : null}

                    <Button
                      onClick={handleNextLevel}
                      disabled={
                        currentLevel.type === 'output' &&
                        !answered &&
                        chatMessages.length === 0
                      }
                      className="bg-indigo-600 hover:bg-indigo-500"
                    >
                      {isLastLevel ? 'フェーズクリア！' : '次へ →'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ChatbotButton />
    </div>
  );
}

function InputSection({ level }: { level: InputLevel }) {
  return (
    <div>
      <div className="prose prose-invert prose-sm max-w-none">
        <ReactMarkdown
          components={{
            h2: ({ children }) => (
              <h2 className="mt-6 mb-3 text-lg font-bold text-white border-b border-white/10 pb-2">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="mt-4 mb-2 text-base font-semibold text-slate-200">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-3 text-slate-300 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="mb-3 ml-4 space-y-1 list-disc text-slate-300">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-3 ml-4 space-y-1 list-decimal text-slate-300">{children}</ol>
            ),
            li: ({ children }) => <li className="text-slate-300">{children}</li>,
            code: ({ children }) => (
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs font-mono text-indigo-300">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="my-3 overflow-x-auto rounded-xl bg-slate-800 p-4 text-sm font-mono text-slate-300">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="my-3 overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b border-white/10 bg-slate-800 px-4 py-2 text-left text-slate-300">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-white/5 px-4 py-2 text-slate-400">{children}</td>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-white">{children}</strong>
            ),
          }}
        >
          {level.content}
        </ReactMarkdown>
      </div>

      {level.keyPoints.length > 0 && (
        <div className="mt-6 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4">
          <p className="mb-2 text-sm font-semibold text-indigo-400">💡 このレベルのポイント</p>
          <ul className="space-y-1">
            {level.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="mt-0.5 text-indigo-400">✓</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type OutputProps = {
  level: OutputLevel;
  selectedOption: number | null;
  answered: boolean;
  shortAnswer: string;
  chatInput: string;
  chatMessages: { role: 'user' | 'assistant'; text: string }[];
  showHint: boolean;
  onSelectOption: (idx: number) => void;
  onShortAnswerChange: (val: string) => void;
  onShortAnswerSubmit: () => void;
  onChatInputChange: (val: string) => void;
  onChatSend: () => void;
  onToggleHint: () => void;
};

function OutputSection({
  level,
  selectedOption,
  answered,
  shortAnswer,
  chatInput,
  chatMessages,
  showHint,
  onSelectOption,
  onShortAnswerChange,
  onShortAnswerSubmit,
  onChatInputChange,
  onChatSend,
  onToggleHint,
}: OutputProps) {
  return (
    <div>
      <div className="mb-6 rounded-xl border border-white/10 bg-slate-800/50 p-4">
        <p className="text-sm font-medium text-slate-200 whitespace-pre-wrap">{level.question}</p>
      </div>

      {level.format === 'multiple-choice' && level.options && (
        <div className="space-y-2">
          {level.options.map((option, idx) => {
            let cls =
              'w-full rounded-xl border p-3 text-left text-sm transition-all cursor-pointer ';
            if (!answered) {
              cls += 'border-white/10 bg-slate-800 text-slate-300 hover:border-white/30 hover:bg-slate-700';
            } else if (selectedOption === idx) {
              cls += option.isCorrect
                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                : 'border-rose-500 bg-rose-500/20 text-rose-300';
            } else if (option.isCorrect) {
              cls += 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400';
            } else {
              cls += 'border-white/5 bg-slate-800/50 text-slate-500';
            }
            return (
              <button key={idx} className={cls} onClick={() => onSelectOption(idx)}>
                <span className="mr-2 font-mono">{String.fromCharCode(65 + idx)}.</span>
                {option.label}
              </button>
            );
          })}
          {answered && (
            <div
              className={`mt-3 rounded-xl p-3 text-sm ${
                level.options[selectedOption ?? 0]?.isCorrect
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {level.options[selectedOption ?? 0]?.isCorrect
                ? '✅ 正解です！次のレベルに進みましょう。'
                : '❌ 不正解です。正解は「' +
                  level.options.find((o) => o.isCorrect)?.label +
                  '」です。'}
            </div>
          )}
        </div>
      )}

      {level.format === 'short-answer' && (
        <div>
          <textarea
            value={shortAnswer}
            onChange={(e) => onShortAnswerChange(e.target.value)}
            disabled={answered}
            placeholder="ここに回答を入力してください..."
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-slate-800 p-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 disabled:opacity-50"
          />
          {!answered && (
            <Button
              onClick={onShortAnswerSubmit}
              disabled={!shortAnswer.trim()}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500"
            >
              回答する
            </Button>
          )}
          {answered && (
            <div className="mt-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-sm text-slate-300">
              ✅ 回答しました！AIメンターのフィードバックを参考に、次のレベルへ進みましょう。
            </div>
          )}
        </div>
      )}

      {level.format === 'chat' && (
        <div>
          <div className="mb-3 rounded-xl border border-white/10 bg-slate-800 h-48 overflow-y-auto p-3 space-y-2">
            {chatMessages.length === 0 && (
              <p className="text-xs text-slate-600 text-center mt-8">
                AIメンターに報告・質問してみましょう
              </p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onChatSend()}
              placeholder="AIメンターに話しかける..."
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
            />
            <Button
              onClick={onChatSend}
              disabled={!chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              送信
            </Button>
          </div>
          {chatMessages.length > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              AIメンターに報告できたら「次へ」を押してクリアしましょう。
            </p>
          )}
        </div>
      )}

      {level.hint && (
        <div className="mt-4">
          <button
            onClick={onToggleHint}
            className="text-xs text-slate-500 hover:text-slate-300 underline"
          >
            {showHint ? 'ヒントを隠す' : 'ヒントを見る'}
          </button>
          {showHint && (
            <div className="mt-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
              💡 {level.hint}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function generateMockChatReply(input: string, phaseId: number, levelId: number): string {
  const lower = input.toLowerCase();

  if (lower.includes('完了') || lower.includes('できました') || lower.includes('しました') || lower.includes('繋ぎました')) {
    return `素晴らしいですね！Phase ${phaseId} Level ${levelId}の課題を達成できたとのこと、とても素晴らしい進歩です！\n\n実際に手を動かしてDifyを操作したことで、概念が体感として理解できたと思います。このまま「次へ」ボタンを押して次のレベルに進みましょう！`;
  }

  if (lower.includes('わからない') || lower.includes('教えて') || lower.includes('ヒント')) {
    const hints: Record<number, string> = {
      1: 'Difyの画面で「+」ボタンを押すとブロックを追加できます。開始→LLM→回答の順に繋いでみてください。',
      2: '{{変数名}}の形式で変数を参照できます。まず開始ブロックで変数を定義してから、LLMのシステムプロンプトで使いましょう。',
      3: '質問分類器ブロックを追加して、2つのクラス（「質問」と「課題提出」）を設定してみてください。',
      4: 'ナレッジメニューからドキュメントをアップロードし、フローに「知識検索」ブロックを追加してみましょう。',
      5: '並列処理は、同じブロックから2本の矢印を出して、別々のブロックに繋ぐことで実現できます。',
    };
    return hints[phaseId] || 'もう少し詳しく教えてもらえますか？何でつまずいているか教えていただければ、的確なヒントをお伝えできます。';
  }

  return `なるほど！Phase ${phaseId}の課題ですね。\n\nDifyは実際に手を動かすことが大切です。わからなくなったらいつでも聞いてください。課題が完了したら「完了しました」と教えてくれると、クリアの確認ができます！`;
}
