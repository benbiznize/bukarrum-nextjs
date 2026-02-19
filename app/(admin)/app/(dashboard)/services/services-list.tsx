'use client';

import { useState } from 'react';
import { addService, deleteService } from './actions';

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  buffer_minutes: number;
  price_clp: number;
  is_published: boolean;
};

export default function ServicesList({
  tenantId,
  initialServices,
}: {
  tenantId: string;
  initialServices: Service[];
}) {
  const [services, setServices] = useState(initialServices);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(60);
  const [buffer, setBuffer] = useState(0);
  const [price, setPrice] = useState(0);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const data = await addService(tenantId, {
        name: name.trim(),
        duration_minutes: duration,
        buffer_minutes: buffer,
        price_clp: price,
        is_published: published,
      });
      setServices((s) => [...s, data]);
      setName('');
      setDuration(60);
      setBuffer(0);
      setPrice(0);
      setAdding(false);
    } catch {
      alert('Failed to add service');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    setLoading(true);
    try {
      await deleteService(id);
      setServices((s) => s.filter((x) => x.id !== id));
    } catch {
      alert('Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!adding ? (
        <button type="button" onClick={() => setAdding(true)} className="text-blue-600 underline">
          Add service
        </button>
      ) : (
        <form onSubmit={handleAdd} className="p-4 border rounded space-y-2 max-w-md">
          <div>
            <label className="block text-sm mb-1">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div className="flex gap-4">
            <div>
              <label className="block text-sm mb-1">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 0)}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Buffer (min)</label>
              <input
                type="number"
                min={0}
                value={buffer}
                onChange={(e) => setBuffer(parseInt(e.target.value, 10) || 0)}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Price (CLP)</label>
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(parseInt(e.target.value, 10) || 0)}
                className="border rounded px-2 py-1 w-24"
              />
            </div>
          </div>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            Published
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">
              Save
            </button>
            <button type="button" onClick={() => setAdding(false)} className="px-3 py-1 border rounded">
              Cancel
            </button>
          </div>
        </form>
      )}
      <ul className="divide-y">
        {services.map((s) => (
          <li key={s.id} className="py-2 flex justify-between items-center">
            <span>
              {s.name} — {s.duration_minutes}min {s.buffer_minutes ? `+${s.buffer_minutes} buffer` : ''} — {s.price_clp} CLP
              {!s.is_published && ' (unpublished)'}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(s.id)}
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
