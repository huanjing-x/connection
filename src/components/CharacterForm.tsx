import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { generateId } from '../db';
import TagManager from './TagManager';
import type { Character, CharacterImage } from '../types';

interface Props { character?: Character; onDone: () => void; }

export default function CharacterForm({ character, onDone }: Props) {
  const { currentProject, factions, addCharacter, updateCharacter,
    characterImages, addCharacterImage, updateCharacterImage, removeCharacterImage } = useApp();
  const [name, setName] = useState(character?.name || '');
  const [bio, setBio] = useState(character?.bio || '');
  const [avatarEmoji, setAvatarEmoji] = useState(character?.avatarEmoji || '🧑');
  const [status, setStatus] = useState<string>(character?.status || 'alive');
  const [title, setTitle] = useState(character?.title || '');
  const [motivation, setMotivation] = useState(character?.motivation || '');
  const [arc, setArc] = useState(character?.arc || '');
  const [factionId, setFactionId] = useState(character?.factionId || '');
  const [tagIds, setTagIds] = useState<string[]>(character?.tags || []);
  const imgFileRef = useRef<HTMLInputElement>(null);

  // Filter images belonging to this character
  const charImages = character ? characterImages.filter(ci => ci.characterId === character.id) : [];

  const emojis = ['🧑','👨','👩','🧙','🧙‍♂️','🧙‍♀️','🧝','🧝‍♂️','🧝‍♀️','👑','🐉','🐲','🦸','🦹','🧛','🧛‍♂️','🧛‍♀️','🤴','👸','🗡️','🛡️','🏹','⚔️','🔮','📜','⚗️','🏰','🌙','☀️','⭐','🔥','💧','🌿','💀','🤖','👻','🧚','🧞','🧜','🐺'];

  const handleSubmit = async () => {
    if (!name.trim() || !currentProject) return;
    const c: Character = {
      id: character?.id || generateId(),
      name: name.trim(), bio: bio.trim(), avatarEmoji,
      status: status as Character['status'], title: title.trim(),
      motivation: motivation.trim(), arc: arc.trim(),
      factionId: factionId || null, tags: tagIds,
      pinned: character?.pinned || false,
      projectId: currentProject.id,
    };
    if (character) await updateCharacter(c); else await addCharacter(c);
    onDone();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentProject || !character) return;
    const reader = new FileReader();
    reader.onload = () => {
      addCharacterImage({
        id: generateId(),
        characterId: character.id,
        imageData: reader.result as string,
        startTime: new Date().toISOString(),
        endTime: null,
        description: '',
        projectId: currentProject.id,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-ink-light block mb-1">头像</label>
        <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
          {emojis.map(e => (
            <button key={e} onClick={() => setAvatarEmoji(e)}
              className={`text-xl p-1 rounded hover:bg-parchment-dark ${avatarEmoji === e ? 'bg-accent/20 ring-2 ring-accent' : ''}`}>{e}</button>
          ))}
        </div>
      </div>

      {/* Character Images (only when editing existing character) */}
      {character && (
        <div>
          <label className="text-xs text-ink-light block mb-1">
            🖼️ 角色图片 ({charImages.length})
          </label>
          {charImages.length > 0 && (
            <div className="space-y-2 mb-2 max-h-[200px] overflow-y-auto">
              {[...charImages].sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              ).map(ci => (
                <div key={ci.id} className="flex items-start gap-2 bg-white border border-border rounded p-2">
                  <img src={ci.imageData} className="w-12 h-12 rounded object-cover shrink-0" alt="" />
                  <div className="flex-1 space-y-1">
                    <div className="flex gap-1">
                      <input type="datetime-local" className="input-field text-[10px] py-0.5 flex-1"
                        value={ci.startTime.slice(0, 16)}
                        onChange={e => updateCharacterImage({ ...ci, startTime: new Date(e.target.value).toISOString() })} />
                      <span className="text-[10px] text-ink-light self-center">~</span>
                      <input type="datetime-local" className="input-field text-[10px] py-0.5 flex-1"
                        value={ci.endTime ? ci.endTime.slice(0, 16) : ''}
                        onChange={e => updateCharacterImage({ ...ci, endTime: e.target.value ? new Date(e.target.value).toISOString() : null })} />
                      {ci.endTime && (
                        <button onClick={() => updateCharacterImage({ ...ci, endTime: null })}
                          className="text-[9px] text-accent hover:underline shrink-0">不限</button>
                      )}
                    </div>
                    <input className="input-field text-[10px] py-0.5" placeholder="外观描述（如：长发、身穿铠甲）"
                      value={ci.description}
                      onChange={e => updateCharacterImage({ ...ci, description: e.target.value })} />
                  </div>
                  <button onClick={() => removeCharacterImage(ci.id)}
                    className="text-red-500 hover:text-red-700 text-xs shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => imgFileRef.current?.click()}
            className="w-full btn-secondary text-xs">📁 添加角色图片</button>
          <input ref={imgFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input className="input-field" placeholder="名称 *" value={name} onChange={e => setName(e.target.value)} autoFocus />
        <input className="input-field" placeholder="称号/头衔" value={title} onChange={e => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <select className="input-field text-xs" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="alive">存活</option>
          <option value="dead">死亡</option>
          <option value="missing">失踪</option>
          <option value="unknown">未知</option>
        </select>
        <select className="input-field text-xs" value={factionId} onChange={e => setFactionId(e.target.value)}>
          <option value="">无势力</option>
          {factions.map(f => <option key={f.id} value={f.id}>{f.emblemEmoji} {f.name}</option>)}
        </select>
      </div>
      <textarea className="input-field" placeholder="人物简介/背景" rows={2} value={bio} onChange={e => setBio(e.target.value)} />
      <input className="input-field" placeholder="动机/目标" value={motivation} onChange={e => setMotivation(e.target.value)} />
      <input className="input-field" placeholder="人物弧光（如：从懦弱到勇敢）" value={arc} onChange={e => setArc(e.target.value)} />
      <div>
        <label className="text-xs text-ink-light block mb-1">标签</label>
        <TagManager selectedIds={tagIds} onChange={setTagIds} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onDone} className="btn-secondary">取消</button>
        <button onClick={handleSubmit} disabled={!name.trim()} className="btn-primary disabled:opacity-40">
          {character ? '保存' : '添加'}
        </button>
      </div>
    </div>
  );
}
