import { describe, expect, it } from 'vitest';
import { MINIMUM_SAVING_USD } from '../lib/finance';
describe('finance scaffold', () => { it('exports the minimum savings amount', () => expect(MINIMUM_SAVING_USD).toBe(500)); });
