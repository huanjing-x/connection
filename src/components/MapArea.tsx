import { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import type { Location, BackgroundImage } from '../types';

const DEFAULT_COLORS = [
  '#e74c3c', '#e67e22', '#2ecc71', '#3498db', '#9b59b6',
  '#1abc9c', '#f39c12', '#e91e63', '#00bcd4', '#8bc34a',
  '#ff5722', '#673ab7', '#009688', '#cddc39', '#ff9800',
];

export default function MapArea() {
  const {
    currentProject, updateProject,
    locations, events, factions, characters, presences, timelineValue,
    backgroundImages, addBackgroundImage, updateBackgroundImage, removeBackgroundImage,
    addLocation, updateLocation, addPresence, updatePresence,
    setSelectedItem, setDrawerOpen, openModal, closeModal,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetStart = useRef({ x: 0, y: 0 });

  // Batch adjust mode
  const [batchMode, setBatchMode] = useState(false);

  const getLocationColor = useCallback((loc: Location, idx: number): string => {
    if (loc.factionId) {
      const faction = factions.find(f => f.id === loc.factionId);
      if (faction?.color) return faction.color;
    }
    return DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
  }, [factions]);

  // Find the active background image for the current timeline value
  const activeBackground = (() => {
    const sorted = [...backgroundImages].sort((a, b) =>
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    for (const bg of sorted) {
      const start = new Date(bg.startTime).getTime();
      const end = bg.endTime ? new Date(bg.endTime).getTime() : Infinity;
      if (start <= timelineValue && timelineValue <= end) return bg;
    }
    return null;
  })();

  const displayBackground = activeBackground?.imageData || currentProject?.backgroundImage || null;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== containerRef.current && !(e.target as HTMLElement).closest('.map-inner')) return;
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetStart.current = { ...offset };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setOffset({ x: offsetStart.current.x + (e.clientX - dragStart.current.x), y: offsetStart.current.y + (e.clientY - dragStart.current.y) });
  };
  const handleMouseUp = () => setDragging(false);

  // Normal add-location on double-click (disabled in batch mode)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!currentProject || !containerRef.current || batchMode) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clampedX = Math.max(2, Math.min(98, Math.round(((e.clientX - rect.left - offset.x) / rect.width) * 100)));
    const clampedY = Math.max(2, Math.min(98, Math.round(((e.clientY - rect.top - offset.y) / rect.height) * 100)));
    let name = '', desc = '';
    openModal('添加地点', (
      <div className="space-y-3">
        <div><label className="text-xs text-ink-light">坐标: ({clampedX}, {clampedY})</label></div>
        <input className="input-field" placeholder="地点名称" autoFocus onChange={e => name = e.target.value} />
        <textarea className="input-field" placeholder="描述（可选）" rows={2} onChange={e => desc = e.target.value} />
        <div className="flex justify-end gap-2">
          <button onClick={closeModal} className="btn-secondary">取消</button>
          <button onClick={() => {
            if (!name.trim()) return;
            addLocation({ id: generateId(), name: name.trim(), description: desc.trim(), x: clampedX, y: clampedY, factionId: null, tags: [], startTime: null, endTime: null, projectId: currentProject.id });
            closeModal();
          }} className="btn-primary">添加</button>
        </div>
      </div>
    ));
  }, [currentProject, openModal, closeModal, addLocation, batchMode, offset]);

  // Batch-drag: move all locations together
  const [batchDragging, setBatchDragging] = useState(false);
  const batchStart = useRef<{ x: number; y: number; locs: { id: string; x: number; y: number }[] }>({ x: 0, y: 0, locs: [] });

  const handleBatchDotDown = (e: React.MouseEvent) => {
    if (!batchMode) return;
    e.stopPropagation();
    e.preventDefault();
    setBatchDragging(true);
    batchStart.current = {
      x: e.clientX,
      y: e.clientY,
      locs: locations.map(l => ({ id: l.id, x: l.x, y: l.y })),
    };
  };

  const [batchDelta, setBatchDelta] = useState({ dx: 0, dy: 0 });

  const handleBatchMouseDown = useCallback((e: React.MouseEvent) => {
    if (!batchMode) return;
    e.stopPropagation();
    e.preventDefault();
    setBatchDragging(true);
    batchStart.current = {
      x: e.clientX,
      y: e.clientY,
      locs: locations.map(l => ({ id: l.id, x: l.x, y: l.y })),
    };
  }, [batchMode, locations]);

  // Global listeners for batch mode
  useEffect(() => {
    if (!batchDragging) return;
    const onMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((ev.clientX - batchStart.current.x) / rect.width) * 100;
      const dy = ((ev.clientY - batchStart.current.y) / rect.height) * 100;
      setBatchDelta({ dx, dy });
    };
    const onUp = async () => {
      setBatchDragging(false);
      const { locs } = batchStart.current;
      const { dx, dy } = batchDelta;
      setBatchDelta({ dx: 0, dy: 0 });
      if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
      for (const loc of locs) {
        const newX = Math.max(2, Math.min(98, Math.round(loc.x + dx)));
        const newY = Math.max(2, Math.min(98, Math.round(loc.y + dy)));
        const full = locations.find(l => l.id === loc.id);
        if (full) await updateLocation({ ...full, x: newX, y: newY });
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [batchDragging, batchDelta, locations, updateLocation]);

  // Handle background image upload for time-based background
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Open time-range dialog for the new background
      let startTime = new Date(timelineValue).toISOString().slice(0, 16);
      let endTime = '';
      openModal('设置背景时间段', (
        <div className="space-y-3">
          <p className="text-xs text-ink-light">为此背景图设置生效时间段（不设结束时间则一直有效）</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-ink-light block mb-1">开始时间</label>
              <input type="datetime-local" className="input-field text-xs" defaultValue={startTime}
                onChange={e => { startTime = e.target.value; }} />
            </div>
            <div>
              <label className="text-xs text-ink-light block mb-1">结束时间（可选）</label>
              <input type="datetime-local" className="input-field text-xs"
                onChange={e => { endTime = e.target.value; }} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={closeModal} className="btn-secondary">取消</button>
            <button onClick={() => {
              addBackgroundImage({
                id: generateId(), projectId: currentProject.id,
                imageData: reader.result as string,
                startTime: new Date(startTime).toISOString(),
                endTime: endTime ? new Date(endTime).toISOString() : null,
              });
              closeModal();
            }} className="btn-primary">添加</button>
          </div>
        </div>
      ));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBgUrl = () => {
    if (!currentProject) return;
    let url = '';
    let defaultUrl = '';
    openModal('管理地图背景', (
      <div className="space-y-3 max-h-[60vh] overflow-y-auto">
        {/* Default background (no time range, always shown when no time-based bg matches) */}
        <div>
          <h4 className="text-xs font-bold text-ink-light mb-1">🖼️ 默认背景（无时间限制）</h4>
          <p className="text-[10px] text-ink-light mb-1">当没有匹配的时间段背景时显示此背景</p>
          <input className="input-field text-xs" placeholder="粘贴图片 URL" defaultValue={currentProject.backgroundImage || ''}
            onChange={e => defaultUrl = e.target.value} />
          <div className="flex gap-1 mt-1">
            <button onClick={() => fileRef.current?.click()} className="btn-secondary text-[10px] flex-1">📁 上传本地图片设为默认</button>
            {currentProject.backgroundImage && (
              <button onClick={() => { updateProject({ ...currentProject, backgroundImage: null }); closeModal(); }} className="btn-danger text-[10px]">清除</button>
            )}
          </div>
        </div>

        <div className="border-t border-border pt-2">
          <h4 className="text-xs font-bold text-ink-light mb-1">⏳ 时间段背景 ({backgroundImages.length})</h4>
          <p className="text-[10px] text-ink-light mb-2">不同时间段可显示不同的背景图</p>
          {backgroundImages.length === 0 && <p className="text-xs text-ink-light">暂无时间段背景</p>}
          <div className="space-y-2">
            {[...backgroundImages].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()).map(bg => {
              const isActive = activeBackground?.id === bg.id;
              return (
                <div key={bg.id} className={`rounded border p-2 text-xs ${isActive ? 'bg-green-50 border-green-300' : 'bg-white border-border'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <img src={bg.imageData} className="w-8 h-8 rounded object-cover" alt="" />
                    <div className="flex-1">
                      <span className="text-[10px]">{new Date(bg.startTime).toLocaleString()}</span>
                      <span className="text-[10px]"> ~ {bg.endTime ? new Date(bg.endTime).toLocaleString() : '不限'}</span>
                    </div>
                    {isActive && <span className="text-[9px] bg-green-200 text-green-800 px-1 rounded">当前</span>}
                    <button onClick={() => removeBackgroundImage(bg.id)} className="text-red-500 hover:text-red-700 text-[10px]">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={() => fileRef.current?.click()} className="w-full btn-primary text-xs mt-2">📁 + 添加时间段背景</button>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button onClick={() => {
            if (defaultUrl.trim()) updateProject({ ...currentProject, backgroundImage: defaultUrl.trim() });
            closeModal();
          }} className="btn-secondary text-xs">关闭</button>
        </div>
      </div>
    ));
  };

  // Filter locations by time range
  const visibleLocations = locations.filter(loc => {
    const start = loc.startTime ? new Date(loc.startTime).getTime() : -Infinity;
    const end = loc.endTime ? new Date(loc.endTime).getTime() : Infinity;
    return start <= timelineValue && timelineValue <= end;
  });

  const filteredEvents = events.filter(e => new Date(e.timestamp).getTime() <= timelineValue);
  const eventCountByLocation: Record<string, number> = {};
  filteredEvents.forEach(e => { eventCountByLocation[e.locationId] = (eventCountByLocation[e.locationId] || 0) + 1; });
  filteredEvents.forEach(e => { eventCountByLocation[e.locationId] = (eventCountByLocation[e.locationId] || 0) + 1; });

  // Character positions: based on presences at current timelineValue
  const charPositions: Record<string, string> = {}; // charId -> locationId
  presences.forEach(p => {
    const start = new Date(p.startTime).getTime();
    const end = p.endTime ? new Date(p.endTime).getTime() : Infinity;
    if (start <= timelineValue && timelineValue <= end) {
      charPositions[p.characterId] = p.locationId;
    }
  });

  // Drop handler: create or update presence
  const handleCharDrop = async (charId: string, locId: string) => {
    if (!currentProject) return;
    const now = new Date(timelineValue).toISOString();
    // Close any open-ended presence for this character
    for (const p of presences) {
      if (p.characterId === charId && !p.endTime) {
        await updatePresence({ ...p, endTime: now });
      }
    }
    // Create new presence starting at current time
    await addPresence({
      id: generateId(), characterId: charId, locationId: locId,
      startTime: now, endTime: null, appearanceDescription: '', projectId: currentProject.id,
    });
  };

  if (!currentProject) {
    return <div className="flex-1 flex items-center justify-center bg-parchment text-ink-light text-sm">请先创建或选择一个项目</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 relative overflow-hidden bg-parchment ${dragging ? 'cursor-grabbing' : batchMode ? 'cursor-move' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick} style={{ userSelect: 'none' }}
    >
      {/* Background image */}
      {displayBackground && (
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `url(${displayBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
        }} />
      )}

      {/* Grid pattern */}
      <div className="map-inner absolute inset-0" style={{
        backgroundImage: displayBackground ? 'none' : 'linear-gradient(rgba(139,94,60,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139,94,60,0.08) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        transform: `translate(${offset.x}px, ${offset.y}px)`,
      }} />

      {/* Location dots */}
      <div className="map-inner absolute inset-0" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
        {visibleLocations.map((loc, idx) => {
          const count = eventCountByLocation[loc.id] || 0;
          const color = getLocationColor(loc, idx);
          const faction = loc.factionId ? factions.find(f => f.id === loc.factionId) : null;
          // Apply batch delta
          const displayX = batchDragging ? loc.x + batchDelta.dx : loc.x;
          const displayY = batchDragging ? loc.y + batchDelta.dy : loc.y;
          return (
            <div key={loc.id} className="absolute cursor-pointer group"
              style={{ left: `${displayX}%`, top: `${displayY}%`, transform: 'translate(-50%, -50%)' }}
              onClick={(e) => {
                if (batchMode) { e.stopPropagation(); return; }
                setSelectedItem({ type: 'location', id: loc.id }); setDrawerOpen(true);
              }}
              onMouseDown={batchMode ? handleBatchDotDown : undefined}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDrop={(e) => {
                e.preventDefault();
                try {
                  const data = JSON.parse(e.dataTransfer.getData('text/plain'));
                  if (data.type === 'character') handleCharDrop(data.id, loc.id);
                } catch { /* ignore invalid drops */ }
              }}
            >
              <div className={`w-5 h-5 rounded-full border-2 border-white shadow-lg transition-transform ${batchMode ? 'ring-2 ring-blue-400 ring-offset-1 scale-110' : 'hover:scale-125'}`}
                style={{ backgroundColor: batchMode ? '#3b82f6' : color }} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-700 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
              <span className="absolute top-6 left-1/2 -translate-x-1/2 text-[11px] text-ink font-bold whitespace-nowrap bg-parchment-light/90 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {loc.name}{faction ? ` [${faction.name}]` : ''}
              </span>
            </div>
          );
        })}

        {/* Character icons at their current positions */}
        {Object.entries(charPositions).map(([charId, locId]) => {
          const char = characters.find(c => c.id === charId);
          const loc = locations.find(l => l.id === locId);
          if (!char || !loc) return null;
          return (
            <div key={`char-${charId}`}
              className="absolute cursor-pointer transition-all duration-300"
              style={{ left: `${loc.x}%`, top: `calc(${loc.y}% - 24px)`, transform: 'translate(-50%, -50%)' }}
              onClick={(e) => { e.stopPropagation(); setSelectedItem({ type: 'character', id: charId }); setDrawerOpen(true); }}
              title={`${char.name} @ ${loc.name}`}
            >
              <span className="text-lg drop-shadow-md hover:scale-125 transition-transform inline-block">{char.avatarEmoji || '🧑'}</span>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="absolute top-3 right-3 z-20 flex gap-2">
        <button onClick={handleBgUrl} className="bg-parchment-light/90 border border-border rounded-lg px-2.5 py-1.5 text-xs text-ink hover:bg-white shadow-sm transition-colors" title="管理地图背景（支持时间段）">
          🖼️ 背景{backgroundImages.length > 0 ? ` (${backgroundImages.length})` : ''}
        </button>
        <button
          onClick={() => { setBatchMode(!batchMode); setBatchDragging(false); setBatchDelta({ dx: 0, dy: 0 }); }}
          className={`rounded-lg px-2.5 py-1.5 text-xs shadow-sm transition-colors ${
            batchMode ? 'bg-blue-500 text-white border border-blue-600' : 'bg-parchment-light/90 border border-border text-ink hover:bg-white'
          }`}
          title="批量拖动所有地点以适配背景"
        >
          📐 {batchMode ? '调整中...' : '批量调整'}
        </button>
      </div>

      {/* Batch mode hint */}
      {batchMode && (
        <div className="absolute top-14 right-3 z-20 bg-blue-50 border border-blue-300 rounded-lg px-3 py-2 text-xs text-blue-800 shadow-sm">
          <p className="font-bold mb-1">📐 批量调整模式</p>
          <p>拖拽任意地点圆点，所有地点将同步移动</p>
          <p className="text-[10px] mt-0.5">再次点击"批量调整"按钮提交位置</p>
        </div>
      )}

      {/* Instructions */}
      {visibleLocations.length === 0 && locations.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-ink-light text-sm bg-parchment-light/70 px-6 py-4 rounded-xl">
            <p className="text-3xl mb-2">⏳</p>
            <p>当前时间点没有可见地点</p>
            <p className="text-xs mt-1">拖动时间轴或编辑地点的存在时间范围</p>
          </div>
        </div>
      )}
      {locations.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-ink-light text-sm bg-parchment-light/70 px-6 py-4 rounded-xl">
            <p className="text-3xl mb-2">🗺️</p>
            <p>在地图上<strong>双击</strong>添加第一个地点</p>
            <p className="text-xs mt-1">可上传背景图，用"批量调整"对齐地点</p>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
    </div>
  );
}
