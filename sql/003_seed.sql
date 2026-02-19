-- Seed: FOTF Studios demo tenant

INSERT INTO tenants (slug, name, status, timezone, branding)
VALUES ('fotf', 'FOTF Studios', 'active', 'America/Santiago', '{}'::jsonb);

DO $$
DECLARE
  tid UUID;
  rid1 UUID;
  rid2 UUID;
BEGIN
  SELECT id INTO tid FROM tenants WHERE slug = 'fotf';

  INSERT INTO rooms (tenant_id, name, is_bookable) VALUES (tid, 'Room A', true) RETURNING id INTO rid1;
  INSERT INTO rooms (tenant_id, name, is_bookable) VALUES (tid, 'Room B', true) RETURNING id INTO rid2;

  INSERT INTO services (tenant_id, name, duration_minutes, buffer_minutes, price_clp, is_published)
  VALUES (tid, '1h Session', 60, 0, 20000, true);
  INSERT INTO services (tenant_id, name, duration_minutes, buffer_minutes, price_clp, is_published)
  VALUES (tid, '2h Session', 120, 0, 35000, true);

  -- Mon-Fri 10:00-22:00 (room_id null = all rooms)
  INSERT INTO availability_rules (tenant_id, room_id, day_of_week, start_time, end_time)
  SELECT tid, NULL, d, '10:00'::time, '22:00'::time FROM generate_series(1, 5) AS d;
  -- Sat-Sun 12:00-22:00
  INSERT INTO availability_rules (tenant_id, room_id, day_of_week, start_time, end_time)
  VALUES (tid, NULL, 6, '12:00'::time, '22:00'::time), (tid, NULL, 0, '12:00'::time, '22:00'::time);
END $$;
