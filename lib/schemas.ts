import { z } from 'zod';

export const signupSchema=z.object({fullName:z.string().trim().min(2,'Enter your full name.').max(100),email:z.string().trim().email('Enter a valid email address.'),password:z.string().min(10,'Use at least 10 characters.').max(128),country:z.string().min(2,'Choose your country.'),adult:z.literal('yes',{error:'You must confirm that you are 18 or older.'}),terms:z.literal('yes',{error:'Please accept the Terms to continue.'})});
export const profileSchema=z.object({goals:z.array(z.string()).min(1,'Choose at least one savings goal.'),lockPref:z.enum(['6 months','12 months','Both']),riskLevel:z.number().int().min(1).max(5)});
export const emailSchema=z.string().email();
export const savingsAmountSchema=z.number().finite().min(500);

export const PlanCodeSchema = z.enum(['six', 'twelve']);
export const CreatePositionInput = z.object({ plan: PlanCodeSchema, amount: z.number().finite().min(500).max(100000).refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-7, 'Use no more than two decimal places.') });
export const DepositInput = z.object({ amount: z.number().finite().positive().max(100000), method: z.enum(['mpesa', 'card', 'bank']) });
export const WithdrawInput = z.object({ amount: z.number().finite().positive() });
export const AutoRollInput = z.object({ auto_roll: z.enum(['ask', 'renew', 'withdraw', 'renew_twelve']) });
export type CreatePositionInput = z.infer<typeof CreatePositionInput>;
export type DepositInput = z.infer<typeof DepositInput>;
export type WithdrawInput = z.infer<typeof WithdrawInput>;
export type AutoRollInput = z.infer<typeof AutoRollInput>;
