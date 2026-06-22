import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import TagManager from './TagManager';
import type { NarrativeEvent, Character, Item, Location } from '../types';

interface Props { event?: NarrativeEvent; onDone: () => void; presetLocationId?: string; presetCharacterId?: string; presetTimestamp?: string; }

function InlineInput({ placeholder, onSave }: { placeholder: string; onSave: (name: string) => Promise<void> }) {
  const [val, setVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const valRef = useRef(val);
  valRef.current = val;
  const handleSave = async () => {
    const name = valRef.current.trim();
    if (!name) return;
    if (saving) return;
    setError('');
    setSaving(true);
    try {
      await onSave(name);
      setVal('');
    } catch (e: any) {
      const msg = e?.message || String(e) || '创建失败，请刷新页面后重试';
      setError(msg);
      alert('创建失败：' + msg);
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        <input className="input-field text-xs flex-1 py-1" placeholder={placeholder}
          disabled={saving}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } }}
          autoFocus />
        <button onClick={handleSave} disabled={saving || !val.trim()}
          className="btn-primary text-[10px] px-3 py-1.5 whitespace-nowrap disabled:opacity-40">{saving ? '创建中…' : '添加'}</button>
      </div>
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

export default function EventForm({ event, onDone, presetLocationId, presetCharacterId, presetTimestamp }: Props) {
  const { currentProject, characters, items, locations, eras, chapters, addEvent, updateEvent,
    addCharacter, addItem, addLocation } = useApp();
  const [title, setTitle] = useState(event?.title || '');
  const [detail, setDetail] = useState(event?.detail || '');
  const initialTs = event?.timestamp || presetTimestamp || new Date().toISOString();
  const [timestamp, setTimestamp] = useState(new Date(initialTs).toISOString().slice(0, 16));
  const [locationId, setLocationId] = useState(event?.locationId || presetLocationId || '');
  const [characterIds, setCharacterIds] = useState<string[]>(event?.characterIds || (presetCharacterId ? [presetCharacterId] : []));
  const [itemIds, setItemIds] = useState<string[]>(event?.itemIds || []);
  const [eraId, setEraId] = useState(event?.eraId || '');
  const [chapterId, setChapterId] = useState(event?.chapterId || '');
  const [tagIds, setTagIds] = useState<string[]>(event?.tags || []);

  // Inline creation toggles
  const [showNewLoc, setShowNewLoc] = useState(false);
  const [showNewChar, setShowNewChar] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);

  const toggle = (arr: string[], setArr: Function, id: string) => {
    setArr(arr.includes(id) ? arr.filter((x: string) => x !== id) : [...arr, id]);
  };

  const [submitError, setSubmitError] = useState('');
  const handleSubmit = async () => {
    if (!title.trim() || !locationId) { setSubmitError('请填写标题并选择地点'); return; }
    if (!currentProject) { setSubmitError('没有选中项目'); return; }
    setSubmitError('');
    try {
      const ev: NarrativeEvent = {
        id: event?.id || generateId(), title: title.trim(), detail: detail.trim(),
        timestamp: new Date(timestamp).toISOString(), locationId,
        characterIds, itemIds, eraId: eraId || null, chapterId: chapterId || null,
        tags: tagIds, projectId: currentProject.id,
      };
      if (event) await updateEvent(ev); else await addEvent(ev);
      onDone();
    } catch (e: any) {
      setSubmitError(e?.message || '保存失败，请刷新后重试');
    }
  };

  const handleCreateLocation = async (name: string) => {
    if (!currentProject) throw new Error('没有选中项目');
    const loc: Location = { id: generateId(), name, description: '', x: 50, y: 50, factionId: null, tags: [], startTime: null, endTime: null, projectId: currentProject.id };
    await addLocation(loc);
    setLocationId(loc.id);
    setShowNewLoc(false);
  };

  const handleCreateCharacter = async (name: string) => {
    if (!currentProject) throw new Error('没有选中项目');
    const c: Character = { id: generateId(), name, bio: '', avatarEmoji: '🧑', status: 'alive', title: '', motivation: '', arc: '', factionId: null, tags: [], pinned: false, projectId: currentProject.id };
    await addCharacter(c);
    setCharacterIds([...characterIds, c.id]);
    setShowNewChar(false);
  };

  const handleCreateItem = async (name: string) => {
    if (!currentProject) throw new Error('没有选中项目');
    const it: Item = { id: generateId(), name, description: '', ownerId: null, tags: [], projectId: currentProject.id };
    await addItem(it);
    setItemIds([...itemIds, it.id]);
    setShowNewItem(false);
  };

  return (
    <div className="space-y-3">
      <input className="input-field" placeholder="事件标题 *" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-ink-light block mb-1">时间 *</label>
          <input type="datetime-local" className="input-field text-xs" value={timestamp} onChange={e => setTimestamp(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-ink-light block mb-1">纪元</label>
          <select className="input-field text-xs" value={eraId} onChange={e => setEraId(e.target.value)}>
            <option value="">无</option>
            {eras.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-ink-light">地点 *</label>
            <button onClick={() => setShowNewLoc(!showNewLoc)} className="text-[10px] text-accent hover:underline">+新建</button>
          </div>
          {!showNewLoc ? (
            <select key={`loc-${locations.length}`} className="input-field text-xs" value={locationId} onChange={e => setLocationId(e.target.value)}>
              <option value="">选择地点</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          ) : (
            <InlineInput placeholder="新地点名称" onSave={handleCreateLocation} />
          )}
        </div>
        <div>
          <label className="text-xs text-ink-light block mb-1">章节</label>
          <select className="input-field text-xs" value={chapterId} onChange={e => setChapterId(e.target.value)}>
            <option value="">无</option>
            {[...chapters].sort((a,b)=>a.number-b.number).map(ch => <option key={ch.id} value={ch.id}>第{ch.number}章 {ch.title}</option>)}
          </select>
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-ink-light">参与人物</label>
          <button onClick={() => setShowNewChar(!showNewChar)} className="text-[10px] text-accent hover:underline">+新建</button>
        </div>
        <div className="flex flex-wrap gap-1 max-h-[100px] overflow-y-auto">
          {characters.length === 0 && !showNewChar && <span className="text-xs text-ink-light">暂无人物</span>}
          {characters.map(c => {
            const sel = characterIds.includes(c.id);
            return <button key={c.id} onClick={() => toggle(characterIds, setCharacterIds, c.id)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${sel ? 'bg-accent text-white border-accent' : 'bg-white text-ink border-border hover:bg-parchment-dark'}`}>{c.avatarEmoji} {c.name}</button>;
          })}
        </div>
        {showNewChar && <InlineInput placeholder="新人物名称" onSave={handleCreateCharacter} />}
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-ink-light">涉及事物</label>
          <button onClick={() => setShowNewItem(!showNewItem)} className="text-[10px] text-accent hover:underline">+新建</button>
        </div>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
          {items.length === 0 && !showNewItem && <span className="text-xs text-ink-light">暂无事物</span>}
          {items.map(it => {
            const sel = itemIds.includes(it.id);
            return <button key={it.id} onClick={() => toggle(itemIds, setItemIds, it.id)}
              className={`text-xs px-2 py-1 rounded border transition-colors ${sel ? 'bg-accent text-white border-accent' : 'bg-white text-ink border-border hover:bg-parchment-dark'}`}>📦 {it.name}</button>;
          })}
        </div>
        {showNewItem && <InlineInput placeholder="新事物名称" onSave={handleCreateItem} />}
      </div>
      <textarea className="input-field" placeholder="详细描述" rows={3} value={detail} onChange={e => setDetail(e.target.value)} />
      <div>
        <label className="text-xs text-ink-light block mb-1">标签</label>
        <TagManager selectedIds={tagIds} onChange={setTagIds} />
      </div>
      {submitError && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded">{submitError}</p>}
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={() => {
          if (!title.trim()) { alert('请填写事件标题'); return; }
          if (!locationId) { alert('请选择一个地点（如没有地点，先在地图上双击创建，或点"地点"旁的+新建）'); return; }
          handleSubmit();
        }} disabled={!title.trim() || !locationId} className="btn-primary disabled:opacity-40">
          {event ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
