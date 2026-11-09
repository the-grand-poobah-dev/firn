import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ createClient: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
import { POST } from '../app/api/wallet/withdraw/route';

describe('wallet withdrawal early-exit boundary', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a bulk early-exit request before invoking the database RPC', async () => {
    const rpc = vi.fn();
    mocks.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-a' } }, error: null }) },
      rpc,
    });
    const response = await POST(new Request('http://localhost/api/wallet/withdraw', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: 100, method: 'bank', destination: 'account 123', early_exit: true }),
    }));
    expect(response.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
