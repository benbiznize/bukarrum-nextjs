'use client';

import { useState } from 'react';
import { addAvailabilityRule, deleteAvailabilityRule } from './actions';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type Rule = { id: string; room_id: string | null; day_of_week: number; start_time: string; end_time: string };
type Room = { id: string; name: string };

export default function AvailabilityRulesList({
  tenantId,
  rooms,
  initialRules,
}: {
  tenantId: string;
  rooms: Room[];
  initialRules: Rule[];
}) {
  const [rules, setRules] = useState(initialRules);
  const [adding, setAdding] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('22:00');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await addAvailabilityRule(tenantId, {
        room_id: roomId || null,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });
      setRules((r) => [...r, { ...data, start_time: startTime, end_time: endTime }]);
      setAdding(false);
    } catch {
      alert('Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rule?')) return;
    setLoading(true);
    try {
      await deleteAvailabilityRule(id);
      setRules((r) => r.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="text-blue-600 underline">
          Add rule
        </button>
      ) : (
        <form onSubmit={handleAdd} className="p-4 border rounded flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm mb-1">Room (optional)</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="border rounded px-2 py-1"
            >
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Day</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(parseInt(e.target.value, 10))}
              className="border rounded px-2 py-1"
            >
              {DAY_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setAdding(false)} className="px-3 py-1 border rounded">
            Cancel
          </button>
        </form>
      )}
      <ul className="divide-y">
        {rules.map((r) => (
          <li key={r.id} className="py-2 flex justify-between items-center">
            <span>
              {r.room_id ? rooms.find((x) => x.id === r.room_id)?.name ?? r.room_id : 'All rooms'} — {DAY_NAMES[r.day_of_week]} {r.start_time}–{r.end_time}
            </span>
            <button type="button" onClick={() => handleDelete(r.id)} disabled={loading} className="text-red-600 text-sm underline disabled:opacity-50">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
