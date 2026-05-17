-- Private bucket for declaration attachments (brief: Submit Upload — Supabase Storage private bucket)
insert into storage.buckets (id, name, public, file_size_limit)
values (
  'entry-uploads',
  'entry-uploads',
  false,
  5242880
)
on conflict (id) do nothing;

drop policy if exists "entry_uploads_insert_own" on storage.objects;
drop policy if exists "entry_uploads_select_own" on storage.objects;
drop policy if exists "entry_uploads_delete_own" on storage.objects;

create policy "entry_uploads_insert_own"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'entry-uploads'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "entry_uploads_select_own"
on storage.objects for select to authenticated
using (
  bucket_id = 'entry-uploads'
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "entry_uploads_delete_own"
on storage.objects for delete to authenticated
using (
  bucket_id = 'entry-uploads'
  and split_part(name, '/', 1) = auth.uid()::text
);
