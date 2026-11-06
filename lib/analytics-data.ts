import 'server-only';import {createClient} from '@/lib/supabase/server';import {blendedApy,roiTable} from '@/lib/finance';import {aggregateDaily,aggregateMonthly,allocateEarnedByProperty,aggregateCountries,type Daily} from '@/lib/analytics';
export type AnalyticsRange='30d'|'90d'|'all';
export async function getAnalytics(range:AnalyticsRange='30d'){
 const db=await createClient(),{data:{user},error:a}=await db.auth.getUser();if(a||!user)throw new Error('Sign in to view analytics.');
 const [d,p,props]=await Promise.all([db.from('portfolio_daily').select('accrual_date,profit,balance').eq('user_id',user.id).order('accrual_date'),db.from('positions_live').select('id,plan,principal,apy,earned,value,started_on,matures_on').eq('user_id',user.id),db.from('properties').select('slug,name,city,country,target_return').eq('is_active',true)]);
 if(d.error)throw d.error;if(p.error)throw p.error;if(props.error)throw props.error;
 let rows=aggregateDaily((d.data??[]).filter(x=>x.accrual_date).map(x=>({date:String(x.accrual_date),profit:Number(x.profit??0),balance:Number(x.balance??0)})) as Daily[]);
 if(range!=='all'){const start=new Date();start.setUTCHours(0,0,0,0);start.setUTCDate(start.getUTCDate()-(range==='30d'?29:89));const min=start.toISOString().slice(0,10);rows=rows.filter(x=>x.date>=min)}
 const positions=(p.data??[]).map(x=>({id:String(x.id),plan:x.plan as 'six'|'twelve',principal:Number(x.principal??0),apy:Number(x.apy??0),earned:Number(x.earned??0),value:Number(x.value??0),startedOn:String(x.started_on??''),maturesOn:String(x.matures_on??'')}));
 const principal=positions.reduce((s,x)=>s+x.principal,0),value=positions.reduce((s,x)=>s+x.value,0),earned=positions.reduce((s,x)=>s+x.earned,0),apy=blendedApy(positions.map(x=>({principal:x.principal,apy:x.apy}))),today=rows.find(x=>x.date===new Date().toISOString().slice(0,10))?.profit??0;
 const byProperty=allocateEarnedByProperty(earned,(props.data??[]).map(x=>({slug:x.slug,name:x.name,city:x.city,country:x.country,targetReturn:Number(x.target_return??0)})),today);
 return {daily:rows,monthly:aggregateMonthly(rows),byProperty,byCountry:aggregateCountries(byProperty),totals:{principal,value,earned,today,blendedApy:apy},roi:roiTable(apy),positions};
}
