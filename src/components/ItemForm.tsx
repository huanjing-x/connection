import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import TagManager from './TagManager';
import type { Item } from '../types';

interface Props { item?: Item; onDone: () => void; }

export default function ItemForm({ item, onDone }: Props) {
  const { currentProject, characters, addItem, updateItem } = useApp();
  const [name, setName] = useState(item?.name || '');
  const [description, setDescription] = useState(item?.description || '');
  const [ownerId, setOwnerId] = useState(item?.ownerId || '');
  const [tagIds, setTagIds] = useState<string[]>(item?.tags || []);

  const handleSubmit = async () => {
    if (!name.trim() || !currentProject) return;
    const it: Item = {
      id: item?.id || generateId(), name: name.trim(), description: description.trim(),
      ownerId: ownerId || null, tags: tagIds, projectId: currentProject.id,
    };
    if (item) await updateItem(it); else await addItem(it);
    onDone();
  };

  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="名称 *" value={name} onChange={e => setName(e.target.value)} autoFocus />
      <textarea className="input-field" placeholder="描述" rows={2} value={description} onChange={e => setDescription(e.target.value)} />
      <select className="input-field text-xs" value={ownerId} onChange={e => setOwnerId(e.target.value)}>
        <option value="">无所有者</option>
        {characters.map(c => <option key={c.id} value={c.id}>{c.avatarEmoji} {c.name}</option>)}
      </select>
      <div>
        <label className="text-xs text-ink-light block mb-1">标签</label>
        <TagManager selectedIds={tagIds} onChange={setTagIds} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
          {item ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
