import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { Era } from '../types';

interface Props { era?: Era; onDone: () => void; }

export default function EraForm({ era, onDone }: Props) {
  const { currentProject, addEra, updateEra } = useApp();
  const [name, setName] = useState(era?.name || '');
  const [startYear, setStartYear] = useState(era?.startYear ?? 0);
  const [endYear, setEndYear] = useState(era?.endYear?.toString() || '');
  const [color, setColor] = useState(era?.color || '#8b5e3c');

  const handleSubmit = async () => {
    if (!name.trim() || !currentProject) return;
    const e: Era = {
      id: era?.id || generateId(), name: name.trim(),
      startYear, endYear: endYear ? Number(endYear) : null, color, projectId: currentProject.id,
    };
    if (era) await updateEra(e); else await addEra(e);
    onDone();
  };

  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="纪元名称（如：灵气复苏纪元）" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-ink-light block mb-1">起始年份</label>
          <input type="number" className="input-field" value={startYear} onChange={e => setStartYear(Number(e.target.value))} />
        </div>
        <div>
          <label className="text-xs text-ink-light block mb-1">结束年份（留空=至今）</label>
          <input type="number" className="input-field" value={endYear} onChange={e => setEndYear(e.target.value)} placeholder="留空" />
        </div>
      </div>
      <div>
        <label className="text-xs text-ink-light block mb-1">纪元颜色</label>
        <input type="color" className="w-full h-9 rounded border border-border cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
          {era ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
