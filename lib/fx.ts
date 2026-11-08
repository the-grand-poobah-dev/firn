export const FX_RATES={USD:1,CHF:.88,EUR:.92,KES:135,AED:3.6725} as const;
export type Currency=keyof typeof FX_RATES;
export function convertFromUsd(n:number,c:Currency){return n*FX_RATES[c];}
export function formatCurrency(n:number,c:Currency='USD'){return new Intl.NumberFormat(c==='KES'?'en-KE':'en-US',{style:'currency',currency:c,minimumFractionDigits:c==='KES'?0:2,maximumFractionDigits:c==='KES'?0:2}).format(convertFromUsd(n,c));}
export function isCurrency(v:unknown):v is Currency{return typeof v==='string'&&Object.prototype.hasOwnProperty.call(FX_RATES,v);}