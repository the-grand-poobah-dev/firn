import 'server-only';
import { requireUser } from '@/lib/auth';

export type SavingsPosition = {
  id:string; plan:'six'|'twelve'; principal:number; apy:number; started_on:string;
  matures_on:string; status:string; auto_roll:string; earned:number; value:number;
  days_left:number; days_in:number;
  allocations:{amount:number;property:{name:string;slug:string;city:string;country:string}|null}[];
  accruals:{accrual_date:string;amount:number;balance_after:number}[];
};

type AllocationRow = { position_id: string; amount: number | string; properties: { name: string; slug: string; city: string; country: string } | { name: string; slug: string; city: string; country: string }[] | null };
type AccrualRow = { position_id: string; accrual_date: string; amount: number | string; balance_after: number | string };

export async function getSavingsPositions():Promise<SavingsPosition[]> {
  const {supabase}=await requireUser();
  const {data,error}=await supabase.from('positions_live').select('*').order('matures_on',{ascending:true});
  if(error) throw new Error(error.message);
  const rows=(data??[]) as Array<Record<string,unknown>>;
  const ids=rows.map(x=>String(x.id));
  if(!ids.length) return [];
  const [alloc,accrual]=await Promise.all([
    supabase.from('allocations').select('position_id,amount,properties(name,slug,city,country)').in('position_id',ids),
    supabase.from('accruals').select('position_id,accrual_date,amount,balance_after').in('position_id',ids).order('accrual_date',{ascending:true})
  ]);
  if(alloc.error) throw new Error(alloc.error.message);
  if(accrual.error) throw new Error(accrual.error.message);
  const allocationRows = (alloc.data ?? []) as AllocationRow[];
  const accrualRows = (accrual.data ?? []) as AccrualRow[];
  return rows.map(row=>({
    id:String(row.id),plan:row.plan as 'six'|'twelve',principal:Number(row.principal??0),apy:Number(row.apy??0),
    started_on:String(row.started_on),matures_on:String(row.matures_on),status:String(row.status),
    auto_roll:String(row.auto_roll??'ask'),earned:Number(row.earned??0),value:Number(row.value??row.principal??0),
    days_left:Number(row.days_left??0),days_in:Number(row.days_in??0),
    allocations:allocationRows.filter(a=>a.position_id===row.id).map(a=>({amount:Number(a.amount),property:(Array.isArray(a.properties)?a.properties[0]??null:a.properties??null)})),
    accruals:accrualRows.filter(a=>a.position_id===row.id).map(a=>({accrual_date:a.accrual_date,amount:Number(a.amount),balance_after:Number(a.balance_after)}))
  }));
}
export async function getSavingsPosition(id:string):Promise<SavingsPosition|null>{
  const rows=await getSavingsPositions();
  return rows.find(row=>row.id===id)??null;
}
