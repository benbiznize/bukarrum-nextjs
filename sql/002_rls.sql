-- RLS policies

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_tenant_member(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM tenant_members
    WHERE tenant_id = check_tenant_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE VIEW public_tenants AS
SELECT id, slug, name, status, timezone, branding FROM tenants WHERE status = 'active';

GRANT SELECT ON public_tenants TO anon;
GRANT SELECT ON public_tenants TO authenticated;

-- tenants
CREATE POLICY "anon_select_active_tenants" ON tenants FOR SELECT USING (status = 'active');
CREATE POLICY "auth_select_tenant_member" ON tenants FOR SELECT USING (is_tenant_member(id));
CREATE POLICY "auth_update_tenant_member" ON tenants FOR UPDATE USING (is_tenant_member(id));

-- tenant_members
CREATE POLICY "auth_select_own_memberships" ON tenant_members FOR SELECT USING (user_id = auth.uid());

-- rooms: anon can see bookable rooms for active tenants; auth members full access
CREATE POLICY "anon_select_bookable_rooms" ON rooms FOR SELECT USING (
  is_bookable AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = rooms.tenant_id AND t.status = 'active')
);
CREATE POLICY "auth_select_rooms" ON rooms FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "auth_all_rooms" ON rooms FOR ALL USING (is_tenant_member(tenant_id));

-- services
CREATE POLICY "anon_select_published_services" ON services FOR SELECT USING (
  is_published AND EXISTS (SELECT 1 FROM tenants t WHERE t.id = services.tenant_id AND t.status = 'active')
);
CREATE POLICY "auth_select_services" ON services FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "auth_all_services" ON services FOR ALL USING (is_tenant_member(tenant_id));

-- availability_rules
CREATE POLICY "anon_select_rules" ON availability_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants t WHERE t.id = availability_rules.tenant_id AND t.status = 'active')
);
CREATE POLICY "auth_all_rules" ON availability_rules FOR ALL USING (is_tenant_member(tenant_id));

-- availability_exceptions
CREATE POLICY "anon_select_exceptions" ON availability_exceptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM tenants t WHERE t.id = availability_exceptions.tenant_id AND t.status = 'active')
);
CREATE POLICY "auth_all_exceptions" ON availability_exceptions FOR ALL USING (is_tenant_member(tenant_id));

-- bookings: anon can only INSERT with checks; no anon SELECT
CREATE POLICY "anon_insert_booking" ON bookings FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM tenants t WHERE t.id = bookings.tenant_id AND t.status = 'active')
  AND EXISTS (SELECT 1 FROM rooms r WHERE r.id = bookings.room_id AND r.tenant_id = bookings.tenant_id AND r.is_bookable)
  AND EXISTS (SELECT 1 FROM services s WHERE s.id = bookings.service_id AND s.tenant_id = bookings.tenant_id AND s.is_published)
  AND start_at < end_at
);
CREATE POLICY "auth_select_bookings" ON bookings FOR SELECT USING (is_tenant_member(tenant_id));
CREATE POLICY "auth_update_bookings" ON bookings FOR UPDATE USING (is_tenant_member(tenant_id));
