export const USD_TO_KES = 135;
export const USDT_TO_USD = 1;
// Deposit verification supports manually reviewed transfers from 10 USDT upward.
export const MIN_USDT_DEPOSIT = 10;
export const FX_RATES={USD:1,KES:USD_TO_KES} as const;
export type Currency=keyof typeof FX_RATES;
export function convertFromUsd(n:number,c:Currency){return n*FX_RATES[c];}
export function formatCurrency(n:number,c:Currency='USD',decimals=c==='KES'?0:2){return new Intl.NumberFormat(c==='KES'?'en-KE':'en-US',{style:'currency',currency:c,minimumFractionDigits:decimals,maximumFractionDigits:decimals}).format(convertFromUsd(n,c));}
export function usdtToUsd(amount:number){return amount*USDT_TO_USD;}
export function usdtToKes(amount:number){return usdtToUsd(amount)*USD_TO_KES;}
export function isCurrency(v:unknown):v is Currency{return typeof v==='string'&&Object.prototype.hasOwnProperty.call(FX_RATES,v);}