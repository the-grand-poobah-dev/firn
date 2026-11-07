-- Firn plan target APY and private identity-document storage.
-- Existing positions retain the APY agreed when they were created.
update public.plans set target_apy=0.50, low_apy=0.50, high_apy=0.50 where code='six';
update public.plans set target_apy=1.00, low_apy=1.00, high_apy=1.00 where code='twelve';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc-documents', 'kyc-documents', false, 10485760, array['image/jpeg','image/png','application/pdf'])
on conflict (id) do update set public=false, file_size_limit=10485760, allowed_mime_types=excluded.allowed_mime_types;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users upload their own KYC documents') then
    create policy "Users upload their own KYC documents" on storage.objects
      for insert to authenticated
      with check (bucket_id='kyc-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
  if not exists (select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='Users view their own KYC documents') then
    create policy "Users view their own KYC documents" on storage.objects
      for select to authenticated
      using (bucket_id='kyc-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
  end if;
end $$;
