import {describe,it,expect} from 'vitest';
import {earlyExit} from '../lib/finance';
import {parseAutoRollPatch} from '../lib/savings-validation';
describe('savings rules',()=>{
 it('keeps the 90-day early-exit lock: day 29 and day 30 are blocked',()=>{
  expect(earlyExit({principal:1000,accrued:12,daysIn:29}).allowed).toBe(false);
  expect(earlyExit({principal:1000,accrued:12,daysIn:30}).allowed).toBe(false);
 });
 it('blocks day 89 and permits early exit on day 90',()=>{
  expect(earlyExit({principal:1000,accrued:12,daysIn:89}).allowed).toBe(false);
  expect(earlyExit({principal:1000,accrued:12,daysIn:90})).toMatchObject({allowed:true,fee:15,forfeited:12,receive:985});
 });
 it('accepts only a single auto_roll update',()=>{
  expect(parseAutoRollPatch({auto_roll:'renew'},'six')).toEqual({auto_roll:'renew'});
  expect(parseAutoRollPatch({auto_roll:'renew',principal:1},'six')).toBeNull();
  expect(parseAutoRollPatch({principal:1},'six')).toBeNull();
 });
 it('allows switching only Firn Six to Firn Twelve',()=>{
  expect(parseAutoRollPatch({auto_roll:'renew_twelve'},'six')).toEqual({auto_roll:'renew_twelve'});
  expect(parseAutoRollPatch({auto_roll:'renew_twelve'},'twelve')).toBeNull();
 });
 it('rejects malformed patch bodies',()=>{
  expect(parseAutoRollPatch(null,'six')).toBeNull();
  expect(parseAutoRollPatch([],'six')).toBeNull();
  expect(parseAutoRollPatch({auto_roll:'other'},'six')).toBeNull();
 });
});
