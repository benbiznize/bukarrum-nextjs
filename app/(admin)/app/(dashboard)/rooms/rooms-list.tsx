'use client';

import { useState } from 'react';
import { addRoom, deleteRoom } from './actions';

type Room = { id: string; name: string; is_bookable: boolean };

export default function RoomsList({ tenantId, initialRooms }: { tenantId: string; initialRooms: Room[] }) {
  const [rooms, setRooms] = useState(initialRooms);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [isBookable, setIsBookable] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await addRoom(tenantId, name.trim(), isBookable);
      setRooms((r) => [...r, data]);
      setName('');
      setAdding(false);
    } catch {
      alert('Failed to add room');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this room?')) return;
    setLoading(true);
    try {
      await deleteRoom(id);
      setRooms((r) => r.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="text-blue-600 underline"
        >
          Add room
        </button>
      ) : (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2 p-4 border rounded">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded px-2 py-1"
              required
            />
          </div>
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
            />
            Bookable
          </label>
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
            Save
          </button>
          <button type="button" onClick={() => { setAdding(false); setName(''); }} className="px-3 py-1 border rounded">
            Cancel
          </button>
        </form>
      )}
      <ul className="divide-y">
        {rooms.map((r) => (
          <li key={r.id} className="py-2 flex justify-between items-center">
            <span>{r.name} {!r.is_bookable && '(not bookable)'}</span>
            <button
              type="button"
              onClick={() => handleDelete(r.id)}
              disabled={loading}
              className="text-red-600 text-sm underline disabled:opacity-50"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
