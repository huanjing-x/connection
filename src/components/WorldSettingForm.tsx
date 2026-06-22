import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { WorldSetting } from '../types';

interface Props { setting?: WorldSetting; onDone: () => void; }

export default function WorldSettingForm({ setting, onDone }: Props) {
  const { currentProject, worldSettings, addWorldSetting, updateWorldSetting } = useApp();
  const existingCats = [...new Set(worldSettings.map(w => w.category))];
  const [category, setCategory] = useState(setting?.category || '');
  const [key, setKey] = useState(setting?.key || '');
  const [value, setValue] = useState(setting?.value || '');
  const [newCategory, setNewCategory] = useState('');

  const finalCategory = category === '__new__' ? newCategory : category;

  const handleSubmit = async () => {
    if (!key.trim() || !value.trim() || !finalCategory.trim() || !currentProject) return;
    const ws: WorldSetting = {
      id: setting?.id || generateId(), category: finalCategory.trim(),
      key: key.trim(), value: value.trim(), projectId: currentProject.id,
    };
    if (setting) await updateWorldSetting(ws); else await addWorldSetting(ws);
    onDone();
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-ink-light block mb-1">分类</label>
        <select className="input-field text-xs" value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">选择分类</option>
          {existingCats.map(c => <option key={c} value={c}>{c}</option>)}
          <option value="__new__">+ 新建分类</option>
        </select>
        {category === '__new__' && (
          <input className="input-field mt-1" placeholder="新分类名（如：魔法体系）" value={newCategory} onChange={e => setNewCategory(e.target.value)} autoFocus />
        )}
      </div>
      <input className="input-field" placeholder="键（如：火系魔法）" value={key} onChange={e => setKey(e.target.value)} />
      <textarea className="input-field" placeholder="值（详细描述）" rows={4} value={value} onChange={e => setValue(e.target.value)} />
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!key.trim() || !value.trim() || !finalCategory.trim()} className="btn-primary disabled:opacity-40">
          {setting ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
