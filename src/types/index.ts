export interface Project {
  id: string;
  name: string;
  createdAt: string;
  backgroundImage: string | null;
  deletedAt: string | null;
}

export interface Character {
  id: string;
  name: string;
  bio: string;
  avatarEmoji: string;
  status: 'alive' | 'dead' | 'missing' | 'unknown';
  title: string;
  motivation: string;
  arc: string;
  factionId: string | null;
  tags: string[];
  pinned: boolean;
  projectId: string;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  ownerId: string | null;
  tags: string[];
  projectId: string;
}

export interface Location {
  id: string;
  name: string;
  description: string;
  x: number;
  y: number;
  factionId: string | null;
  tags: string[];
  startTime: string | null;
  endTime: string | null;
  projectId: string;
}

export interface NarrativeEvent {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  locationId: string;
  characterIds: string[];
  itemIds: string[];
  eraId: string | null;
  chapterId: string | null;
  tags: string[];
  projectId: string;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  targetType: 'character' | 'item' | 'location' | 'faction';
  relationType: string;
  projectId: string;
}

export interface Era {
  id: string;
  name: string;
  startYear: number;
  endYear: number | null;
  color: string;
  projectId: string;
}

export interface Chapter {
  id: string;
  title: string;
  number: number;
  summary: string;
  status: 'planning' | 'writing' | 'done';
  projectId: string;
}

export interface Faction {
  id: string;
  name: string;
  description: string;
  leaderId: string | null;
  emblemEmoji: string;
  color: string;
  projectId: string;
}

export interface Foreshadowing {
  id: string;
  description: string;
  plantedEventId: string;
  revealedEventId: string | null;
  status: 'planted' | 'revealed';
  projectId: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  projectId: string;
}

export interface WorldSetting {
  id: string;
  category: string;
  key: string;
  value: string;
  projectId: string;
}

export interface DraftNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
}

export interface CharacterPresence {
  id: string;
  characterId: string;
  locationId: string;
  startTime: string;
  endTime: string | null;
  appearanceDescription: string;
  projectId: string;
}

export interface BackgroundImage {
  id: string;
  projectId: string;
  imageData: string;
  startTime: string;
  endTime: string | null;
}

export interface CharacterImage {
  id: string;
  characterId: string;
  imageData: string;
  startTime: string;
  endTime: string | null;
  description: string;
  projectId: string;
}

export interface ArchiveData {
  projectName: string;
  exportedAt: string;
  characters: Omit<Character, 'projectId'>[];
  items: Omit<Item, 'projectId'>[];
  locations: Omit<Location, 'projectId'>[];
  events: Omit<NarrativeEvent, 'projectId'>[];
  relations: Omit<Relation, 'projectId'>[];
  eras: Omit<Era, 'projectId'>[];
  chapters: Omit<Chapter, 'projectId'>[];
  factions: Omit<Faction, 'projectId'>[];
  foreshadowings: Omit<Foreshadowing, 'projectId'>[];
  tags: Omit<Tag, 'projectId'>[];
  worldSettings: Omit<WorldSetting, 'projectId'>[];
  draftNotes: Omit<DraftNote, 'projectId'>[];
  presences: Omit<CharacterPresence, 'projectId'>[];
  backgroundImages: Omit<BackgroundImage, 'projectId'>[];
  characterImages: Omit<CharacterImage, 'projectId'>[];
}
