import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { Foreshadowing } from '../types';

interface Props { foreshadowing?: Foreshadowing; onDone: () => void; }

export default function ForeshadowingForm({ foreshadowing, onDone }: Props) {
  const { currentProject, events, addForeshadowing, updateForeshadowing } = useApp();
  const [description, setDescription] = useState(foreshadowing?.description || '');
  const [plantedEventId, setPlantedEventId] = useState(foreshadowing?.plantedEventId || '');
  const [revealedEventId, setRevealedEventId] = useState(foreshadowing?.revealedEventId || '');
  const [status, setStatus] = useState<string>(foreshadowing?.status || 'planted');

  const handleSubmit = async () => {
    if (!description.trim() || !plantedEventId || !currentProject) return;
    const fs: Foreshadowing = {
      id: foreshadowing?.id || generateId(), description: description.trim(),
      plantedEventId, revealedEventId: revealedEventId || null,
      status: status as Foreshadowing['status'], projectId: currentProject.id,
    };
    if (foreshadowing) await updateForeshadowing(fs); else await addForeshadowing(fs);
    onDone();
  };

  const sortedEvents = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="space-y-3">
      <textarea className="input-field" placeholder="伏笔描述 *" rows={3} value={description} onChange={e => setDescription(e.target.value)} autoFocus />
      <div>
        <label className="text-xs text-ink-light block mb-1">埋下于（事件）*</label>
        <select className="input-field text-xs" value={plantedEventId} onChange={e => setPlantedEventId(e.target.value)}>
          <option value="">选择事件</option>
          {sortedEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-ink-light block mb-1">回收于（事件）</label>
        <select className="input-field text-xs" value={revealedEventId} onChange={e => setRevealedEventId(e.target.value)}>
          <option value="">未回收</option>
          {sortedEvents.map(ev => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs text-ink-light block mb-1">状态</label>
        <select className="input-field text-xs" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="planted">🌱 埋伏中</option>
          <option value="revealed">🎯 已回收</option>
        </select>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!description.trim() || !plantedEventId} className="btn-primary disabled:opacity-40">
          {foreshadowing ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
