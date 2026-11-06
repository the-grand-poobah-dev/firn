import {NextResponse} from 'next/server';
import {getSavingsPositions} from '@/lib/savings';
import {createPosition} from '@/lib/positions';
export const dynamic='force-dynamic';
export async function GET(){try{return NextResponse.json({positions:await getSavingsPositions()});}catch(error){const message=error instanceof Error?error.message:'Unable to load savings.';return NextResponse.json({error:message},{status:message.toLowerCase().includes('sign')?401:500});}}
export async function POST(request:Request){try{const body=await request.json();const key=request.headers.get('Idempotency-Key')??body?.idempotencyKey;const id=await createPosition({...body,idempotencyKey:key});return NextResponse.json({id},{status:201});}catch(error){const message=error instanceof Error?error.message:'Unable to create your savings position.';const status=message.includes('sign in')||message.includes('session')?401:message.includes('wallet balance')?402:400;return NextResponse.json({error:message},{status});}}
