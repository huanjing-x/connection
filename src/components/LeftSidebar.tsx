import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CharacterForm from './CharacterForm';
import ItemForm from './ItemForm';
import LocationForm from './LocationForm';
import EventForm from './EventForm';
import EraForm from './EraForm';
import ChapterForm from './ChapterForm';
import FactionForm from './FactionForm';
import ForeshadowingForm from './ForeshadowingForm';
import WorldSettingForm from './WorldSettingForm';
import DraftNoteForm from './DraftNoteForm';

type TabType = 'characters' | 'items' | 'locations' | 'factions' | 'chapters' | 'foreshadowings' | 'worldSettings' | 'drafts';

const TABS: { key: TabType; icon: string; label: string }[] = [
  { key: 'characters', icon: '👤', label: '人物' },
  { key: 'items', icon: '📦', label: '事物' },
  { key: 'locations', icon: '📍', label: '地点' },
  { key: 'factions', icon: '🏛️', label: '势力' },
  { key: 'chapters', icon: '📖', label: '章节' },
  { key: 'foreshadowings', icon: '🎭', label: '伏笔' },
  { key: 'worldSettings', icon: '🌍', label: '世界观' },
  { key: 'drafts', icon: '📝', label: '草稿' },
];

export default function LeftSidebar() {
  const {
    characters, items, locations, factions, chapters, foreshadowings, worldSettings,
    draftNotes, removeDraftNote,
    events, eras, tags, currentProject, activeTab, setActiveTab,
    removeCharacter, removeItem, removeLocation, removeFaction, removeChapter,
    removeForeshadowing, removeWorldSetting, removeEra,
    updateCharacter,
    openModal, closeModal, setSelectedItem, setDrawerOpen, timelineValue,
    characterImages,
  } = useApp();

  const [charSearch, setCharSearch] = useState('');

  if (!currentProject) {
    return (
      <div className="w-[280px] shrink-0 bg-parchment-dark border-r border-border p-4 text-sm text-ink-light">
        请先创建或选择一个项目
      </div>
    );
  }

  const timelineMs = timelineValue;
  const activeCharIds = new Set(
    events.filter(e => new Date(e.timestamp).getTime() <= timelineMs).flatMap(e => e.characterIds)
  );

  const getCharImage = (charId: string): string | null => {
    const sorted = characterImages
      .filter(ci => ci.characterId === charId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (const ci of sorted) {
      const start = new Date(ci.startTime).getTime();
      const end = ci.endTime ? new Date(ci.endTime).getTime() : Infinity;
      if (start <= timelineMs && timelineMs <= end) return ci.imageData;
    }
    return null;
  };

  const renderList = (
    items: any[],
    renderItem: (item: any) => React.ReactNode,
    emptyText: string,
    addLabel: string,
    onAdd: () => void,
  ) => (
    <div className="space-y-1">
      {items.length === 0 && <p className="text-xs text-ink-light px-2 py-2">{emptyText}</p>}
      {items.map(renderItem)}
      <button onClick={onAdd} className="w-full text-xs btn-secondary mt-1">{addLabel}</button>
    </div>
  );

  const miniBtn = (onClick: (e?: React.MouseEvent) => void, title: string, symbol: string) => (
    <button onClick={onClick} className="text-xs text-ink-light hover:text-accent leading-none px-0.5" title={title}>{symbol}</button>
  );

  return (
    <div className="flex shrink-0">
      {/* Tab bar */}
      <div className="w-11 shrink-0 bg-parchment-dark border-r border-border flex flex-col items-center py-2 gap-0.5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-colors ${
              activeTab === t.key ? 'bg-accent/20 ring-1 ring-accent' : 'hover:bg-parchment'
            }`}
            title={t.label}
          >{t.icon}</button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => openModal('添加事件', <EventForm onDone={closeModal} />)}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-lg hover:bg-parchment transition-colors"
          title="添加事件"
        >⏱</button>
      </div>

      {/* Panel */}
      <div className="w-[229px] shrink-0 bg-parchment-dark/50 border-r border-border overflow-y-auto p-2.5 space-y-1.5">
        {/* Characters */}
        {activeTab === 'characters' && (
          <div className="space-y-1">
            {/* Search */}
            <input
              className="input-field text-xs py-1"
              placeholder="🔍 搜索人物..."
              value={charSearch}
              onChange={e => setCharSearch(e.target.value)}
            />
            {(() => {
              const q = charSearch.toLowerCase().trim();
              let filtered = characters;
              if (q) {
                filtered = characters.filter(c =>
                  c.name.toLowerCase().includes(q) ||
                  c.title.toLowerCase().includes(q) ||
                  c.bio.toLowerCase().includes(q)
                );
              }
              // Sort: pinned first, then alphabetically
              const sorted = [...filtered].sort((a, b) => {
                if (a.pinned && !b.pinned) return -1;
                if (!a.pinned && b.pinned) return 1;
                return a.name.localeCompare(b.name, 'zh');
              });
              return renderList(
                sorted,
                (c) => {
                  const charImg = getCharImage(c.id);
                  return (
                  <div key={c.id}
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'character', id: c.id })); e.dataTransfer.effectAllowed = 'move'; }}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-grab hover:bg-parchment-dark transition-colors active:cursor-grabbing ${activeCharIds.has(c.id) ? 'opacity-100' : 'opacity-40'}`}
                    onClick={() => { setSelectedItem({ type: 'character', id: c.id }); setDrawerOpen(true); }}
                  >
                    {c.pinned && <span className="text-[10px] shrink-0" title="已置顶">📌</span>}
                    <button
                      onClick={e => { e.stopPropagation(); updateCharacter({ ...c, pinned: !c.pinned }); }}
                      className={`text-xs shrink-0 leading-none hover:scale-125 transition-transform ${c.pinned ? 'text-yellow-600' : 'text-ink-light/30'}`}
                      title={c.pinned ? '取消置顶' : '置顶'}
                    >📌</button>
                    {charImg ? (
                      <img src={charImg} className="w-6 h-6 rounded-full object-cover border border-border" alt="" />
                    ) : (
                      <span>{c.avatarEmoji || '🧑'}</span>
                    )}
                    <span className="flex-1 truncate font-medium">{c.name}</span>
                    {c.status !== 'alive' && c.status !== 'unknown' && <span className="text-[9px] bg-border px-1 rounded">{c.status === 'dead' ? '死亡' : c.status === 'missing' ? '失踪' : ''}</span>}
                    {c.factionId && <span className="text-[9px]" title={factions.find(f=>f.id===c.factionId)?.name}>{factions.find(f=>f.id===c.factionId)?.emblemEmoji || '🏛️'}</span>}
                    {!activeCharIds.has(c.id) && <span className="text-[9px] text-ink-light">未登场</span>}
                    {miniBtn(() => openModal('编辑人物', <CharacterForm character={c} onDone={closeModal} />), '编辑', '✎')}
                    {miniBtn(() => { if (confirm('确定删除？')) removeCharacter(c.id); }, '删除', '✕')}
                  </div>
                ); },
                q ? (sorted.length === 0 ? '无匹配人物' : `搜索"${charSearch}"`) : '暂无人物',
                '+ 添加人物',
                () => openModal('添加人物', <CharacterForm onDone={closeModal} />),
              );
            })()}
          </div>
        )}

        {/* Items */}
        {activeTab === 'items' && renderList(
          items,
          (it) => (
            <div key={it.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-parchment-dark">
              <span className="flex-1 truncate">{it.name}</span>
              {it.ownerId && <span className="text-[9px] text-ink-light">{characters.find(c=>c.id===it.ownerId)?.name}</span>}
              {it.tags.map((tid: string) => { const tg = tags.find(t=>t.id===tid); return tg ? <span key={tid} className="text-[9px] px-1 rounded" style={{backgroundColor:tg.color+'30',color:tg.color}}>{tg.name}</span> : null; })}
              {miniBtn(() => openModal('编辑事物', <ItemForm item={it} onDone={closeModal} />), '编辑', '✎')}
              {miniBtn(() => { if (confirm('确定删除？')) removeItem(it.id); }, '删除', '✕')}
            </div>
          ),
          '暂无事物', '+ 添加事物',
          () => openModal('添加事物', <ItemForm onDone={closeModal} />),
        )}

        {/* Locations */}
        {activeTab === 'locations' && renderList(
          locations,
          (loc) => {
            const start = loc.startTime ? new Date(loc.startTime).getTime() : -Infinity;
            const end = loc.endTime ? new Date(loc.endTime).getTime() : Infinity;
            const visible = start <= timelineValue && timelineValue <= end;
            return (
              <div key={loc.id}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-parchment-dark ${visible ? 'opacity-100' : 'opacity-40'}`}
                onClick={() => { setSelectedItem({ type: 'location', id: loc.id }); setDrawerOpen(true); }}
              >
                <span className="flex-1 truncate">{loc.name}</span>
                {!visible && <span className="text-[9px] text-ink-light">已消失</span>}
                {loc.factionId && <span className="text-[9px]">{factions.find(f=>f.id===loc.factionId)?.emblemEmoji || '🏛️'}</span>}
                {miniBtn((e) => { e?.stopPropagation(); openModal('编辑地点', <LocationForm location={loc} onDone={closeModal} />); }, '编辑', '✎')}
                {miniBtn((e) => { e?.stopPropagation(); if (confirm('确定删除？')) removeLocation(loc.id); }, '删除', '✕')}
              </div>
            );
          },
          '暂无地点（在地图上双击添加）', '', () => {},
        )}

        {/* Factions */}
        {activeTab === 'factions' && renderList(
          factions,
          (f) => (
            <div key={f.id}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs cursor-pointer hover:bg-parchment-dark"
              onClick={() => { setSelectedItem({ type: 'faction', id: f.id }); setDrawerOpen(true); }}
            >
              <span>{f.emblemEmoji || '🏛️'}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:f.color}} />
              <span className="flex-1 truncate font-medium">{f.name}</span>
              {miniBtn((e) => { e?.stopPropagation(); openModal('编辑势力', <FactionForm faction={f} onDone={closeModal} />); }, '编辑', '✎')}
              {miniBtn((e) => { e?.stopPropagation(); if (confirm('确定删除？')) removeFaction(f.id); }, '删除', '✕')}
            </div>
          ),
          '暂无势力', '+ 添加势力',
          () => openModal('添加势力', <FactionForm onDone={closeModal} />),
        )}

        {/* Chapters */}
        {activeTab === 'chapters' && renderList(
          [...chapters].sort((a,b) => a.number - b.number),
          (ch) => (
            <div key={ch.id} className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs hover:bg-parchment-dark">
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ch.status === 'done' ? 'bg-green-500' : ch.status === 'writing' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
              <span className="flex-1 truncate">第{ch.number}章 {ch.title}</span>
              <span className="text-[9px] text-ink-light">{ch.status === 'done' ? '✓' : ch.status === 'writing' ? '写' : '划'}</span>
              {miniBtn(() => openModal('编辑章节', <ChapterForm chapter={ch} onDone={closeModal} />), '编辑', '✎')}
              {miniBtn(() => { if (confirm('确定删除？')) removeChapter(ch.id); }, '删除', '✕')}
            </div>
          ),
          '暂无章节', '+ 添加章节',
          () => openModal('添加章节', <ChapterForm onDone={closeModal} />),
        )}

        {/* Foreshadowings */}
        {activeTab === 'foreshadowings' && renderList(
          foreshadowings,
          (fs) => {
            const planted = events.find(e => e.id === fs.plantedEventId);
            const revealed = fs.revealedEventId ? events.find(e => e.id === fs.revealedEventId) : null;
            return (
              <div key={fs.id} className="px-2 py-1.5 rounded text-xs hover:bg-parchment-dark">
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] px-1 rounded ${fs.status === 'revealed' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                    {fs.status === 'revealed' ? '已回收' : '埋伏中'}
                  </span>
                  <span className="flex-1" />
                  {miniBtn(() => openModal('编辑伏笔', <ForeshadowingForm foreshadowing={fs} onDone={closeModal} />), '编辑', '✎')}
                  {miniBtn(() => { if (confirm('确定删除？')) removeForeshadowing(fs.id); }, '删除', '✕')}
                </div>
                <p className="text-[11px] text-ink mt-0.5 truncate">{fs.description}</p>
                <p className="text-[9px] text-ink-light">埋于: {planted?.title || '?'} {revealed ? `→ 收于: ${revealed.title}` : ''}</p>
              </div>
            );
          },
          '暂无伏笔', '+ 添加伏笔',
          () => openModal('添加伏笔', <ForeshadowingForm onDone={closeModal} />),
        )}

        {/* WorldSettings */}
        {activeTab === 'worldSettings' && (() => {
          const categories = [...new Set(worldSettings.map(w => w.category))];
          return (
            <div className="space-y-2">
              {worldSettings.length === 0 && <p className="text-xs text-ink-light px-2 py-2">暂无世界观设定</p>}
              {categories.map(cat => (
                <div key={cat}>
                  <h4 className="text-[10px] font-bold text-ink-light uppercase mb-1 px-1">{cat}</h4>
                  {worldSettings.filter(w => w.category === cat).map(ws => (
                    <div key={ws.id} className="flex items-start gap-1 px-2 py-1 rounded text-xs hover:bg-parchment-dark">
                      <span className="font-medium shrink-0">{ws.key}:</span>
                      <span className="flex-1 text-ink-light truncate">{ws.value}</span>
                      {miniBtn(() => openModal('编辑设定', <WorldSettingForm setting={ws} onDone={closeModal} />), '编辑', '✎')}
                      {miniBtn(() => { if (confirm('确定删除？')) removeWorldSetting(ws.id); }, '删除', '✕')}
                    </div>
                  ))}
                </div>
              ))}
              <button onClick={() => openModal('添加世界观设定', <WorldSettingForm onDone={closeModal} />)} className="w-full text-xs btn-secondary">+ 添加设定</button>
            </div>
          );
        })()}

        {/* Drafts */}
        {activeTab === 'drafts' && (
          <div className="space-y-2">
            {draftNotes.length === 0 && <p className="text-xs text-ink-light px-2 py-2">暂无草稿，随便写点什么</p>}
            {[...draftNotes].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(dn => (
              <div key={dn.id} className="panel-card cursor-pointer hover:bg-white transition-colors"
                onClick={() => openModal('编辑草稿', <DraftNoteForm note={dn} onDone={closeModal} />)}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-ink truncate">{dn.title || '无标题'}</span>
                  <div className="flex gap-0.5">
                    {miniBtn(() => openModal('编辑草稿', <DraftNoteForm note={dn} onDone={closeModal} />), '编辑', '✎')}
                    {miniBtn(() => { if (confirm('确定删除此草稿？')) removeDraftNote(dn.id); }, '删除', '✕')}
                  </div>
                </div>
                <p className="text-[10px] text-ink-light line-clamp-2 whitespace-pre-wrap">{dn.content.slice(0, 100)}</p>
                <p className="text-[9px] text-ink-light/60 mt-1">{new Date(dn.updatedAt).toLocaleString()}</p>
              </div>
            ))}
            <button onClick={() => openModal('新建草稿', <DraftNoteForm onDone={closeModal} />)} className="w-full text-xs btn-primary">+ 新建草稿</button>
          </div>
        )}

        {/* Eras quick list at bottom */}
        <div className="border-t border-border pt-2 mt-2">
          <h4 className="text-[10px] font-bold text-ink-light mb-1 px-1">纪元 ({eras.length})</h4>
          {eras.map(e => (
            <div key={e.id} className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-parchment-dark">
              <span className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor:e.color}} />
              <span className="flex-1 truncate">{e.name}</span>
              {miniBtn(() => openModal('编辑纪元', <EraForm era={e} onDone={closeModal} />), '编辑', '✎')}
              {miniBtn(() => { if (confirm('确定删除？')) removeEra(e.id); }, '删除', '✕')}
            </div>
          ))}
          <button onClick={() => openModal('添加纪元', <EraForm onDone={closeModal} />)} className="w-full text-xs btn-secondary mt-1">+ 添加纪元</button>
        </div>
      </div>
    </div>
  );
}
