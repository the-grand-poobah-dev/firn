import { z } from 'zod';
export const emailSchema = z.string().email();
export const savingsAmountSchema = z.number().finite().min(500);
