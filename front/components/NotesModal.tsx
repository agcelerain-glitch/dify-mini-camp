'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Plus, Trash2, Save, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Note = {
  id: string;
  title: string;
  phase_id: number | null;
  content: string;
  updated_at: string;
};

const PHASE_OPTIONS = [
  { value: null,  label: '全般',    badge: 'bg-slate-700 text-slate-300' },
  { value: 1,     label: 'Phase 1', badge: 'bg-sky-500/20 text-sky-300' },
  { value: 2,     label: 'Phase 2', badge: 'bg-emerald-500/20 text-emerald-300' },
  { value: 3,     label: 'Phase 3', badge: 'bg-violet-500/20 text-violet-300' },
  { value: 4,     label: 'Phase 4', badge: 'bg-amber-500/20 text-amber-300' },
  { value: 5,     label: 'Phase 5', badge: 'bg-rose-500/20 text-rose-300' },
];

function phaseBadge(phaseId: number | null) {
  return PHASE_OPTIONS.find((o) => o.value === phaseId) ?? PHASE_OPTIONS[0];
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type Props = { open: boolean; onClose: () => void };

export function NotesModal({ open, onClose }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | 'new' | null>(null);

  const [editTitle, setEditTitle] = useState('');
  const [editPhaseId, setEditPhaseId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // モバイル: list / editor トグル
  const [mobileView, setMobileView] = useState<'list' | 'editor'>('list');

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notes');
      if (res.ok) setNotes(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotes();
      setSelectedId(null);
      setMobileView('list');
    }
  }, [open, fetchNotes]);

  function selectNote(note: Note) {
    setSelectedId(note.id);
    setEditTitle(note.title);
    setEditPhaseId(note.phase_id);
    setEditContent(note.content);
    setSaveError(false);
    setMobileView('editor');
  }

  function newNote() {
    setSelectedId('new');
    setEditTitle('');
    setEditPhaseId(null);
    setEditContent('');
    setSaveError(false);
    setMobileView('editor');
  }

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    setSaveError(false);
    try {
      if (selectedId === 'new') {
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, phaseId: editPhaseId, content: editContent }),
        });
        if (!res.ok) throw new Error();
        const created: Note = await res.json();
        setNotes((prev) => [created, ...prev]);
      } else if (selectedId) {
        const res = await fetch(`/api/notes/${selectedId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editTitle, phaseId: editPhaseId, content: editContent }),
        });
        if (!res.ok) throw new Error();
        const updated: Note = await res.json();
        setNotes((prev) => [updated, ...prev.filter((n) => n.id !== updated.id)]);
      }
      // 保存成功 → 選択解除して一覧表示に戻る
      setSelectedId(null);
      setMobileView('list');
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || selectedId === 'new' || deleting) return;
    if (!window.confirm('このノートを削除しますか？')) return;
    setDeleting(true);
    try {
      await fetch(`/api/notes/${selectedId}`, { method: 'DELETE' });
      setNotes((prev) => prev.filter((n) => n.id !== selectedId));
      setSelectedId(null);
      setMobileView('list');
    } finally {
      setDeleting(false);
    }
  }

  if (!open) return null;

  const selectedNote = selectedId && selectedId !== 'new'
    ? notes.find((n) => n.id === selectedId) ?? null
    : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl"
           style={{ height: 'min(600px, 90vh)' }}>

        {/* ===== 左：ノートリスト ===== */}
        <div className={`flex w-60 shrink-0 flex-col border-r border-white/10 ${mobileView === 'editor' ? 'hidden sm:flex' : 'flex w-full sm:w-60'}`}>
          {/* リストヘッダー */}
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-3">
            <span className="text-sm font-semibold text-white">ノート</span>
            <button
              onClick={newNote}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
            >
              <Plus size={12} />
              新規
            </button>
          </div>

          {/* ノートリスト */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            ) : notes.length === 0 && selectedId !== 'new' ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <FileText size={28} className="text-slate-600" />
                <p className="text-xs text-slate-500">ノートはまだありません</p>
                <button onClick={newNote} className="text-xs text-indigo-400 hover:text-indigo-300">
                  最初のノートを作成 →
                </button>
              </div>
            ) : (
              <>
                {selectedId === 'new' && (
                  <button className="w-full border-b border-white/5 bg-indigo-600/10 px-3 py-2.5 text-left transition-colors">
                    <p className="truncate text-xs font-medium text-indigo-300">
                      {editTitle || '（タイトルなし）'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">新規作成中</p>
                  </button>
                )}
                {notes.map((note) => {
                  const ph = phaseBadge(note.phase_id);
                  const isActive = note.id === selectedId;
                  return (
                    <button
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={`w-full border-b border-white/5 px-3 py-2.5 text-left transition-colors ${
                        isActive ? 'bg-slate-800' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <p className="truncate text-xs font-medium text-white">
                        {note.title || '（タイトルなし）'}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${ph.badge}`}>
                          {ph.label}
                        </span>
                        <span className="text-[10px] text-slate-600">{formatDate(note.updated_at)}</span>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ===== 右：エディタ ===== */}
        <div className={`flex flex-1 flex-col ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {/* エディタヘッダー */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              {/* モバイル: 戻るボタン */}
              <button
                onClick={() => setMobileView('list')}
                className="sm:hidden text-xs text-slate-400 hover:text-white"
              >
                ← 一覧
              </button>
              <span className="text-sm font-semibold text-white">
                {selectedId === 'new' ? '新規ノート' : selectedNote ? '編集' : 'ノートを選択'}
              </span>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:text-slate-300">
              <X size={18} />
            </button>
          </div>

          {selectedId ? (
            <>
              {/* フォーム */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* タイトル */}
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="タイトル"
                  maxLength={100}
                  className="w-full rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm font-semibold text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                />

                {/* フェーズ選択 */}
                <div>
                  <label className="mb-1.5 block text-xs text-slate-500">関連フェーズ</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PHASE_OPTIONS.map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setEditPhaseId(opt.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          editPhaseId === opt.value
                            ? `${opt.badge} border-transparent`
                            : 'border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 内容 */}
                <div className="flex flex-col" style={{ minHeight: '200px' }}>
                  <label className="mb-1.5 block text-xs text-slate-500">内容</label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="気づいたことや手順、アイデアを自由に書いてください..."
                    className="flex-1 w-full resize-none rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                    style={{ minHeight: '200px' }}
                  />
                </div>
              </div>

              {/* フッター */}
              <div className="border-t border-white/10 px-4 py-3">
                {saveError && (
                  <div className="mb-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                    <p className="font-semibold">保存に失敗しました。</p>
                    <p className="mt-0.5 text-rose-400">
                      内容を別の場所（メモ帳など）にコピーしてから、画面を閉じてください。
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {selectedId !== 'new' && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-800 hover:text-rose-400 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {deleting ? '削除中...' : '削除'}
                    </button>
                  )}
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                    size="sm"
                  >
                    <Save size={13} />
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* 未選択状態 */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <FileText size={36} className="text-slate-700" />
              <p className="text-sm text-slate-500">左からノートを選ぶか、新規作成してください</p>
              <button
                onClick={newNote}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-500"
              >
                <Plus size={14} />
                新規ノート
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
