import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type {
  Project, Character, Item, Location, NarrativeEvent, Relation,
  Era, Chapter, Faction, Foreshadowing, Tag, WorldSetting, DraftNote,
  CharacterPresence, BackgroundImage, CharacterImage,
} from '../types';

interface NarrativeMapDB extends DBSchema {
  projects: { key: string; value: Project };
  characters: {
    key: string; value: Character;
    indexes: { byProject: string; byFaction: string };
  };
  items: { key: string; value: Item; indexes: { byProject: string } };
  locations: {
    key: string; value: Location;
    indexes: { byProject: string; byFaction: string };
  };
  events: {
    key: string; value: NarrativeEvent;
    indexes: { byProject: string; byEra: string; byChapter: string };
  };
  relations: { key: string; value: Relation; indexes: { byProject: string } };
  eras: { key: string; value: Era; indexes: { byProject: string } };
  chapters: { key: string; value: Chapter; indexes: { byProject: string } };
  factions: { key: string; value: Faction; indexes: { byProject: string } };
  foreshadowings: { key: string; value: Foreshadowing; indexes: { byProject: string } };
  tags: { key: string; value: Tag; indexes: { byProject: string } };
  worldSettings: { key: string; value: WorldSetting; indexes: { byProject: string; byCategory: string } };
  draftNotes: { key: string; value: DraftNote; indexes: { byProject: string } };
  presences: { key: string; value: CharacterPresence; indexes: { byProject: string; byCharacter: string } };
  backgroundImages: { key: string; value: BackgroundImage; indexes: { byProject: string } };
  characterImages: { key: string; value: CharacterImage; indexes: { byProject: string; byCharacter: string } };
}

let dbPromise: Promise<IDBPDatabase<NarrativeMapDB>> | null = null;

function getDB(): Promise<IDBPDatabase<NarrativeMapDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NarrativeMapDB>('narrative-map-db', 4, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        // v1 initial creation
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('characters')) {
            const cs = db.createObjectStore('characters', { keyPath: 'id' });
            cs.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('items')) {
            const is_ = db.createObjectStore('items', { keyPath: 'id' });
            is_.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('locations')) {
            const ls = db.createObjectStore('locations', { keyPath: 'id' });
            ls.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('events')) {
            const es = db.createObjectStore('events', { keyPath: 'id' });
            es.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('relations')) {
            const rs = db.createObjectStore('relations', { keyPath: 'id' });
            rs.createIndex('byProject', 'projectId');
          }
        }
        // v1 -> v2 upgrade
        if (oldVersion < 2) {
          // New stores
          if (!db.objectStoreNames.contains('eras')) {
            const es = db.createObjectStore('eras', { keyPath: 'id' });
            es.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('chapters')) {
            const cs = db.createObjectStore('chapters', { keyPath: 'id' });
            cs.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('factions')) {
            const fs = db.createObjectStore('factions', { keyPath: 'id' });
            fs.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('foreshadowings')) {
            const fs2 = db.createObjectStore('foreshadowings', { keyPath: 'id' });
            fs2.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('tags')) {
            const ts = db.createObjectStore('tags', { keyPath: 'id' });
            ts.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('worldSettings')) {
            const ws = db.createObjectStore('worldSettings', { keyPath: 'id' });
            ws.createIndex('byProject', 'projectId');
            ws.createIndex('byCategory', 'category');
          }
          if (!db.objectStoreNames.contains('draftNotes')) {
            const ds = db.createObjectStore('draftNotes', { keyPath: 'id' });
            ds.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('presences')) {
            const ps = db.createObjectStore('presences', { keyPath: 'id' });
            ps.createIndex('byProject', 'projectId');
            ps.createIndex('byCharacter', 'characterId');
          }
          // New indexes on existing stores (only if created in v1)
          if (db.objectStoreNames.contains('characters')) {
            const charStore = transaction.objectStore('characters');
            if (!charStore.indexNames.contains('byFaction')) charStore.createIndex('byFaction', 'factionId');
          }
          if (db.objectStoreNames.contains('locations')) {
            const locStore = transaction.objectStore('locations');
            if (!locStore.indexNames.contains('byFaction')) locStore.createIndex('byFaction', 'factionId');
          }
          if (db.objectStoreNames.contains('events')) {
            const evStore = transaction.objectStore('events');
            if (!evStore.indexNames.contains('byEra')) evStore.createIndex('byEra', 'eraId');
            if (!evStore.indexNames.contains('byChapter')) evStore.createIndex('byChapter', 'chapterId');
          }
        }
        // v2 -> v3: add draftNotes store
        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('draftNotes')) {
            const ds = db.createObjectStore('draftNotes', { keyPath: 'id' });
            ds.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('presences')) {
            const ps = db.createObjectStore('presences', { keyPath: 'id' });
            ps.createIndex('byProject', 'projectId');
            ps.createIndex('byCharacter', 'characterId');
          }
        }
        // v3 -> v4: add backgroundImages and characterImages stores
        if (oldVersion < 4) {
          if (!db.objectStoreNames.contains('backgroundImages')) {
            const bis = db.createObjectStore('backgroundImages', { keyPath: 'id' });
            bis.createIndex('byProject', 'projectId');
          }
          if (!db.objectStoreNames.contains('characterImages')) {
            const cis = db.createObjectStore('characterImages', { keyPath: 'id' });
            cis.createIndex('byProject', 'projectId');
            cis.createIndex('byCharacter', 'characterId');
          }
        }
      },
    });
  }
  return dbPromise;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ---- Helpers for backward-compatible defaults ----
