-- The six-month plan promises a 50% minimum compounded return over the contractual term.
-- 1.2652 effective annual rate compounds to at least 50% over the shortest 181-day
-- six-calendar-month term. Twelve-month plan remains at 100% effective annual rate.
-- Existing positions retain their originally agreed APY; this only affects new positions.
UPDATE public.plans
SET target_apy = 1.2652
WHERE code = 'six';
