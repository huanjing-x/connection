import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import TagManager from './TagManager';
import type { Location } from '../types';

interface Props { location?: Location; onDone: () => void; presetX?: number; presetY?: number; }

export default function LocationForm({ location, onDone, presetX, presetY }: Props) {
  const { currentProject, factions, addLocation, updateLocation } = useApp();
  const [name, setName] = useState(location?.name || '');
  const [description, setDescription] = useState(location?.description || '');
  const [x, setX] = useState(location?.x ?? presetX ?? 50);
  const [y, setY] = useState(location?.y ?? presetY ?? 50);
  const [factionId, setFactionId] = useState(location?.factionId || '');
  const [tagIds, setTagIds] = useState<string[]>(location?.tags || []);
  const [startTime, setStartTime] = useState(location?.startTime ? new Date(location.startTime).toISOString().slice(0, 16) : '');
  const [endTime, setEndTime] = useState(location?.endTime ? new Date(location.endTime).toISOString().slice(0, 16) : '');

  const handleSubmit = async () => {
    if (!name.trim() || !currentProject) return;
    const loc: Location = {
      id: location?.id || generateId(), name: name.trim(), description: description.trim(),
      x, y, factionId: factionId || null, tags: tagIds,
      startTime: startTime ? new Date(startTime).toISOString() : null,
      endTime: endTime ? new Date(endTime).toISOString() : null,
      projectId: currentProject.id,
    };
    if (location) await updateLocation(loc); else await addLocation(loc);
    onDone();
  };

  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="名称 *" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <textarea className="input-field" placeholder="描述" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <div><label className="text-xs text-ink-light block mb-1">X (0-100)</label>
          <input type="number" min={0} max={100} className="input-field" value={x} onChange={e => setX(Number(e.target.value))} /></div>
        <div><label className="text-xs text-ink-light block mb-1">Y (0-100)</label>
          <input type="number" min={0} max={100} className="input-field" value={y} onChange={e => setY(Number(e.target.value))} /></div>
      </div>
      <select className="input-field text-xs" value={factionId} onChange={e => setFactionId(e.target.value)}>
        <option value="">无势力</option>
        {factions.map(f => <option key={f.id} value={f.id}>{f.emblemEmoji} {f.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-ink-light block mb-1">开始时间（留空=无限制）</label>
          <input type="datetime-local" className="input-field text-xs" value={startTime} onChange={e => setStartTime(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-ink-light block mb-1">结束时间（留空=无限制）</label>
          <input type="datetime-local" className="input-field text-xs" value={endTime} onChange={e => setEndTime(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="text-xs text-ink-light block mb-1">标签</label>
        <TagManager selectedIds={tagIds} onChange={setTagIds} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
          {location ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