function fixCharacter(c: any): Character {
  return {
    ...c,
    status: c.status || 'unknown',
    title: c.title || '',
    motivation: c.motivation || '',
    arc: c.arc || '',
    factionId: c.factionId || null,
    tags: c.tags || [],
    pinned: c.pinned || false,
  };
}
function fixItem(it: any): Item {
  return { ...it, tags: it.tags || [] };
}
function fixLocation(loc: any): Location {
  return { ...loc, factionId: loc.factionId || null, tags: loc.tags || [], startTime: loc.startTime || null, endTime: loc.endTime || null };
}
function fixEvent(ev: any): NarrativeEvent {
  return { ...ev, eraId: ev.eraId || null, chapterId: ev.chapterId || null, tags: ev.tags || [] };
}
function fixRelation(rel: any): Relation {
  return { ...rel, targetType: rel.targetType || 'character' };
}
function fixPresence(p: any): CharacterPresence {
  return { ...p, appearanceDescription: p.appearanceDescription || '' };
}

const ALL_STORES = ['characters','items','locations','events','relations','eras','chapters','factions','foreshadowings','tags','worldSettings','draftNotes','presences','backgroundImages','characterImages'] as const;

// ---- Projects ----
export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll('projects');
  return all.filter(p => !p.deletedAt);
}
export async function getDeletedProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll('projects');
  return all.filter(p => p.deletedAt);
}
export async function addProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.add('projects', project);
}
export async function updateProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', project);
}
export async function softDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (project) {
    await db.put('projects', { ...project, deletedAt: new Date().toISOString() });
  }
}
export async function restoreProject(id: string): Promise<void> {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (project) {
    await db.put('projects', { ...project, deletedAt: null });
  }
}
export async function permanentlyDeleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
  for (const store of ALL_STORES) {
    const all = await db.getAll(store);
    for (const item of all) {
      if ((item as any).projectId === id) await db.delete(store, item.id);
    }
  }
}
export async function clearProjectData(projectId: string): Promise<void> {
  const db = await getDB();
  for (const store of ALL_STORES) {
    const all = await db.getAll(store);
    for (const item of all) {
      if ((item as any).projectId === projectId) await db.delete(store, item.id);
    }
  }
}

// ---- Characters ----
export async function getCharacters(projectId: string): Promise<Character[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('characters', 'byProject', projectId);
  return all.map(fixCharacter);
}
export async function addCharacter(c: Character): Promise<void> {
  const db = await getDB();
  await db.add('characters', c);
}
export async function updateCharacter(c: Character): Promise<void> {
  const db = await getDB();
  await db.put('characters', c);
}
export async function deleteCharacter(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('characters', id);
}

// ---- Items ----
export async function getItems(projectId: string): Promise<Item[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('items', 'byProject', projectId);
  return all.map(fixItem);
}
export async function addItem(item: Item): Promise<void> { const db = await getDB(); await db.add('items', item); }
export async function updateItem(item: Item): Promise<void> { const db = await getDB(); await db.put('items', item); }
export async function deleteItem(id: string): Promise<void> { const db = await getDB(); await db.delete('items', id); }

// ---- Locations ----
export async function getLocations(projectId: string): Promise<Location[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('locations', 'byProject', projectId);
  return all.map(fixLocation);
}
export async function addLocation(loc: Location): Promise<void> { const db = await getDB(); await db.add('locations', loc); }
export async function updateLocation(loc: Location): Promise<void> { const db = await getDB(); await db.put('locations', loc); }
export async function deleteLocation(id: string): Promise<void> { const db = await getDB(); await db.delete('locations', id); }

