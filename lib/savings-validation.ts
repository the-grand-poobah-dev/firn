export type AutoRollChoice='ask'|'renew'|'withdraw'|'renew_twelve';
export function parseAutoRollPatch(input:unknown,plan?:string):{auto_roll:AutoRollChoice}|null{
 if(!input||typeof input!=='object'||Array.isArray(input))return null;
 const body=input as Record<string,unknown>;
 if(Object.keys(body).length!==1||!['ask','renew','withdraw','renew_twelve'].includes(String(body.auto_roll)))return null;
 if(body.auto_roll==='renew_twelve'&&plan!=='six')return null;
 return {auto_roll:body.auto_roll as AutoRollChoice};
}
