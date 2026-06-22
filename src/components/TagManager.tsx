import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';

interface Props {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function TagManager({ selectedIds, onChange }: Props) {
  const { tags, addTag, currentProject } = useApp();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#8b5e3c');

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(s => s !== id) : [...selectedIds, id]);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !currentProject) return;
    const t = { id: generateId(), name: newName.trim(), color: newColor, projectId: currentProject.id };
    await addTag(t);
    onChange([...selectedIds, t.id]);
    setNewName('');
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {tags.length === 0 && <span className="text-xs text-ink-light">暂无标签</span>}
        {tags.map(t => {
          const sel = selectedIds.includes(t.id);
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                sel ? 'text-white border-transparent' : 'text-ink border-border hover:bg-parchment-dark'
              }`}
              style={sel ? { backgroundColor: t.color } : {}}
            >{t.name}</button>
          );
        })}
      </div>
      <div className="flex gap-1">
        <input
          className="input-field text-xs flex-1"
          placeholder="新标签名"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
        />
        <input type="color" className="w-8 h-8 rounded border border-border cursor-pointer" value={newColor} onChange={e => setNewColor(e.target.value)} />
        <button onClick={handleCreate} disabled={!newName.trim()} className="btn-primary text-xs px-2 disabled:opacity-40">+</button>
      </div>
    </div>
  );
}