// ---- Events ----
export async function getEvents(projectId: string): Promise<NarrativeEvent[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('events', 'byProject', projectId);
  return all.map(fixEvent);
}
export async function addEvent(ev: NarrativeEvent): Promise<void> { const db = await getDB(); await db.add('events', ev); }
export async function updateEvent(ev: NarrativeEvent): Promise<void> { const db = await getDB(); await db.put('events', ev); }
export async function deleteEvent(id: string): Promise<void> { const db = await getDB(); await db.delete('events', id); }

// ---- Relations ----
export async function getRelations(projectId: string): Promise<Relation[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('relations', 'byProject', projectId);
  return all.map(fixRelation);
}
export async function addRelation(rel: Relation): Promise<void> { const db = await getDB(); await db.add('relations', rel); }
export async function updateRelation(rel: Relation): Promise<void> { const db = await getDB(); await db.put('relations', rel); }
export async function deleteRelation(id: string): Promise<void> { const db = await getDB(); await db.delete('relations', id); }

// ---- Eras ----
export async function getEras(projectId: string): Promise<Era[]> {
  const db = await getDB();
  return db.getAllFromIndex('eras', 'byProject', projectId);
}
export async function addEra(e: Era): Promise<void> { const db = await getDB(); await db.add('eras', e); }
export async function updateEra(e: Era): Promise<void> { const db = await getDB(); await db.put('eras', e); }
export async function deleteEra(id: string): Promise<void> { const db = await getDB(); await db.delete('eras', id); }

// ---- Chapters ----
export async function getChapters(projectId: string): Promise<Chapter[]> {
  const db = await getDB();
  return db.getAllFromIndex('chapters', 'byProject', projectId);
}
export async function addChapter(ch: Chapter): Promise<void> { const db = await getDB(); await db.add('chapters', ch); }
export async function updateChapter(ch: Chapter): Promise<void> { const db = await getDB(); await db.put('chapters', ch); }
export async function deleteChapter(id: string): Promise<void> { const db = await getDB(); await db.delete('chapters', id); }

// ---- Factions ----
export async function getFactions(projectId: string): Promise<Faction[]> {
  const db = await getDB();
  return db.getAllFromIndex('factions', 'byProject', projectId);
}
export async function addFaction(f: Faction): Promise<void> { const db = await getDB(); await db.add('factions', f); }
export async function updateFaction(f: Faction): Promise<void> { const db = await getDB(); await db.put('factions', f); }
export async function deleteFaction(id: string): Promise<void> { const db = await getDB(); await db.delete('factions', id); }

// ---- Foreshadowings ----
export async function getForeshadowings(projectId: string): Promise<Foreshadowing[]> {
  const db = await getDB();
  return db.getAllFromIndex('foreshadowings', 'byProject', projectId);
}
export async function addForeshadowing(fs: Foreshadowing): Promise<void> { const db = await getDB(); await db.add('foreshadowings', fs); }
export async function updateForeshadowing(fs: Foreshadowing): Promise<void> { const db = await getDB(); await db.put('foreshadowings', fs); }
export async function deleteForeshadowing(id: string): Promise<void> { const db = await getDB(); await db.delete('foreshadowings', id); }

// ---- Tags ----
export async function getTags(projectId: string): Promise<Tag[]> {
  const db = await getDB();
  return db.getAllFromIndex('tags', 'byProject', projectId);
}
export async function addTag(t: Tag): Promise<void> { const db = await getDB(); await db.add('tags', t); }
export async function updateTag(t: Tag): Promise<void> { const db = await getDB(); await db.put('tags', t); }
export async function deleteTag(id: string): Promise<void> { const db = await getDB(); await db.delete('tags', id); }

// ---- WorldSettings ----
export async function getWorldSettings(projectId: string): Promise<WorldSetting[]> {
  const db = await getDB();
  return db.getAllFromIndex('worldSettings', 'byProject', projectId);
}
export async function addWorldSetting(ws: WorldSetting): Promise<void> { const db = await getDB(); await db.add('worldSettings', ws); }
export async function updateWorldSetting(ws: WorldSetting): Promise<void> { const db = await getDB(); await db.put('worldSettings', ws); }
export async function deleteWorldSetting(id: string): Promise<void> { const db = await getDB(); await db.delete('worldSettings', id); }

// ---- DraftNotes ----
export async function getDraftNotes(projectId: string): Promise<DraftNote[]> {
  const db = await getDB();
  return db.getAllFromIndex('draftNotes', 'byProject', projectId);
}
export async function addDraftNote(dn: DraftNote): Promise<void> { const db = await getDB(); await db.add('draftNotes', dn); }
export async function updateDraftNote(dn: DraftNote): Promise<void> { const db = await getDB(); await db.put('draftNotes', dn); }
export async function deleteDraftNote(id: string): Promise<void> { const db = await getDB(); await db.delete('draftNotes', id); }

