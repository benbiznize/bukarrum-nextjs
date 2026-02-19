'use client';

import { useState } from 'react';
import { addAvailabilityException, deleteAvailabilityException } from './actions';

type Exception = {
  id: string;
  room_id: string | null;
  date: string;
  is_closed: boolean;
  start_time: string | null;
  end_time: string | null;
};
type Room = { id: string; name: string };

export default function AvailabilityExceptionsList({
  tenantId,
  rooms,
  initialExceptions,
}: {
  tenantId: string;
  rooms: Room[];
  initialExceptions: Exception[];
}) {
  const [exceptions, setExceptions] = useState(initialExceptions);
  const [adding, setAdding] = useState(false);
  const [roomId, setRoomId] = useState<string>('');
  const [date, setDate] = useState('');
  const [isClosed, setIsClosed] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    setLoading(true);
    try {
      const data = await addAvailabilityException(tenantId, {
        room_id: roomId || null,
        date,
        is_closed: isClosed,
        start_time: startTime || undefined,
        end_time: endTime || undefined,
      });
      setExceptions((ex) => [...ex, { ...data, start_time: startTime || null, end_time: endTime || null }]);
      setAdding(false);
    } catch {
      alert('Failed to add exception');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exception?')) return;
    setLoading(true);
    try {
      await deleteAvailabilityException(id);
      setExceptions((ex) => ex.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete exception');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="text-blue-600 underline">
          Add exception
        </button>
      ) : (
        <form onSubmit={handleAdd} className="p-4 border rounded flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm mb-1">Room (optional)</label>
            <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className="border rounded px-2 py-1">
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded px-2 py-1" required />
          </div>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={isClosed} onChange={(e) => setIsClosed(e.target.checked)} />
            Closed
          </label>
          {!isClosed && (
            <>
              <div>
                <label className="block text-sm mb-1">Start</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border rounded px-2 py-1" />
              </div>
              <div>
                <label className="block text-sm mb-1">End</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border rounded px-2 py-1" />
              </div>
            </>
          )}
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => setAdding(false)} className="px-3 py-1 border rounded">
            Cancel
          </button>
        </form>
      )}
      <ul className="divide-y">
        {exceptions.map((e) => (
          <li key={e.id} className="py-2 flex justify-between items-center">
            <span>
              {e.room_id ? rooms.find((x) => x.id === e.room_id)?.name ?? e.room_id : 'All rooms'} — {e.date}
              {e.is_closed ? ' (closed)' : ` ${e.start_time ?? '?'}–${e.end_time ?? '?'}`}
            </span>
            <button type="button" onClick={() => handleDelete(e.id)} disabled={loading} className="text-red-600 text-sm underline disabled:opacity-50">
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
