'use client';

import { useState } from 'react';
import { addDays, format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

type Room = { id: string; name: string };
type Service = { id: string; name: string; duration_minutes: number; price_clp?: number };

type Props = {
  tenantSlug: string;
  tenantName: string;
  tenantTimezone: string;
  rooms: Room[];
  services: Service[];
};

const DAYS_AHEAD = 14;

export default function BookingForm({ tenantSlug, tenantName, tenantTimezone, rooms, services }: Props) {
  const [roomId, setRoomId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<{ start: string; end: string } | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const dateOptions = Array.from({ length: DAYS_AHEAD }, (_, i) => {
    const d = addDays(new Date(), i);
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE, MMM d') };
  });

  const fetchSlots = async (forDate?: string) => {
    const useDate = forDate ?? date;
    if (!roomId || !serviceId || !useDate) return;
    setLoadingSlots(true);
    setSlots([]);
    setSlot(null);
    try {
      const res = await fetch(
        `/api/availability?tenantSlug=${encodeURIComponent(tenantSlug)}&roomId=${encodeURIComponent(roomId)}&serviceId=${encodeURIComponent(serviceId)}&days=${DAYS_AHEAD}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load slots');
      const dayStart = useDate + 'T00:00:00';
      const dayEnd = useDate + 'T23:59:59';
      const daySlots = (data.slots ?? []).filter(
        (s: { start: string }) => s.start >= dayStart && s.start < dayEnd
      );
      setSlots(daySlots);
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to load slots' });
    } finally {
      setLoadingSlots(false);
    }
  };

  const onDateChange = (val: string) => {
    setDate(val);
    setSlot(null);
    if (roomId && serviceId) fetchSlots(val);
  };

  const onRoomOrServiceChange = () => {
    setDate('');
    setSlot(null);
    setSlots([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slot || !customerName.trim() || !customerEmail.trim()) {
      setMessage({ type: 'error', text: 'Please select a slot and enter name and email.' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          roomId,
          serviceId,
          startAt: slot.start,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setMessage({ type: 'error', text: 'This slot was just taken. Please pick another.' });
        fetchSlots();
        return;
      }
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      const emailSent = data.emailSent === true;
      setMessage({
        type: 'success',
        text: emailSent
          ? `Booked! Confirmation sent to ${customerEmail}.`
          : `Booked! We couldn't send a confirmation email (check spam or save your booking details).`,
      });
      setSlot(null);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotes('');
      fetchSlots();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Booking failed' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Room</label>
        <select
          value={roomId}
          onChange={(e) => { setRoomId(e.target.value); onRoomOrServiceChange(); }}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select room</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Service</label>
        <select
          value={serviceId}
          onChange={(e) => { setServiceId(e.target.value); onRoomOrServiceChange(); }}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <select
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        >
          <option value="">Select date</option>
          {dateOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {date && roomId && serviceId && (
        <div>
          {loadingSlots ? (
            <p className="text-gray-500">Loading times…</p>
          ) : slots.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  key={s.start}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`px-3 py-1.5 rounded border ${slot?.start === s.start ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}
                >
                  {formatInTimeZone(parseISO(s.start), tenantTimezone, 'HH:mm')}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No slots available this day.</p>
          )}
        </div>
      )}

      {slot && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={2}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 text-white py-2 rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </>
      )}

      {message && (
        <p className={message.type === 'error' ? 'text-red-600' : 'text-green-600'}>
          {message.text}
        </p>
      )}
    </form>
  );
}
