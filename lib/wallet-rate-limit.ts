const buckets=new Map<string,number[]>();
export function allowWalletWrite(id:string,now=Date.now()){const a=(buckets.get(id)||[]).filter(t=>now-t<60000);if(a.length>=10){buckets.set(id,a);return false;}a.push(now);buckets.set(id,a);return true;}
/** Per-process limiter only; Vercel instances do not share this memory. */
