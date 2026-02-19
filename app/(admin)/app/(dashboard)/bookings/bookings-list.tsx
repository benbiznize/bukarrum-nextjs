'use client';

import { useState } from 'react';
import { cancelBooking } from './actions';
import { format, parseISO } from 'date-fns';

type Booking = {
  id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_email: string;
  status: string;
  room_name: string;
  service_name: string;
};

export default function BookingsList({ initialBookings }: { initialBookings: Booking[] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [loading, setLoading] = useState(false);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    setLoading(true);
    try {
      await cancelBooking(id);
      setBookings((b) => b.map((x) => (x.id === id ? { ...x, status: 'canceled' } : x)));
    } catch {
      alert('Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ul className="divide-y">
      {bookings.map((b) => (
        <li key={b.id} className="py-3 flex justify-between items-start gap-4">
          <div>
            <p className="font-medium">{b.room_name} — {b.service_name}</p>
            <p className="text-sm text-gray-600">
              {format(parseISO(b.start_at), 'PPp')} – {format(parseISO(b.end_at), 'p')}
            </p>
            <p className="text-sm">{b.customer_name} &lt;{b.customer_email}&gt;</p>
            {b.status === 'canceled' && <p className="text-sm text-red-600">Canceled</p>}
          </div>
          {b.status !== 'canceled' && (
            <button
              type="button"
              onClick={() => handleCancel(b.id)}
              disabled={loading}
              className="text-red-600 text-sm underline disabled:opacity-50 shrink-0"
            >
              Cancel
            </button>
          )}
        </li>
      ))}
      {bookings.length === 0 && <p className="text-gray-500">No upcoming bookings.</p>}
    </ul>
  );
}
