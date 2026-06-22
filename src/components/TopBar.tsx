import { useRef, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { clearProjectData } from '../db';
import type { Project } from '../types';

export default function TopBar() {
  const {
    projects, currentProject, setCurrentProject, createProject,
    softDeleteProject, restoreProject, permanentlyDeleteProject, deletedProjects,
    archiveProject, importArchive, openModal, closeModal, openConfirm,
    searchQuery, setSearchQuery, searchResults,
    setSelectedItem, setDrawerOpen, setActiveTab,
    characters, items, locations, events, factions, chapters, eras, tags,
    worldSettings, foreshadowings,
    undoStack, redoStack, undo, redo,
    dbError, resetDB,
  } = useApp();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') setShowSearch(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    if (showSearch) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSearch]);

  const handleNewProject = () => {
    let name = '';
    openModal('新建项目', (
      <div className="space-y-3">
        <input className="input-field" placeholder="项目名称" autoFocus
          onChange={(e) => { name = e.target.value; }}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { createProject(name.trim()); closeModal(); } }} />
        <div className="flex justify-end gap-2">
          <button onClick={closeModal} className="btn-secondary">取消</button>
          <button onClick={() => { if (name.trim()) { createProject(name.trim()); closeModal(); } }} className="btn-primary">创建</button>
        </div>
      </div>
    ));
  };

  const handleArchive = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    archiveProject(project).then(() => {
      openConfirm(
        '存档已导出为 JSON 文件。\n\n是否要清空该项目「' + project.name + '」的所有数据？',
        async () => { await clearProjectData(project.id); setShowDropdown(false); window.location.reload(); }
      );
    });
  };

  const handleExportMD = () => {
    if (!currentProject) return;
    let md = `# ${currentProject.name} - 小说大纲\n\n> 导出时间：${new Date().toLocaleString()}\n\n`;

    // Eras
    if (eras.length > 0) {
      md += `## 纪元\n\n`;
      eras.forEach(e => { md += `- **${e.name}**（${e.startYear} ~ ${e.endYear ?? '至今'}）\n`; });
      md += '\n';
    }

    // Chapters + Events
    const sortedChapters = [...chapters].sort((a,b) => a.number - b.number);
    const sortedEvents = [...events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    const orphanEvents = sortedEvents.filter(ev => !ev.chapterId);

    sortedChapters.forEach(ch => {
      md += `## 第${ch.number}章 ${ch.title}\n\n`;
      if (ch.summary) md += `> ${ch.summary}\n\n`;
      const chEvents = sortedEvents.filter(ev => ev.chapterId === ch.id);
      chEvents.forEach(ev => {
        const loc = locations.find(l=>l.id===ev.locationId);
        const chars = characters.filter(c=>ev.characterIds.includes(c.id));
        const its = items.filter(i=>ev.itemIds.includes(i.id));
        md += `### ${ev.title}\n\n`;
        md += `- **时间**：${new Date(ev.timestamp).toLocaleString()}\n`;
        if (loc) md += `- **地点**：${loc.name}\n`;
        if (chars.length) md += `- **人物**：${chars.map(c=>c.name).join('、')}\n`;
        if (its.length) md += `- **事物**：${its.map(i=>i.name).join('、')}\n`;
        if (ev.detail) md += `\n${ev.detail}\n`;
        md += '\n---\n\n';
      });
      if (chEvents.length === 0) md += `（暂无关联事件）\n\n`;
    });

    if (orphanEvents.length > 0) {
      md += `## 未分章事件\n\n`;
      orphanEvents.forEach(ev => {
        md += `### ${ev.title}\n\n- **时间**：${new Date(ev.timestamp).toLocaleString()}\n\n---\n\n`;
      });
    }

    // Characters
    md += `## 人物表\n\n`;
    characters.forEach(c => {
      const fac = factions.find(f=>f.id===c.factionId);
      md += `- ${c.avatarEmoji} **${c.name}**${c.title ? ` · ${c.title}` : ''}${fac ? ` · ${fac.emblemEmoji}${fac.name}` : ''} - ${c.status === 'alive' ? '存活' : c.status === 'dead' ? '死亡' : c.status === 'missing' ? '失踪' : '未知'}\n`;
      if (c.bio) md += `  ${c.bio}\n`;
    });
    md += '\n';

    // Factions
    if (factions.length > 0) {
      md += `## 势力\n\n`;
      factions.forEach(f => {
        const leader = characters.find(c=>c.id===f.leaderId);
        md += `- ${f.emblemEmoji} **${f.name}**${leader ? ` · 领袖：${leader.name}` : ''}\n`;
        if (f.description) md += `  ${f.description}\n`;
      });
      md += '\n';
    }

    // Foreshadowings
    if (foreshadowings.length > 0) {
      md += `## 伏笔\n\n`;
      foreshadowings.forEach(fs => {
        const planted = events.find(e=>e.id===fs.plantedEventId);
        const revealed = fs.revealedEventId ? events.find(e=>e.id===fs.revealedEventId) : null;
        md += `- [${fs.status === 'revealed' ? '✓' : '…'}] ${fs.description}`;
        if (planted) md += ` （埋于：${planted.title}）`;
        if (revealed) md += ` （收于：${revealed.title}）`;
        md += '\n';
      });
      md += '\n';
    }

    // WorldSettings
    if (worldSettings.length > 0) {
      md += `## 世界观设定\n\n`;
      const cats = [...new Set(worldSettings.map(w=>w.category))];
      cats.forEach(cat => {
        md += `### ${cat}\n\n`;
        worldSettings.filter(w=>w.category===cat).forEach(ws => {
          md += `- **${ws.key}**：${ws.value}\n`;
        });
        md += '\n';
      });
    }

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.name}_大纲_${new Date().toISOString().slice(0,10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSearchSelect = (result: any) => {
    setShowSearch(false);
    setSearchQuery('');
    if (result.type === 'character') { setSelectedItem({ type: 'character', id: result.id }); setDrawerOpen(true); setActiveTab('characters'); }
    else if (result.type === 'location') { setSelectedItem({ type: 'location', id: result.id }); setDrawerOpen(true); setActiveTab('locations'); }
    else if (result.type === 'faction') { setSelectedItem({ type: 'faction', id: result.id }); setDrawerOpen(true); setActiveTab('factions'); }
    else { setActiveTab(result.type === 'item' ? 'items' : result.type === 'chapter' ? 'chapters' : result.type === 'event' ? 'characters' : 'worldSettings'); }
  };

  const typeIcons: Record<string, string> = { character: '👤', item: '📦', location: '📍', event: '⏱', faction: '🏛️', chapter: '📖', era: '⏳' };

  return (
    <div className="h-12 bg-parchment-dark border-b border-border flex items-center px-4 gap-3 shrink-0">
      {/* Project selector */}
      <div className="relative">
        <button onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-parchment-light border border-border rounded-lg px-3 py-1.5 text-sm text-ink hover:bg-white transition-colors min-w-[150px]">
          <span className="truncate max-w-[110px]">{currentProject?.name || '选择项目'}</span>
          <span className="text-ink-light text-xs">▼</span>
        </button>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute top-full mt-1 left-0 z-20 bg-parchment-light border border-border rounded-lg shadow-xl w-64 max-h-80 overflow-y-auto">
              {projects.map(p => (
                <div key={p.id}
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-parchment-dark text-sm ${p.id === currentProject?.id ? 'bg-parchment-dark font-bold' : ''}`}
                  onClick={() => { setCurrentProject(p); setShowDropdown(false); }}>
                  <span className="truncate flex-1">{p.name}</span>
                  <div className="flex gap-0.5 shrink-0">
                    <button onClick={(e) => handleArchive(e, p)} title="存档" className="text-sm hover:scale-110 transition-transform">📦</button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`确定删除项目「${p.name}」？\n删除后可到回收站还原。`)) { softDeleteProject(p.id); setShowDropdown(false); } }} title="删除" className="text-xs hover:text-red-600">🗑️</button>
                  </div>
                </div>
              ))}
              {deletedProjects.length > 0 && (
                <div className="border-t border-border">
                  <div className="px-3 py-1.5 text-[10px] text-ink-light font-bold">🗑️ 回收站 ({deletedProjects.length})</div>
                  {deletedProjects.map(p => (
                    <div key={p.id} className="flex items-center justify-between px-3 py-1.5 text-xs hover:bg-parchment-dark">
                      <span className="truncate flex-1 text-ink-light">{p.name}</span>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => restoreProject(p.id)} className="text-[10px] text-green-600 hover:underline">还原</button>
                        <button onClick={() => { if (confirm(`永久删除「${p.name}」？此操作不可撤销。`)) permanentlyDeleteProject(p.id); }} className="text-[10px] text-red-500 hover:underline">彻底删除</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="border-t border-border px-3 py-2">
                <button onClick={() => { fileRef.current?.click(); setShowDropdown(false); }} className="text-sm text-accent hover:text-accent-light flex items-center gap-1 w-full">📂 导入存档</button>
              </div>
            </div>
          </>
        )}
      </div>
      <button onClick={handleNewProject} className="btn-primary text-xs whitespace-nowrap">+ 新建项目</button>

      <div className="flex-1" />

      {/* Undo / Redo */}
      <button onClick={undo} disabled={undoStack.length === 0} className="btn-secondary text-xs px-2 disabled:opacity-30" title="撤销 (Ctrl+Z)">↩</button>
      <button onClick={redo} disabled={redoStack.length === 0} className="btn-secondary text-xs px-2 disabled:opacity-30" title="恢复 (Ctrl+Y)">↪</button>

      {/* DB reset */}
      <button onClick={() => { if (confirm('确定要重置数据库吗？所有数据将被清除，页面将刷新。')) resetDB(); }} className="btn-secondary text-xs px-2" title="重置数据库">🔧</button>

      {/* Export MD button */}
      <button onClick={handleExportMD} className="btn-secondary text-xs whitespace-nowrap" title="导出 Markdown 大纲">📝 导出 MD</button>

      {/* Search */}
      <div ref={searchContainerRef} className="relative">
        <input
          ref={searchRef}
          className="input-field text-xs w-48 py-1"
          placeholder="🔍 Ctrl+K 搜索..."
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
          onFocus={() => setShowSearch(true)}
        />
        {showSearch && searchQuery.trim() && (
          <div className="absolute top-full mt-1 right-0 z-20 bg-parchment-light border border-border rounded-lg shadow-xl w-80 max-h-[400px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-xs text-ink-light p-3">无匹配结果</p>
            ) : (
              searchResults.map((r, i) => (
                <div key={`${r.type}-${r.id}`}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-parchment-dark text-xs"
                  onClick={() => handleSearchSelect(r)}>
                  <span>{typeIcons[r.type] || '•'}</span>
                  <span className="flex-1 truncate font-medium">{r.name}</span>
                  <span className="text-[10px] text-ink-light">{r.subtitle}</span>
                  <span className="text-[9px] bg-border px-1 rounded">{r.type}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try { await importArchive(file); setShowDropdown(false); } catch { alert('导入失败，请检查文件格式。'); }
        e.target.value = '';
      }} />

      {dbError && (
        <div className="fixed top-12 left-0 right-0 z-50 bg-red-50 border-b-2 border-red-500 px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-red-700 flex-1">⚠️ {dbError}</span>
          <button onClick={resetDB} className="btn-danger text-xs px-3 py-1">🔄 重置数据库</button>
        </div>
      )}
    </div>
  );
}

// Need to import useApp inside handleExportMD properly, it's already in scope via the component
