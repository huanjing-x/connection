import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { Faction } from '../types';

interface Props { faction?: Faction; onDone: () => void; }

export default function FactionForm({ faction, onDone }: Props) {
  const { currentProject, characters, addFaction, updateFaction } = useApp();
  const [name, setName] = useState(faction?.name || '');
  const [description, setDescription] = useState(faction?.description || '');
  const [leaderId, setLeaderId] = useState(faction?.leaderId || '');
  const [emblemEmoji, setEmblemEmoji] = useState(faction?.emblemEmoji || '🏛️');
  const [color, setColor] = useState(faction?.color || '#8b5e3c');

  const emojis = ['🏛️','🏰','🏯','🗼','⚔️','🛡️','🔮','🏹','🐉','🐲','👑','🌙','☀️','⭐','🔥','💧','🌿','💀','🤖','🧙','🦅','🐺','🦁','🐍','🕊️','⚜️','🔱','💎'];

  const handleSubmit = async () => {
    if (!name.trim() || !currentProject) return;
    const f: Faction = {
      id: faction?.id || generateId(), name: name.trim(), description: description.trim(),
      leaderId: leaderId || null, emblemEmoji, color, projectId: currentProject.id,
    };
    if (faction) await updateFaction(f); else await addFaction(f);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-ink-light block mb-1">标志</label>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
          {emojis.map(e => (
            <button key={e} onClick={() => setEmblemEmoji(e)}
              className={`text-xl p-1 rounded hover:bg-parchment-dark ${emblemEmoji === e ? 'bg-accent/20 ring-2 ring-accent' : ''}`}>{e}</button>
          ))}
        </div>
      </div>
      <input className="input-field" placeholder="势力名称 *" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <textarea className="input-field" placeholder="势力描述" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
      <div className="grid grid-cols-2 gap-2">
        <select className="input-field text-xs" value={leaderId} onChange={e => setLeaderId(e.target.value)}>
          <option value="">无领袖</option>
          {characters.map(c => <option key={c.id} value={c.id}>{c.avatarEmoji} {c.name}</option>)}
        </select>
        <div>
          <label className="text-xs text-ink-light block mb-1">势力色</label>
          <input type="color" className="w-full h-9 rounded border border-border cursor-pointer" value={color} onChange={e => setColor(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
          {faction ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
