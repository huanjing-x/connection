import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Project, Character, Item, Location, NarrativeEvent, Relation, Era, Chapter, Faction, Foreshadowing, Tag, WorldSetting, DraftNote, CharacterPresence, BackgroundImage, CharacterImage } from '../types';
import * as db from '../db';

interface ModalState { open: boolean; title: string; content: React.ReactNode; }
interface ConfirmState { open: boolean; message: string; onConfirm: () => void; onCancel?: () => void; }
type TabType = 'characters' | 'items' | 'locations' | 'factions' | 'chapters' | 'foreshadowings' | 'worldSettings' | 'drafts';
type ZoomLevel = 'day' | 'month' | 'year';
type SelectableType = 'character' | 'location' | 'faction';
interface SelectedItem { type: SelectableType; id: string }

interface SearchResult { type: string; id: string; name: string; subtitle: string; }

interface AppContextType {
  projects: Project[]; currentProject: Project | null;
  setCurrentProject: (p: Project) => void;
  createProject: (name: string) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  softDeleteProject: (id: string) => Promise<void>;
  restoreProject: (id: string) => Promise<void>;
  permanentlyDeleteProject: (id: string) => Promise<void>;
  deletedProjects: Project[];
  archiveProject: (project: Project) => Promise<void>;
  importArchive: (file: File) => Promise<void>;
  // Undo/Redo
  undoStack: any[]; redoStack: any[];
  undo: () => void; redo: () => void;
  pushUndo: (entry: any) => void;
  dbError: string | null;
  resetDB: () => void;
  characters: Character[]; items: Item[]; locations: Location[]; events: NarrativeEvent[]; relations: Relation[];
  eras: Era[]; chapters: Chapter[]; factions: Faction[]; foreshadowings: Foreshadowing[]; tags: Tag[]; worldSettings: WorldSetting[]; draftNotes: DraftNote[]; presences: CharacterPresence[]; backgroundImages: BackgroundImage[]; characterImages: CharacterImage[];
  addCharacter: (c: Character) => Promise<void>; updateCharacter: (c: Character) => Promise<void>; removeCharacter: (id: string) => Promise<void>;
  addItem: (it: Item) => Promise<void>; updateItem: (it: Item) => Promise<void>; removeItem: (id: string) => Promise<void>;
  addLocation: (loc: Location) => Promise<void>; updateLocation: (loc: Location) => Promise<void>; removeLocation: (id: string) => Promise<void>;
  addEvent: (ev: NarrativeEvent) => Promise<void>; updateEvent: (ev: NarrativeEvent) => Promise<void>; removeEvent: (id: string) => Promise<void>;
  addRelation: (rel: Relation) => Promise<void>; updateRelation: (rel: Relation) => Promise<void>; removeRelation: (id: string) => Promise<void>;
  addEra: (e: Era) => Promise<void>; updateEra: (e: Era) => Promise<void>; removeEra: (id: string) => Promise<void>;
  addChapter: (ch: Chapter) => Promise<void>; updateChapter: (ch: Chapter) => Promise<void>; removeChapter: (id: string) => Promise<void>;
  addFaction: (f: Faction) => Promise<void>; updateFaction: (f: Faction) => Promise<void>; removeFaction: (id: string) => Promise<void>;
  addForeshadowing: (fs: Foreshadowing) => Promise<void>; updateForeshadowing: (fs: Foreshadowing) => Promise<void>; removeForeshadowing: (id: string) => Promise<void>;
  addTag: (t: Tag) => Promise<void>; updateTag: (t: Tag) => Promise<void>; removeTag: (id: string) => Promise<void>;
  addWorldSetting: (ws: WorldSetting) => Promise<void>; updateWorldSetting: (ws: WorldSetting) => Promise<void>; removeWorldSetting: (id: string) => Promise<void>;
  addDraftNote: (dn: DraftNote) => Promise<void>; updateDraftNote: (dn: DraftNote) => Promise<void>; removeDraftNote: (id: string) => Promise<void>;
  addPresence: (p: CharacterPresence) => Promise<void>; updatePresence: (p: CharacterPresence) => Promise<void>; removePresence: (id: string) => Promise<void>;
  addBackgroundImage: (bg: BackgroundImage) => Promise<void>; updateBackgroundImage: (bg: BackgroundImage) => Promise<void>; removeBackgroundImage: (id: string) => Promise<void>;
  addCharacterImage: (ci: CharacterImage) => Promise<void>; updateCharacterImage: (ci: CharacterImage) => Promise<void>; removeCharacterImage: (id: string) => Promise<void>;
  modal: ModalState; openModal: (title: string, content: React.ReactNode) => void; closeModal: () => void;
  confirm: ConfirmState; openConfirm: (message: string, onConfirm: () => void, onCancel?: () => void) => void; closeConfirm: () => void;
  selectedItem: SelectedItem | null; setSelectedItem: (item: SelectedItem | null) => void;
  drawerOpen: boolean; setDrawerOpen: (v: boolean) => void;
  timelineValue: number; setTimelineValue: (v: number) => void;
  timelineMin: number; timelineMax: number;
  activeTab: TabType; setActiveTab: (t: TabType) => void;
  zoomLevel: ZoomLevel; setZoomLevel: (z: ZoomLevel) => void;
  searchQuery: string; setSearchQuery: (q: string) => void;
  searchResults: SearchResult[];
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProjectRaw] = useState<Project | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const resetDB = useCallback(() => {
    const req = indexedDB.deleteDatabase('narrative-map-db');
    req.onsuccess = () => window.location.reload();
    req.onerror = () => alert('重置失败，请手动清除浏览器数据');
    req.onblocked = () => { alert('请关闭其他使用该网站的标签页后重试'); window.location.reload(); };
  }, []);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [eras, setEras] = useState<Era[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [factions, setFactions] = useState<Faction[]>([]);
  const [foreshadowings, setForeshadowings] = useState<Foreshadowing[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [worldSettings, setWorldSettings] = useState<WorldSetting[]>([]);
  const [draftNotes, setDraftNotes] = useState<DraftNote[]>([]);
  const [presences, setPresences] = useState<CharacterPresence[]>([]);
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [characterImages, setCharacterImages] = useState<CharacterImage[]>([]);

  const [modal, setModal] = useState<ModalState>({ open: false, title: '', content: null });
  const [confirm, setConfirm] = useState<ConfirmState>({ open: false, message: '', onConfirm: () => {} });
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [timelineValue, setTimelineValue] = useState(Date.now());
  const [timelineMin, setTimelineMin] = useState(Date.now() - 86400000);
  const [timelineMax, setTimelineMax] = useState(Date.now() + 86400000);
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day');
  const [searchQuery, setSearchQuery] = useState('');

  const openModal = useCallback((title: string, content: React.ReactNode) => setModal({ open: true, title, content }), []);
  const closeModal = useCallback(() => setModal(prev => ({ ...prev, open: false })), []);
  const openConfirm = useCallback((message: string, onConfirmFn: () => void, onCancel?: () => void) => {
    setConfirm({ open: true, message, onConfirm: onConfirmFn, onCancel });
  }, []);
  const closeConfirm = useCallback(() => setConfirm(prev => ({ ...prev, open: false })), []);

  const loadProjects = useCallback(async () => {
    const [all, deleted] = await Promise.all([db.getAllProjects(), db.getDeletedProjects()]);
    setProjects(all);
    setDeletedProjects(deleted);
    return all;
  }, []);

  const refreshData = useCallback(async () => {
    if (!currentProject) return;
    const pid = currentProject.id;
    const [chars, its, locs, evs, rels, ers, chaps, facts, fores, tgs, wsets, drafts, pres, bgImgs, charImgs] = await Promise.all([
      db.getCharacters(pid), db.getItems(pid), db.getLocations(pid),
      db.getEvents(pid), db.getRelations(pid), db.getEras(pid),
      db.getChapters(pid), db.getFactions(pid), db.getForeshadowings(pid),
      db.getTags(pid), db.getWorldSettings(pid), db.getDraftNotes(pid), db.getPresences(pid),
      db.getBackgroundImages(pid), db.getCharacterImages(pid),
    ]);
    setCharacters(chars); setItems(its); setLocations(locs); setEvents(evs); setRelations(rels);
    setEras(ers); setChapters(chaps); setFactions(facts); setForeshadowings(fores); setTags(tgs); setWorldSettings(wsets);
    setDraftNotes(drafts); setPresences(pres);
    setBackgroundImages(bgImgs); setCharacterImages(charImgs);
    if (evs.length > 0) {
      const timestamps = evs.map(e => new Date(e.timestamp).getTime());
      const rawMin = Math.min(...timestamps);
      const rawMax = Math.max(...timestamps);
      const padding = Math.max(86400000, (rawMax - rawMin) * 0.1);
      setTimelineMin(rawMin - padding);
      setTimelineMax(rawMax + padding);
      setTimelineValue(rawMax + padding);
    } else {
      const now = Date.now();
      setTimelineMin(now - 86400000); setTimelineMax(now + 86400000); setTimelineValue(now);
    }
  }, [currentProject]);

  const switchProject = useCallback((p: Project) => {
    // Clear all old data before switching
    setCharacters([]); setItems([]); setLocations([]); setEvents([]); setRelations([]);
    setEras([]); setChapters([]); setFactions([]); setForeshadowings([]);
    setTags([]); setWorldSettings([]); setDraftNotes([]); setPresences([]);
    setBackgroundImages([]); setCharacterImages([]);
    setTimelineValue(Date.now());
    setCurrentProjectRaw(p);
    setSelectedItem(null); setDrawerOpen(false);
  }, []);

  const [dbError, setDbError] = useState<string | null>(null);
  useEffect(() => { loadProjects().then(all => { if (all.length > 0 && !currentProject) switchProject(all[0]); }).catch((e: any) => { setDbError('数据库加载失败：' + (e?.message || String(e))); }); }, []);
  useEffect(() => { if (currentProject) refreshData(); }, [currentProject, refreshData]);

  const createProject = useCallback(async (name: string) => {
    const p: Project = { id: db.generateId(), name, createdAt: new Date().toISOString(), backgroundImage: null, deletedAt: null };
    await db.addProject(p);
    setProjects(prev => [...prev, p]);
    switchProject(p);
  }, [switchProject]);

  const updateProject = useCallback(async (p: Project) => {
    await db.updateProject(p);
    setProjects(prev => prev.map(proj => proj.id === p.id ? p : proj));
    if (currentProject?.id === p.id) setCurrentProjectRaw(p);
  }, [currentProject]);

  const softDeleteProject = useCallback(async (id: string) => {
    const proj = projects.find(p => p.id === id) || deletedProjects.find(p => p.id === id);
    if (!proj) return;
    await db.softDeleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setDeletedProjects(prev => [...prev, { ...proj, deletedAt: new Date().toISOString() }]);
    if (currentProject?.id === id) {
      const remaining = projects.filter(p => p.id !== id);
      setCurrentProjectRaw(remaining[0] || null);
      setCharacters([]); setItems([]); setLocations([]); setEvents([]); setRelations([]);
      setEras([]); setChapters([]); setFactions([]); setForeshadowings([]); setTags([]); setWorldSettings([]); setDraftNotes([]); setPresences([]);
      setBackgroundImages([]); setCharacterImages([]);
    }
  }, [currentProject, projects, deletedProjects]);

  const restoreProject = useCallback(async (id: string) => {
    await db.restoreProject(id);
    const proj = deletedProjects.find(p => p.id === id);
    if (proj) {
      setDeletedProjects(prev => prev.filter(p => p.id !== id));
      setProjects(prev => [...prev, { ...proj, deletedAt: null }]);
    }
  }, [deletedProjects]);

  const permanentlyDeleteProject = useCallback(async (id: string) => {
    await db.permanentlyDeleteProject(id);
    setDeletedProjects(prev => prev.filter(p => p.id !== id));
    setProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const archiveProject = useCallback(async (project: Project) => {
    const data = await db.exportProjectData(project.id, project.name);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importArchive = useCallback(async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text);
    const pid = db.generateId();
    const p: Project = { id: pid, name: data.projectName || '导入项目', createdAt: new Date().toISOString(), backgroundImage: data.backgroundImage || null, deletedAt: null };
    await db.addProject(p);
    await db.importProjectData(data, pid);
    setProjects(prev => [...prev, p]);
    switchProject(p);
  }, [switchProject]);

  // Undo/Redo system
  const pushUndo = useCallback((entry: any) => {
    setUndoStack(prev => [...prev.slice(-49), entry]);
    setRedoStack([]);
  }, []);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;
    const entry = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    await entry.undo();
    setRedoStack(prev => [...prev, entry]);
  }, [undoStack]);

  const redo = useCallback(async () => {
    if (redoStack.length === 0) return;
    const entry = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    await entry.do();
    setUndoStack(prev => [...prev, entry]);
  }, [redoStack]);

  // Keyboard handler for undo/redo
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y' || ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [undo, redo]);

  // Simple CRUD (undo is recorded separately by undoableCrud below)
  function makeCrud(addFn: Function, updFn: Function, delFn: Function) {
    return {
      add: async (obj: any) => { await addFn(obj); await refreshData(); },
      update: async (obj: any) => { await updFn(obj); await refreshData(); },
      remove: async (id: string) => { await delFn(id); await refreshData(); },
    };
  }

  const charCrud = makeCrud(db.addCharacter, db.updateCharacter, db.deleteCharacter);
  const itemCrud = makeCrud(db.addItem, db.updateItem, db.deleteItem);
  const locCrud = makeCrud(db.addLocation, db.updateLocation, db.deleteLocation);
  const evCrud = makeCrud(db.addEvent, db.updateEvent, db.deleteEvent);
  const relCrud = makeCrud(db.addRelation, db.updateRelation, db.deleteRelation);
  const eraCrud = makeCrud(db.addEra, db.updateEra, db.deleteEra);
  const chCrud = makeCrud(db.addChapter, db.updateChapter, db.deleteChapter);
  const facCrud = makeCrud(db.addFaction, db.updateFaction, db.deleteFaction);
  const foreCrud = makeCrud(db.addForeshadowing, db.updateForeshadowing, db.deleteForeshadowing);
  const tagCrud = makeCrud(db.addTag, db.updateTag, db.deleteTag);
  const wsCrud = makeCrud(db.addWorldSetting, db.updateWorldSetting, db.deleteWorldSetting);
  const draftCrud = makeCrud(db.addDraftNote, db.updateDraftNote, db.deleteDraftNote);
  const presCrud = makeCrud(db.addPresence, db.updatePresence, db.deletePresence);
  const bgImgCrud = makeCrud(db.addBackgroundImage, db.updateBackgroundImage, db.deleteBackgroundImage);
  const charImgCrud = makeCrud(db.addCharacterImage, db.updateCharacterImage, db.deleteCharacterImage);

  // Search
  const searchResults = useMemo((): SearchResult[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    const match = (text: string) => text.toLowerCase().includes(q);
    for (const c of characters) if (match(c.name) || match(c.bio) || match(c.title)) results.push({ type: 'character', id: c.id, name: c.name, subtitle: c.title || c.bio?.slice(0, 40) || '' });
    for (const it of items) if (match(it.name) || match(it.description)) results.push({ type: 'item', id: it.id, name: it.name, subtitle: it.description?.slice(0, 40) || '' });
    for (const l of locations) if (match(l.name) || match(l.description)) results.push({ type: 'location', id: l.id, name: l.name, subtitle: l.description?.slice(0, 40) || '' });
    for (const ev of events) if (match(ev.title) || match(ev.detail)) results.push({ type: 'event', id: ev.id, name: ev.title, subtitle: ev.detail?.slice(0, 40) || '' });
    for (const f of factions) if (match(f.name) || match(f.description)) results.push({ type: 'faction', id: f.id, name: f.name, subtitle: f.description?.slice(0, 40) || '' });
    for (const ch of chapters) if (match(ch.title) || match(ch.summary)) results.push({ type: 'chapter', id: ch.id, name: `第${ch.number}章 ${ch.title}`, subtitle: ch.summary?.slice(0, 40) || '' });
    for (const e of eras) if (match(e.name)) results.push({ type: 'era', id: e.id, name: e.name, subtitle: `${e.startYear}~${e.endYear ?? '至今'}` });
    return results.slice(0, 50);
  }, [searchQuery, characters, items, locations, events, factions, chapters, eras]);

  const ctx: AppContextType = {
    projects, currentProject, setCurrentProject: switchProject,
    createProject, updateProject, softDeleteProject, restoreProject, permanentlyDeleteProject,
    deletedProjects, archiveProject, importArchive,
    undoStack, redoStack, undo, redo, pushUndo,
    dbError, resetDB,
    characters, items, locations, events, relations,
    eras, chapters, factions, foreshadowings, tags, worldSettings, draftNotes, presences, backgroundImages, characterImages,
    addCharacter: charCrud.add, updateCharacter: charCrud.update, removeCharacter: charCrud.remove,
    addItem: itemCrud.add, updateItem: itemCrud.update, removeItem: itemCrud.remove,
    addLocation: locCrud.add, updateLocation: locCrud.update, removeLocation: locCrud.remove,
    addEvent: evCrud.add, updateEvent: evCrud.update, removeEvent: evCrud.remove,
    addRelation: relCrud.add, updateRelation: relCrud.update, removeRelation: relCrud.remove,
    addEra: eraCrud.add, updateEra: eraCrud.update, removeEra: eraCrud.remove,
    addChapter: chCrud.add, updateChapter: chCrud.update, removeChapter: chCrud.remove,
    addFaction: facCrud.add, updateFaction: facCrud.update, removeFaction: facCrud.remove,
    addForeshadowing: foreCrud.add, updateForeshadowing: foreCrud.update, removeForeshadowing: foreCrud.remove,
    addTag: tagCrud.add, updateTag: tagCrud.update, removeTag: tagCrud.remove,
    addWorldSetting: wsCrud.add, updateWorldSetting: wsCrud.update, removeWorldSetting: wsCrud.remove,
    addDraftNote: draftCrud.add, updateDraftNote: draftCrud.update, removeDraftNote: draftCrud.remove,
    addPresence: presCrud.add, updatePresence: presCrud.update, removePresence: presCrud.remove,
    addBackgroundImage: bgImgCrud.add, updateBackgroundImage: bgImgCrud.update, removeBackgroundImage: bgImgCrud.remove,
    addCharacterImage: charImgCrud.add, updateCharacterImage: charImgCrud.update, removeCharacterImage: charImgCrud.remove,
    modal, openModal, closeModal,
    confirm, openConfirm, closeConfirm,
    selectedItem, setSelectedItem, drawerOpen, setDrawerOpen,
    timelineValue, setTimelineValue, timelineMin, timelineMax,
    activeTab, setActiveTab, zoomLevel, setZoomLevel,
    searchQuery, setSearchQuery, searchResults,
    refreshData,
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
