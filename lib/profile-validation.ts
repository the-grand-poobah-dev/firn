import { z } from 'zod';

const prefsSchema = z.object({
  app_lock_enabled: z.boolean().optional(),
  confirm_withdrawals: z.boolean().optional(),
  withdrawal_email_alerts: z.boolean().optional(),
  daily_interest_summary: z.boolean().optional(),
  property_updates: z.boolean().optional(),
  maturity_reminders: z.boolean().optional(),
  market_news: z.boolean().optional(),
  offers: z.boolean().optional(),
  appearance: z.enum(['system','dark','light']).optional(),
}).strict();

export const profilePatchSchema = z.object({
  full_name: z.string().trim().min(2).max(100).optional(),
  country: z.string().trim().min(2).max(80).optional(),
  currency: z.enum(['USD','KES']).optional(),
  prefs: prefsSchema.optional(),
}).strict().refine(v => Object.keys(v).length > 0, 'Provide at least one profile field.');
