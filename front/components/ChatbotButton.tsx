'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/contexts/ProgressContext';
import { useAuth } from '@/contexts/AuthContext';

type Message = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

type LevelUpCandidate = {
  phaseId: number;
  levelId: number;
  feedbackMessage: string;
};

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: 'assistant',
      content:
        'こんにちは！Dify mini Campのメンターです ⛺\nDifyについて何でも聞いてください。課題が完了したら報告してくれると、フィードバックをお伝えします！',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [levelUpCandidate, setLevelUpCandidate] = useState<LevelUpCandidate | null>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { progress, completeLevel } = useProgress();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 現在フェーズで取り組み中のレベルを計算
  function getCurrentLevelForPhase(phaseId: number): number {
    const phaseLevels = progress.phases[phaseId]?.levels ?? {};
    const maxCleared = Object.entries(phaseLevels)
      .filter(([, lv]) => !!lv.clearedAt)
      .reduce((max, [id]) => Math.max(max, Number(id)), 0);
    return maxCleared + 1;
  }

  async function handleSend() {
    if (!input.trim() || isTyping) return;

    const text = input.trim();
    setInput('');
    setError(null);
    setMessages((prev) => [...prev, { id: prev.length, role: 'user', content: text }]);
    setIsTyping(true);

    const currentPhase = progress.currentPhase;
    const currentLevel = getCurrentLevelForPhase(currentPhase);

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          phase: currentPhase,
          levelId: currentLevel,
          interactionType: 'question',
          conversationId,
        }),
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const reply: string = data.reply ?? '';
      if (data.conversationId) setConversationId(data.conversationId);

      // 質問分類器が課題提出と判定した場合、採点JSONが返ることがある
      try {
        const parsed = JSON.parse(reply);
        if (parsed.is_cleared === true) {
          const feedback = parsed.feedback_message ?? '合格と判定されました！';
          setMessages((prev) => [
            ...prev,
            { id: prev.length, role: 'assistant', content: `✅ ${feedback}` },
          ]);
          setLevelUpCandidate({ phaseId: currentPhase, levelId: currentLevel, feedbackMessage: feedback });
        } else if (parsed.is_cleared === false) {
          setMessages((prev) => [
            ...prev,
            { id: prev.length, role: 'assistant', content: parsed.feedback_message ?? 'もう少し！' },
          ]);
        } else {
          // is_cleared フィールドがない通常のJSONはそのまま表示
          setMessages((prev) => [
            ...prev,
            { id: prev.length, role: 'assistant', content: reply || 'メンターから返答がありませんでした。' },
          ]);
        }
      } catch {
        // JSON以外（通常の会話）はそのまま表示
        setMessages((prev) => [
          ...prev,
          { id: prev.length, role: 'assistant', content: reply || 'メンターから返答がありませんでした。' },
        ]);
      }
    } catch {
      setError('メンターへの接続に失敗しました。もう一度お試しください。');
    } finally {
      setIsTyping(false);
    }
  }

  function handleConfirmLevelUp() {
    if (!levelUpCandidate) return;
    completeLevel(levelUpCandidate.phaseId, levelUpCandidate.levelId);
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length,
        role: 'assistant',
        content: `🎉 Level ${levelUpCandidate.levelId} クリア！進捗が保存されました。次のレベルへ進みましょう！`,
      },
    ]);
    setLevelUpCandidate(null);
  }

  function handleCancelLevelUp() {
    setMessages((prev) => [
      ...prev,
      {
        id: prev.length,
        role: 'assistant',
        content: 'わかりました。レベルアップをキャンセルしました。引き続き学習を続けましょう！',
      },
    ]);
    setLevelUpCandidate(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl shadow-lg shadow-indigo-500/40 transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
        aria-label="AIメンターを開く"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[520px] w-[360px] flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
          <div className="flex items-center gap-3 rounded-t-2xl border-b border-white/10 bg-indigo-600/20 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AIメンター</p>
              <p className="text-xs text-slate-400">Dify mini Camp サポート</p>
            </div>
            <div className="ml-auto flex h-2 w-2 rounded-full bg-emerald-400" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-slate-800 px-3 py-2 text-sm text-slate-400">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                    <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                  </span>
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}

            {/* レベルアップ確認ダイアログ */}
            {levelUpCandidate && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 space-y-2">
                <p className="text-xs font-semibold text-emerald-300">
                  🎓 Level {levelUpCandidate.levelId} クリアと判定されました！
                </p>
                <p className="text-xs text-slate-400">レベルアップして進捗を保存しますか？</p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmLevelUp}
                    size="sm"
                    className="flex-1 bg-emerald-600 text-xs hover:bg-emerald-500"
                  >
                    ✅ レベルアップ
                  </Button>
                  <Button
                    onClick={handleCancelLevelUp}
                    size="sm"
                    variant="ghost"
                    className="flex-1 text-xs text-slate-400 hover:text-white"
                  >
                    後で
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="メッセージを入力... (Enter送信)"
                rows={2}
                className="flex-1 resize-none rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                size="sm"
                className="self-end bg-indigo-600 hover:bg-indigo-500"
              >
                送信
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
