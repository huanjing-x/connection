import { useState } from 'react';
import { useApp } from '../context/AppContext';
import EventForm from './EventForm';
import CharacterForm from './CharacterForm';
import LocationForm from './LocationForm';
import FactionForm from './FactionForm';
import { generateId } from '../db';
import type { Relation, CharacterPresence } from '../types';

export default function RightDrawer() {
  const {
    drawerOpen, setDrawerOpen, selectedItem, setSelectedItem,
    characters, items, locations, events, relations,
    eras, chapters, factions, tags, currentProject,
    presences, addPresence, updatePresence, removePresence,
    characterImages,
    addRelation, removeRelation, removeEvent,
    openModal, closeModal, timelineValue, setTimelineValue,
  } = useApp();

  const [relTab, setRelTab] = useState<'character' | 'item' | 'location' | 'faction'>('character');
  const [relTarget, setRelTarget] = useState('');
  const [relType, setRelType] = useState('朋友');

  const jumpTo = (isoStr: string) => setTimelineValue(new Date(isoStr).getTime());
  const TimeLink = ({ iso, label }: { iso: string; label?: string }) => (
    <button onClick={() => jumpTo(iso)} className="text-[9px] text-accent hover:underline cursor-pointer" title="跳转到此时刻">
      {label || new Date(iso).toLocaleString()}
    </button>
  );

  if (!drawerOpen || !selectedItem || !currentProject) return null;

  const { type, id } = selectedItem;
  const isChar = type === 'character';
  const isLoc = type === 'location';
  const isFac = type === 'faction';

  const character = isChar ? characters.find(c => c.id === id) : null;
  const location = isLoc ? locations.find(l => l.id === id) : null;
  const faction = isFac ? factions.find(f => f.id === id) : null;

  // Find active character image for current timeline
  const activeCharImage = isChar && character ? (() => {
    const sorted = characterImages
      .filter(ci => ci.characterId === character.id)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    for (const ci of sorted) {
      const start = new Date(ci.startTime).getTime();
      const end = ci.endTime ? new Date(ci.endTime).getTime() : Infinity;
      if (start <= timelineValue && timelineValue <= end) return ci;
    }
    return null;
  })() : null;

  const filteredEvents = events.filter(e => new Date(e.timestamp).getTime() <= timelineValue);

  const relatedEvents = filteredEvents.filter(e => {
    if (isChar) return e.characterIds.includes(id);
    if (isLoc) return e.locationId === id;
    if (isFac) return false; // factions don't directly relate to events
    return false;
  }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const charRelations = isChar ? relations.filter(r => r.sourceId === id) : [];
  const factionMembers = isFac ? characters.filter(c => c.factionId === id) : [];
  const factionLocations = isFac ? locations.filter(l => l.factionId === id) : [];

  const handleAddRelation = async () => {
    if (!relTarget || !character) return;
    const rel: Relation = {
      id: generateId(), sourceId: character.id, targetId: relTarget,
      targetType: relTab, relationType: relType, projectId: currentProject.id,
    };
    await addRelation(rel);
    setRelTarget('');
  };

  const getTargetInfo = (rel: Relation) => {
    const map: Record<string, { find: Function; emoji: string }> = {
      character: { find: (id2: string) => characters.find(c => c.id === id2), emoji: '🧑' },
      item: { find: (id2: string) => items.find(i => i.id === id2), emoji: '📦' },
      location: { find: (id2: string) => locations.find(l => l.id === id2), emoji: '📍' },
      faction: { find: (id2: string) => factions.find(f => f.id === id2), emoji: '🏛️' },
    };
    const t = rel.targetType || 'character';
    const cfg = map[t] || map.character;
    const entity = cfg.find(rel.targetId);
    return { name: entity?.name || '未知', emoji: entity?.avatarEmoji || entity?.emblemEmoji || cfg.emoji };
  };

  // Title info
  const titleIcon = isChar ? (character?.avatarEmoji || '🧑') : isLoc ? '📍' : faction?.emblemEmoji || '🏛️';
  const titleName = character?.name || location?.name || faction?.name || '';
  const titleSub = isChar ? '人物详情' : isLoc ? '地点详情' : '势力详情';

  return (
    <div className="w-[340px] shrink-0 bg-parchment-light border-l-2 border-border overflow-y-auto shadow-xl z-30">
      {/* Header */}
      <div className="sticky top-0 bg-parchment-dark border-b border-border px-4 py-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          {activeCharImage ? (
            <img src={activeCharImage.imageData} className="w-10 h-10 rounded-full object-cover border-2 border-accent" alt="" />
          ) : (
            <span className="text-2xl">{titleIcon}</span>
          )}
          <div>
            <h2 className="font-bold text-ink text-sm">{titleName}</h2>
            <p className="text-[10px] text-ink-light">{titleSub}</p>
          </div>
        </div>
        {activeCharImage?.description && (
          <p className="text-[10px] text-ink-light mx-2 italic max-w-[100px] truncate" title={activeCharImage.description}>
            {activeCharImage.description}
          </p>
        )}
        <button onClick={() => setDrawerOpen(false)} className="text-ink-light hover:text-ink text-lg leading-none px-1">✕</button>
      </div>

      <div className="p-4 space-y-4">
        {/* Character details */}
        {isChar && character && (
          <>
            {character.title && <div className="text-xs"><span className="text-ink-light">称号：</span><span className="text-ink font-bold">{character.title}</span></div>}
            <div className="flex gap-2 text-xs">
              <span className="text-ink-light">状态：</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                character.status === 'alive' ? 'bg-green-200 text-green-800' :
                character.status === 'dead' ? 'bg-red-200 text-red-800' :
                character.status === 'missing' ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-200 text-gray-800'
              }`}>
                {character.status === 'alive' ? '存活' : character.status === 'dead' ? '死亡' : character.status === 'missing' ? '失踪' : '未知'}
              </span>
            </div>
            {character.factionId && (() => {
              const fac = factions.find(f => f.id === character.factionId);
              return fac ? <div className="text-xs"><span className="text-ink-light">势力：</span><span className="text-ink">{fac.emblemEmoji} {fac.name}</span></div> : null;
            })()}
            {character.motivation && <div><h3 className="text-xs font-bold text-ink-light mb-1">动机</h3><p className="text-xs text-ink">{character.motivation}</p></div>}
            {character.arc && <div><h3 className="text-xs font-bold text-ink-light mb-1">人物弧光</h3><p className="text-xs text-ink">{character.arc}</p></div>}
            {character.bio && <div><h3 className="text-xs font-bold text-ink-light mb-1">简介</h3><p className="text-xs text-ink leading-relaxed">{character.bio}</p></div>}
            {character.tags.length > 0 && <div className="flex flex-wrap gap-1">{(character.tags as string[]).map(tid => { const t = tags.find(tg => tg.id === tid); return t ? <span key={tid} className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:t.color}}>{t.name}</span> : null; })}</div>}
            <button onClick={() => openModal('编辑人物', <CharacterForm character={character} onDone={closeModal} />)} className="w-full btn-secondary text-xs">✎ 编辑人物</button>
          </>
        )}

        {/* Location details */}
        {isLoc && location && (
          <>
            {location.description && <div><h3 className="text-xs font-bold text-ink-light mb-1">简介</h3><p className="text-xs text-ink leading-relaxed">{location.description}</p></div>}
            <div className="text-xs"><span className="text-ink-light">坐标：</span><span className="text-ink">({location.x}, {location.y})</span></div>
            {(location.startTime || location.endTime) && (
              <div className="text-xs flex items-center gap-1">
                <span className="text-ink-light">存在时间：</span>
                <span className="text-ink">
                  {location.startTime ? <TimeLink iso={location.startTime} /> : '不限'} ~ {location.endTime ? <TimeLink iso={location.endTime} /> : '不限'}
                </span>
              </div>
            )}
            {(() => {
              const start = location.startTime ? new Date(location.startTime).getTime() : -Infinity;
              const end = location.endTime ? new Date(location.endTime).getTime() : Infinity;
              const visible = start <= timelineValue && timelineValue <= end;
              return visible ? null : <div className="text-[10px] text-yellow-700 bg-yellow-50 px-2 py-1 rounded">⚠️ 当前时间点此地不存在</div>;
            })()}
            {location.factionId && (() => {
              const fac = factions.find(f => f.id === location.factionId);
              return fac ? <div className="text-xs"><span className="text-ink-light">势力：</span><span className="text-ink">{fac.emblemEmoji} {fac.name}</span></div> : null;
            })()}
            {location.tags.length > 0 && <div className="flex flex-wrap gap-1">{(location.tags as string[]).map(tid => { const t = tags.find(tg => tg.id === tid); return t ? <span key={tid} className="text-[9px] px-1.5 py-0.5 rounded-full text-white" style={{backgroundColor:t.color}}>{t.name}</span> : null; })}</div>}
            <button onClick={() => openModal('编辑地点', <LocationForm location={location} onDone={closeModal} />)} className="w-full btn-secondary text-xs">✎ 编辑地点</button>
          </>
        )}

        {/* Faction details */}
        {isFac && faction && (
          <>
            {faction.description && <div><h3 className="text-xs font-bold text-ink-light mb-1">简介</h3><p className="text-xs text-ink leading-relaxed">{faction.description}</p></div>}
            <div className="flex items-center gap-2 text-xs"><span className="text-ink-light">代表色：</span><span className="w-4 h-4 rounded-full border" style={{backgroundColor:faction.color}} /></div>
            {faction.leaderId && (() => {
              const leader = characters.find(c => c.id === faction.leaderId);
              return leader ? <div className="text-xs"><span className="text-ink-light">领袖：</span><span className="text-ink">{leader.avatarEmoji} {leader.name}</span></div> : null;
            })()}
            {factionMembers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-ink-light mb-1">成员 ({factionMembers.length})</h3>
                <div className="space-y-1">
                  {factionMembers.map(m => (
                    <div key={m.id} className="text-xs flex items-center gap-1 cursor-pointer hover:bg-parchment-dark rounded px-1 py-0.5"
                      onClick={() => { setSelectedItem({ type: 'character', id: m.id }); }}>
                      {m.avatarEmoji} {m.name} {m.id === faction.leaderId ? '👑' : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {factionLocations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-ink-light mb-1">领地 ({factionLocations.length})</h3>
                <div className="space-y-1">
                  {factionLocations.map(l => (
                    <div key={l.id} className="text-xs cursor-pointer hover:bg-parchment-dark rounded px-1 py-0.5"
                      onClick={() => { setSelectedItem({ type: 'location', id: l.id }); }}>
                      📍 {l.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => openModal('编辑势力', <FactionForm faction={faction} onDone={closeModal} />)} className="w-full btn-secondary text-xs">✎ 编辑势力</button>
          </>
        )}

        {/* Character Presences (character only) */}
        {isChar && character && (
          <div>
            <h3 className="text-xs font-bold text-ink-light uppercase mb-2">📍 出场记录</h3>
            {(() => {
              const charPresences = presences
                .filter(p => p.characterId === character.id)
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
              return (
                <div className="space-y-2">
                  {charPresences.length === 0 && <p className="text-xs text-ink-light">暂无出场记录，从左侧拖拽人物到地图地点来添加</p>}
                  {charPresences.map(p => {
                    const loc = locations.find(l => l.id === p.locationId);
                    const start = new Date(p.startTime);
                    const end = p.endTime ? new Date(p.endTime) : null;
                    const isActive = timelineValue >= start.getTime() && (!end || timelineValue <= end.getTime());
                    return (
                      <div key={p.id} className={`text-xs rounded p-2 ${isActive ? 'bg-green-100 border border-green-300' : 'bg-parchment-dark'}`}>
                        <div className="flex items-center justify-between gap-1">
                          <select className="text-xs bg-white border border-border rounded px-1 py-0.5 flex-1"
                            value={p.locationId}
                            onChange={e => updatePresence({ ...p, locationId: e.target.value })}>
                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                          </select>
                          <button onClick={() => removePresence(p.id)} className="text-red-500 hover:text-red-700 text-[10px] shrink-0">✕</button>
                        </div>
                        <div className="text-[10px] text-ink-light mt-0.5 space-y-1">
                          <div className="flex items-center gap-1">
                            <span>开始：</span>
                            <input type="datetime-local" className="text-[10px] bg-white border border-border rounded px-1 py-0.5 flex-1"
                              value={p.startTime.slice(0, 16)}
                              onChange={e => updatePresence({ ...p, startTime: new Date(e.target.value).toISOString() })} />
                            <TimeLink iso={p.startTime} label="🔗" />
                          </div>
                          <div className="flex items-center gap-1">
                            <span>结束：</span>
                            {p.endTime ? (
                              <>
                                <input type="datetime-local" className="text-[10px] bg-white border border-border rounded px-1 py-0.5 flex-1"
                                  value={p.endTime.slice(0, 16)}
                                  onChange={e => updatePresence({ ...p, endTime: new Date(e.target.value).toISOString() })} />
                                <TimeLink iso={p.endTime} label="🔗" />
                              </>
                            ) : <span className="text-green-600 font-bold">至今</span>}
                            {p.endTime && (
                              <button onClick={() => updatePresence({ ...p, endTime: null })} className="text-[9px] text-accent hover:underline">清除</button>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span>外观：</span>
                            <input className="text-[10px] bg-white border border-border rounded px-1 py-0.5 flex-1"
                              placeholder="此次出场的外观描述..."
                              value={p.appearanceDescription || ''}
                              onChange={e => updatePresence({ ...p, appearanceDescription: e.target.value })} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    onClick={async () => {
                      if (!character || locations.length === 0) return;
                      const now = new Date(timelineValue).toISOString();
                      // Close existing open presences for this character
                      for (const ep of presences) {
                        if (ep.characterId === character.id && !ep.endTime) {
                          await updatePresence({ ...ep, endTime: now });
                        }
                      }
                      await addPresence({
                        id: generateId(), characterId: character.id, locationId: locations[0].id,
                        startTime: now, endTime: null, appearanceDescription: '', projectId: currentProject.id,
                      });
                    }}
                    className="w-full text-xs btn-secondary"
                  >+ 添加出场（当前时间点）</button>
                </div>
              );
            })()}
          </div>
        )}

        {/* Relations (character only) */}
        {isChar && (
          <div>
            <h3 className="text-xs font-bold text-ink-light uppercase mb-2">🔗 关系</h3>
            {charRelations.length === 0 && <p className="text-xs text-ink-light mb-2">暂无关系</p>}
            <div className="space-y-1 mb-3">
              {charRelations.map(rel => {
                const info = getTargetInfo(rel);
                return (
                  <div key={rel.id} className="flex items-center gap-2 text-xs bg-parchment-dark rounded px-2 py-1">
                    <span>{info.emoji}</span>
                    <span className="flex-1 truncate">{info.name}</span>
                    <span className="text-ink-light bg-border px-1.5 py-0.5 rounded">{rel.relationType}</span>
                    <button onClick={() => removeRelation(rel.id)} className="text-red-600 hover:text-red-800">✕</button>
                  </div>
                );
              })}
            </div>
            {/* Add relation */}
            <div className="border border-border rounded-lg p-2 space-y-2 bg-white/50">
              <div className="flex gap-1">
                {(['character','item','location','faction'] as const).map(tab => (
                  <button key={tab} onClick={() => { setRelTab(tab); setRelTarget(''); }}
                    className={`text-[10px] px-2 py-0.5 rounded ${relTab === tab ? 'bg-accent text-white' : 'bg-border text-ink'}`}>
                    {{character:'人物',item:'事物',location:'地点',faction:'势力'}[tab]}
                  </button>
                ))}
              </div>
              <select className="input-field text-xs" value={relTarget} onChange={e => setRelTarget(e.target.value)}>
                <option value="">选择目标</option>
                {(relTab === 'character' ? characters.filter(c => c.id !== character?.id) :
                  relTab === 'item' ? items :
                  relTab === 'location' ? locations : factions
                ).map(opt => (
                  <option key={opt.id} value={opt.id}>{(opt as any).avatarEmoji || (opt as any).emblemEmoji || ''} {opt.name}</option>
                ))}
              </select>
              <select className="input-field text-xs" value={relType} onChange={e => setRelType(e.target.value)}>
                <option value="朋友">朋友</option><option value="敌对">敌对</option>
                <option value="恋人">恋人</option><option value="亲人">亲人</option>
                <option value="师徒">师徒</option><option value="拥有">拥有</option>
                <option value="位于">位于</option><option value="仇敌">仇敌</option>
                <option value="盟友">盟友</option><option value="隶属">隶属</option>
                <option value="统治">统治</option><option value="信仰">信仰</option>
              </select>
              <button onClick={handleAddRelation} disabled={!relTarget} className="w-full btn-primary text-xs disabled:opacity-40">+ 添加关系</button>
            </div>
          </div>
        )}

        {/* Events timeline (character & location only) */}
        {(isChar || isLoc) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-ink-light uppercase">📜 事件 ({relatedEvents.length})</h3>
              <button onClick={() => openModal('添加事件', <EventForm onDone={closeModal}
                presetLocationId={isLoc ? id : undefined} presetCharacterId={isChar ? id : undefined} />)}
                className="text-xs btn-primary">+ 事件</button>
            </div>
            {relatedEvents.length === 0 && <p className="text-xs text-ink-light">当前时间点暂无事件</p>}
            <div className="space-y-2">
              {relatedEvents.map(ev => {
                const loc = locations.find(l => l.id === ev.locationId);
                const chars = characters.filter(c => ev.characterIds.includes(c.id));
                const its = items.filter(i => ev.itemIds.includes(i.id));
                const era = ev.eraId ? eras.find(e => e.id === ev.eraId) : null;
                const ch = ev.chapterId ? chapters.find(c => c.id === ev.chapterId) : null;
                const d = new Date(ev.timestamp);
                return (
                  <div key={ev.id} className="panel-card relative">
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-bold text-ink">{ev.title}</h4>
                      <button onClick={() => { if (confirm('删除此事件？')) removeEvent(ev.id); }}
                        className="text-[10px] text-ink-light hover:text-red-600 ml-2 shrink-0">✕</button>
                    </div>
                    <div className="text-[10px] text-ink-light mt-0.5 space-x-2 flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                      <span>🕐 {d.getFullYear()}-{String(d.getMonth()+1).padStart(2,'0')}-{String(d.getDate()).padStart(2,'0')} {String(d.getHours()).padStart(2,'0')}:{String(d.getMinutes()).padStart(2,'0')}</span>
                      <TimeLink iso={ev.timestamp} label="🔗" />
                      {era && <span style={{color: era.color}}>⏳ {era.name}</span>}
                      {loc && <span>📍 {loc.name}</span>}
                      {ch && <span>📖 第{ch.number}章</span>}
                    </div>
                    {ev.detail && <p className="text-xs text-ink mt-1.5">{ev.detail}</p>}
                    {chars.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {chars.map(c => <span key={c.id} className="text-[10px] bg-parchment-dark px-1.5 py-0.5 rounded">{c.avatarEmoji} {c.name}</span>)}
                      </div>
                    )}
                    {its.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {its.map(it => <span key={it.id} className="text-[10px] bg-amber-100 px-1.5 py-0.5 rounded">📦 {it.name}</span>)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
