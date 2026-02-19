import { z } from 'zod';

export const bookingSchema = z.object({
  tenantSlug: z.string().min(1),
  roomId: z.string().uuid(),
  serviceId: z.string().uuid(),
  startAt: z.string().datetime(),
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
