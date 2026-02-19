import { addMinutes, setHours, setMinutes, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import { createAdminClient } from '@/lib/supabase/admin';

const SLOT_INTERVAL_MINUTES = 30;

type OpenWindow = { start: Date; end: Date };

function parseTime(t: string | null): [number, number] {
  if (!t) return [0, 0];
  const parts = t.toString().split(':');
  return [parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0];
}

function getDayOfWeek(d: Date): number {
  const n = d.getDay();
  return n === 0 ? 0 : n;
}

function* dateStringsBetween(start: string, end: string): Generator<string> {
  const s = parseISO(start + 'T00:00:00.000Z');
  const e = parseISO(end + 'T00:00:00.000Z');
  const curr = new Date(s);
  while (curr <= e) {
    yield curr.toISOString().slice(0, 10);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
}

export async function generateSlots(
  tenantId: string,
  tenantTimezone: string,
  roomId: string,
  serviceId: string,
  dateRangeStart: string,
  dateRangeEnd: string
): Promise<{ start: string; end: string }[]> {
  const supabase = createAdminClient();
  const rangeStart = parseISO(dateRangeStart);
  const rangeEnd = parseISO(dateRangeEnd);

  const [{ data: service }, { data: rules }, { data: exceptions }, { data: bookings }] = await Promise.all([
    supabase.from('services').select('duration_minutes, buffer_minutes').eq('id', serviceId).single(),
    supabase.from('availability_rules').select('day_of_week, start_time, end_time, room_id').eq('tenant_id', tenantId),
    supabase
      .from('availability_exceptions')
      .select('room_id, date, is_closed, start_time, end_time')
      .eq('tenant_id', tenantId)
      .gte('date', dateRangeStart.slice(0, 10))
      .lte('date', dateRangeEnd.slice(0, 10)),
    supabase
      .from('bookings')
      .select('start_at, end_at')
      .eq('room_id', roomId)
      .eq('status', 'confirmed')
      .lt('start_at', dateRangeEnd)
      .gt('end_at', dateRangeStart),
  ]);

  if (!service) return [];
  const duration = service.duration_minutes + (service.buffer_minutes ?? 0);
  const rulesList = rules ?? [];
  const exceptionsList = exceptions ?? [];
  const bookedRanges = (bookings ?? []).map((b) => ({ start: new Date(b.start_at), end: new Date(b.end_at) }));

  const slots: { start: string; end: string }[] = [];
  const startDateStr = dateRangeStart.slice(0, 10);
  const endDateStr = dateRangeEnd.slice(0, 10);

  for (const dateStr of dateStringsBetween(startDateStr, endDateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dayStart = fromZonedTime(new Date(y, m - 1, d, 0, 0, 0), tenantTimezone);
    const dayOfWeek = getDayOfWeek(dayStart);
    const dayRules = rulesList.filter(
      (r) => r.day_of_week === dayOfWeek && (r.room_id == null || r.room_id === roomId)
    );
    const dayExceptions = exceptionsList.filter(
      (e) => e.date === dateStr && (e.room_id == null || e.room_id === roomId)
    );

    let windows: OpenWindow[] = [];
    const closedAllDay = dayExceptions.some((e) => e.is_closed && e.start_time == null && e.end_time == null);
    if (closedAllDay) {
      windows = [];
    } else if (dayExceptions.length > 0) {
      for (const ex of dayExceptions) {
        if (ex.is_closed) continue;
        const [sh, sm] = parseTime(ex.start_time ?? '00:00');
        const [eh, em] = parseTime(ex.end_time ?? '23:59');
        windows.push({
          start: fromZonedTime(setMinutes(setHours(dayStart, sh), sm), tenantTimezone),
          end: fromZonedTime(setMinutes(setHours(dayStart, eh), em), tenantTimezone),
        });
      }
    } else {
      for (const r of dayRules) {
        const [sh, sm] = parseTime(r.start_time);
        const [eh, em] = parseTime(r.end_time);
        windows.push({
          start: fromZonedTime(setMinutes(setHours(dayStart, sh), sm), tenantTimezone),
          end: fromZonedTime(setMinutes(setHours(dayStart, eh), em), tenantTimezone),
        });
      }
    }

    for (const w of windows) {
      let slotStart = new Date(w.start);
      while (addMinutes(slotStart, duration) <= w.end) {
        if (slotStart >= rangeStart && addMinutes(slotStart, service.duration_minutes) <= rangeEnd) {
          const slotEnd = addMinutes(slotStart, service.duration_minutes);
          const slotEndWithBuffer = addMinutes(slotStart, duration);
          const overlaps = bookedRanges.some(
            (b) => slotStart < b.end && slotEndWithBuffer > b.start
          );
          if (!overlaps) {
            slots.push({
              start: slotStart.toISOString(),
              end: slotEnd.toISOString(),
            });
          }
        }
        slotStart = addMinutes(slotStart, SLOT_INTERVAL_MINUTES);
      }
    }

  }

  return slots;
}
