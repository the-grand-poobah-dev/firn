import {z} from 'zod';
const amount=z.number().finite().min(1).max(100000).refine(v=>Math.abs(v*100-Math.round(v*100))<1e-7,'Use no more than two decimal places.');
export const walletDepositSchema=z.object({amount,method:z.enum(['mpesa','card','bank','crypto']),phone:z.string().trim().min(8).max(18).optional()}).superRefine((v,c)=>{if(v.method==='mpesa'&&!v.phone)c.addIssue({code:z.ZodIssueCode.custom,path:['phone'],message:'Enter the M-Pesa phone number.'});});
export const walletWithdrawSchema=z.object({amount,destination:z.string().trim().min(5).max(160)});
export const walletCurrencySchema=z.object({currency:z.enum(['USD','KES'])});
export type WalletDepositInput=z.infer<typeof walletDepositSchema>;