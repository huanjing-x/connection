import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { DraftNote } from '../types';

interface Props { note?: DraftNote; onDone: () => void; }

export default function DraftNoteForm({ note, onDone }: Props) {
  const { currentProject, addDraftNote, updateDraftNote } = useApp();
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');

  const handleSubmit = async () => {
    if (!currentProject) return;
    const now = new Date().toISOString();
    if (note) {
      await updateDraftNote({ ...note, title: title.trim() || '无标题', content, updatedAt: now });
    } else {
      await addDraftNote({ id: generateId(), title: title.trim() || '无标题', content, createdAt: now, updatedAt: now, projectId: currentProject.id });
    }
    onDone();
  };

  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="标题（可选）" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <textarea className="input-field" placeholder="随便写写……" rows={10} value={content} onChange={e => setContent(e.target.value)} />
      <p className="text-[10px] text-ink-light">自动保存时间：{note?.updatedAt ? new Date(note.updatedAt).toLocaleString() : '新建'}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} className="btn-primary">{note ? '保存' : '创建'}</button>
      </div>
    </div>
  );
}
