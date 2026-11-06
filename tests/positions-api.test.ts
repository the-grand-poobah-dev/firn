import {beforeEach,describe,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({createClient:vi.fn(),revalidatePath:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.createClient}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidatePath}));
vi.mock('@/lib/savings',()=>({getSavingsPosition:vi.fn()}));
import {PATCH} from '../app/api/positions/[id]/route';

function clientFor(position:unknown,updated:unknown=null){
 const ownerLookup=vi.fn().mockResolvedValue({data:position,error:null});
 const select=vi.fn(()=>({eq:vi.fn(()=>({maybeSingle:ownerLookup}))}));
 const updateResult=vi.fn().mockResolvedValue({data:updated,error:null});
 const update=vi.fn(()=>({eq:vi.fn(()=>({eq:vi.fn(()=>({select:vi.fn(()=>({maybeSingle:updateResult}))}))}))}));
 return {auth:{getUser:vi.fn().mockResolvedValue({data:{user:{id:'user-a'}},error:null})},from:vi.fn(()=>({select,update})),select,update,ownerLookup,updateResult};
}
describe('position PATCH security',()=>{
 beforeEach(()=>vi.clearAllMocks());
 it('cannot PATCH another user position because RLS hides it',async()=>{
  const client=clientFor(null);mocks.createClient.mockResolvedValue(client);
  const response=await PATCH(new Request('http://localhost/api/positions/other',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({auto_roll:'renew'})}),{params:{id:'other'}});
  expect(response.status).toBe(404);
  expect(client.update).not.toHaveBeenCalled();
 });
 it('rejects attempts to change principal through PATCH',async()=>{
  const client=clientFor({plan:'six'});mocks.createClient.mockResolvedValue(client);
  const response=await PATCH(new Request('http://localhost/api/positions/mine',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({principal:1})}),{params:{id:'mine'}});
  expect(response.status).toBe(400);
  expect(client.update).not.toHaveBeenCalled();
 });
});
