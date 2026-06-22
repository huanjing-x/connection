import { useApp } from '../context/AppContext';
import EventForm from './EventForm';

function setYear(ts: number, y: number): number { const d = new Date(ts); d.setFullYear(y); return d.getTime(); }
function setMonth(ts: number, m: number): number { const d = new Date(ts); d.setMonth(m); return d.getTime(); }
function setDate_(ts: number, day: number): number { const d = new Date(ts); d.setDate(day); return d.getTime(); }
function addYears(ts: number, n: number): number { const d = new Date(ts); d.setFullYear(d.getFullYear() + n); return d.getTime(); }
function addMonths(ts: number, n: number): number { const d = new Date(ts); d.setMonth(d.getMonth() + n); return d.getTime(); }
function addDays(ts: number, n: number): number { return ts + n * 86400000; }

export default function Timeline() {
  const {
    timelineValue, setTimelineValue, timelineMin, timelineMax,
    events, eras, zoomLevel, setZoomLevel,
    openModal, closeModal,
  } = useApp();

  if (events.length === 0) return null;

  const visibleCount = events.filter(e => new Date(e.timestamp).getTime() <= timelineValue).length;
  const d = new Date(timelineValue);

  const clamp = (ts: number) => Math.max(timelineMin, Math.min(timelineMax, ts));

  const currentEra = eras.find(e => d.getFullYear() >= e.startYear && (e.endYear == null || d.getFullYear() <= e.endYear));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-parchment-dark/95 border-t-2 border-border backdrop-blur-sm">
      {/* Row 1: Slider + quick nav */}
      <div className="max-w-full px-4 pt-1.5 pb-0.5 flex items-center gap-2">
        <span className="text-[10px] whitespace-nowrap shrink-0 min-w-[90px]">
          {currentEra ? (
            <span className="flex items-center gap-1 font-bold text-ink">
              <span className="w-2 h-2 rounded-full border border-white/30" style={{ backgroundColor: currentEra.color }} />
              <span className="truncate max-w-[80px]">{currentEra.name}</span>
            </span>
          ) : <span className="text-ink-light">⏳ 公历</span>}
        </span>

        <button onClick={() => setTimelineValue(timelineMin)} className="text-[10px] btn-secondary py-0.5 px-1" title="最早">◀◀</button>
        <button onClick={() => setTimelineValue(clamp(addYears(timelineValue, -1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="后退一年">−年</button>
        <button onClick={() => setTimelineValue(clamp(addMonths(timelineValue, -1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="后退一月">−月</button>
        <button onClick={() => setTimelineValue(clamp(addDays(timelineValue, -1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="后退一天">−日</button>

        <input type="range" className="timeline-slider flex-1" min={timelineMin} max={timelineMax} value={timelineValue}
          onChange={e => setTimelineValue(Number(e.target.value))} />

        <button onClick={() => setTimelineValue(clamp(addDays(timelineValue, 1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="前进一天">+日</button>
        <button onClick={() => setTimelineValue(clamp(addMonths(timelineValue, 1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="前进一月">+月</button>
        <button onClick={() => setTimelineValue(clamp(addYears(timelineValue, 1)))} className="text-[10px] btn-secondary py-0.5 px-1.5" title="前进一年">+年</button>
        <button onClick={() => setTimelineValue(timelineMax)} className="text-[10px] btn-secondary py-0.5 px-1" title="最晚">▶▶</button>

        <span className="text-[10px] text-ink-light whitespace-nowrap shrink-0">{visibleCount}/{events.length}</span>
        <button onClick={() => openModal('添加事件', <EventForm onDone={closeModal} presetTimestamp={new Date(timelineValue).toISOString()} />)}
          className="text-[10px] btn-primary py-0.5 px-2 shrink-0">+事件</button>
      </div>

      {/* Row 2: Year / Month / Day direct input */}
      <div className="max-w-full px-4 pb-1.5 flex items-center gap-2">
        <span className="text-[10px] text-ink-light shrink-0">跳转：</span>

        {/* Year */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setTimelineValue(clamp(addYears(timelineValue, -1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">◀</button>
          <input type="number" className="text-[10px] bg-parchment-light border border-border rounded px-1.5 py-0.5 w-16 text-center font-bold"
            value={d.getFullYear()} min={1}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) setTimelineValue(clamp(setYear(timelineValue, v))); }} />
          <button onClick={() => setTimelineValue(clamp(addYears(timelineValue, 1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">▶</button>
          <span className="text-[10px] text-ink-light">年</span>
        </div>

        {/* Month */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setTimelineValue(clamp(addMonths(timelineValue, -1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">◀</button>
          <input type="number" className="text-[10px] bg-parchment-light border border-border rounded px-1.5 py-0.5 w-12 text-center font-bold"
            value={d.getMonth() + 1} min={1} max={12}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 12) setTimelineValue(clamp(setMonth(timelineValue, v - 1))); }} />
          <button onClick={() => setTimelineValue(clamp(addMonths(timelineValue, 1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">▶</button>
          <span className="text-[10px] text-ink-light">月</span>
        </div>

        {/* Day */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button onClick={() => setTimelineValue(clamp(addDays(timelineValue, -1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">◀</button>
          <input type="number" className="text-[10px] bg-parchment-light border border-border rounded px-1.5 py-0.5 w-12 text-center font-bold"
            value={d.getDate()} min={1} max={31}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v >= 1 && v <= 31) setTimelineValue(clamp(setDate_(timelineValue, v))); }} />
          <button onClick={() => setTimelineValue(clamp(addDays(timelineValue, 1)))} className="text-[9px] btn-secondary py-0.5 px-1 leading-none">▶</button>
          <span className="text-[10px] text-ink-light">日</span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-[10px] text-ink-light">{String(d.getHours()).padStart(2,'0')}:{String(d.getMinutes()).padStart(2,'0')}</span>
        </div>

        <div className="flex-1" />

        {/* Quick presets */}
        <button onClick={() => setTimelineValue(timelineMin)} className="text-[9px] btn-secondary py-0.5 px-1.5 shrink-0">最早</button>
        <button onClick={() => setTimelineValue(Date.now())} className="text-[9px] btn-secondary py-0.5 px-1.5 shrink-0">今天</button>
        <button onClick={() => setTimelineValue(timelineMax)} className="text-[9px] btn-secondary py-0.5 px-1.5 shrink-0">最晚</button>

        <select className="text-[9px] bg-parchment-light border border-border rounded px-1 py-0.5 shrink-0" value={zoomLevel} onChange={e => setZoomLevel(e.target.value as any)}>
          <option value="day">按日</option>
          <option value="month">按月</option>
          <option value="year">按年</option>
        </select>
      </div>
    </div>
  );
}
