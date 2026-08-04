'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useProgress } from '@/contexts/ProgressContext';

type Message = {
  id: number;
  role: 'assistant' | 'user';
  content: string;
};

const MENTOR_RESPONSES: Record<string, string> = {
  default:
    'こんにちは！Dify mini Campのメンターです。Difyについて何でも聞いてください。また、課題が完了したら「フェーズX、レベルXを完了しました」と報告してください！',
  hello:
    'こんにちは！今日も学習を頑張りましょう！現在のフェーズで困っていることがあれば、何でも聞いてください。',
  help: 'Difyについて質問があればお答えします。また、各フェーズの課題でわからないことがあれば具体的に教えてください。',
};

function getMentorReply(input: string, currentPhase: number): string {
  const lower = input.toLowerCase();

  if (lower.includes('こんにちは') || lower.includes('hello') || lower.includes('はじめまして')) {
    return MENTOR_RESPONSES.hello;
  }

  if (
    lower.includes('完了') ||
    lower.includes('クリア') ||
    lower.includes('できました') ||
    lower.includes('しました')
  ) {
    return `素晴らしいです！Phase ${currentPhase}の学習を進めているんですね。しっかりと理解できているか確認させてください。何を達成しましたか？具体的に教えていただけると、より的確なフィードバックができます！`;
  }

  if (lower.includes('わからない') || lower.includes('むずかしい') || lower.includes('難しい')) {
    return `大丈夫ですよ！Phase ${currentPhase}は最初は難しく感じることもあります。どの部分でつまずいていますか？もっと具体的に教えてください。一緒に解決しましょう！`;
  }

  if (lower.includes('dify') && lower.includes('ブロック')) {
    return 'Difyのブロックについてですね！基本のブロックは「開始」「LLM」「回答」の3つです。これらをつなぐことで基本的なAIフローが完成します。もっと詳しく知りたいことはありますか？';
  }

  if (lower.includes('変数') || lower.includes('{{')) {
    return '変数は {{変数名}} の形式で参照します。開始ブロックで変数を定義してから、LLMブロックのプロンプト内で参照できます。実際に試してみましたか？';
  }

  if (lower.includes('rag') || lower.includes('ナレッジ') || lower.includes('知識検索')) {
    return 'RAG（検索拡張生成）はDifyのナレッジ機能で実現できます。ドキュメントをアップロードして、「知識検索」ブロックで検索し、その結果をLLMに渡す流れです。Phase 4で詳しく学べますよ！';
  }

  return `なるほど、興味深い質問ですね！Phase ${currentPhase}の学習と合わせて、ぜひDifyで実際に試してみてください。「やってみてわからなかったこと」があれば、また教えてください。一緒に考えましょう！`;
}

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { progress } = useProgress();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length,
      role: 'user',
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const reply = getMentorReply(input, progress.currentPhase);
      const assistantMessage: Message = {
        id: messages.length + 1,
        role: 'assistant',
        content: reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

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
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[360px] flex-col rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50">
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
