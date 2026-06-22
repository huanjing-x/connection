import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { Chapter } from '../types';

interface Props { chapter?: Chapter; onDone: () => void; }

export default function ChapterForm({ chapter, onDone }: Props) {
  const { currentProject, chapters, addChapter, updateChapter } = useApp();
  const defaultNum = chapters.length > 0 ? Math.max(...chapters.map(c => c.number)) + 1 : 1;
  const [title, setTitle] = useState(chapter?.title || '');
  const [number, setNumber] = useState(chapter?.number ?? defaultNum);
  const [summary, setSummary] = useState(chapter?.summary || '');
  const [status, setStatus] = useState<string>(chapter?.status || 'planning');

  const handleSubmit = async () => {
    if (!title.trim() || !currentProject) return;
    const ch: Chapter = {
      id: chapter?.id || generateId(), title: title.trim(),
      number, summary: summary.trim(), status: status as Chapter['status'], projectId: currentProject.id,
    };
    if (chapter) await updateChapter(ch); else await addChapter(ch);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-ink-light block mb-1">序号</label>
          <input type="number" min={1} className="input-field" value={number} onChange={e => setNumber(Number(e.target.value))} />
        </div>
        <div className="col-span-2">
          <label className="text-xs text-ink-light block mb-1">标题</label>
          <input className="input-field" placeholder="章节标题" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        </div>
      </div>
      <div>
        <label className="text-xs text-ink-light block mb-1">状态</label>
        <select className="input-field text-xs" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="planning">📝 规划中</option>
          <option value="writing">✍️ 写作中</option>
          <option value="done">✅ 已完成</option>
        </select>
      </div>
      <textarea className="input-field" placeholder="章节摘要" rows={3} value={summary} onChange={e => setSummary(e.target.value)} />
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!title.trim()} className="btn-primary disabled:opacity-40">
          {chapter ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