// ---- CharacterPresences ----
export async function getPresences(projectId: string): Promise<CharacterPresence[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('presences', 'byProject', projectId);
  return all.map(fixPresence);
}
export async function getPresencesByCharacter(projectId: string, characterId: string): Promise<CharacterPresence[]> {
  const db = await getDB();
  return db.getAllFromIndex('presences', 'byCharacter', characterId);
}
export async function addPresence(p: CharacterPresence): Promise<void> { const db = await getDB(); await db.add('presences', p); }
export async function updatePresence(p: CharacterPresence): Promise<void> { const db = await getDB(); await db.put('presences', p); }
export async function deletePresence(id: string): Promise<void> { const db = await getDB(); await db.delete('presences', id); }

// ---- BackgroundImages ----
export async function getBackgroundImages(projectId: string): Promise<BackgroundImage[]> {
  const db = await getDB();
  return db.getAllFromIndex('backgroundImages', 'byProject', projectId);
}
export async function addBackgroundImage(bg: BackgroundImage): Promise<void> { const db = await getDB(); await db.add('backgroundImages', bg); }
export async function updateBackgroundImage(bg: BackgroundImage): Promise<void> { const db = await getDB(); await db.put('backgroundImages', bg); }
export async function deleteBackgroundImage(id: string): Promise<void> { const db = await getDB(); await db.delete('backgroundImages', id); }

// ---- CharacterImages ----
export async function getCharacterImages(projectId: string): Promise<CharacterImage[]> {
  const db = await getDB();
  return db.getAllFromIndex('characterImages', 'byProject', projectId);
}
export async function addCharacterImage(ci: CharacterImage): Promise<void> { const db = await getDB(); await db.add('characterImages', ci); }
export async function updateCharacterImage(ci: CharacterImage): Promise<void> { const db = await getDB(); await db.put('characterImages', ci); }
export async function deleteCharacterImage(id: string): Promise<void> { const db = await getDB(); await db.delete('characterImages', id); }

// ---- Export / Import ----
export async function exportProjectData(projectId: string, projectName: string) {
  const [characters, items, locations, events, relations,
    eras, chapters, factions, foreshadowings, tags, worldSettings, draftNotes, presences,
    backgroundImages, characterImages] = await Promise.all([
    getCharacters(projectId), getItems(projectId), getLocations(projectId),
    getEvents(projectId), getRelations(projectId), getEras(projectId),
    getChapters(projectId), getFactions(projectId), getForeshadowings(projectId),
    getTags(projectId), getWorldSettings(projectId), getDraftNotes(projectId),
    getPresences(projectId), getBackgroundImages(projectId), getCharacterImages(projectId),
  ]);
  const strip = (x: any) => { const { projectId: _, ...rest } = x; return rest; };
  return {
    projectName, exportedAt: new Date().toISOString(),
    characters: characters.map(strip), items: items.map(strip),
    locations: locations.map(strip), events: events.map(strip),
    relations: relations.map(strip), eras: eras.map(strip),
    chapters: chapters.map(strip), factions: factions.map(strip),
    foreshadowings: foreshadowings.map(strip), tags: tags.map(strip),
    worldSettings: worldSettings.map(strip),
    draftNotes: draftNotes.map(strip),
    presences: presences.map(strip),
    backgroundImages: backgroundImages.map(strip),
    characterImages: characterImages.map(strip),
  };
}

export async function importProjectData(data: any, targetProjectId: string): Promise<void> {
  const db = await getDB();
  const pid = targetProjectId;
  const tx = db.transaction(ALL_STORES, 'readwrite');
  const addAll = (store: string, items: any[]) => {
    for (const it of items) (tx.objectStore(store as any) as any).add({ ...it, projectId: pid });
  };
  addAll('characters', data.characters || []);
  addAll('items', data.items || []);
  addAll('locations', data.locations || []);
  addAll('events', data.events || []);
  addAll('relations', (data.relations || []).map((r: any) => ({ ...r, targetType: r.targetType || 'character' })));
  addAll('eras', data.eras || []);
  addAll('chapters', data.chapters || []);
  addAll('factions', data.factions || []);
  addAll('foreshadowings', data.foreshadowings || []);
  addAll('tags', data.tags || []);
  addAll('worldSettings', data.worldSettings || []);
  addAll('draftNotes', data.draftNotes || []);
  addAll('presences', (data.presences || []).map((p: any) => ({ ...p, appearanceDescription: p.appearanceDescription || '' })));
  addAll('backgroundImages', data.backgroundImages || []);
  addAll('characterImages', data.characterImages || []);
  await tx.done;
}
