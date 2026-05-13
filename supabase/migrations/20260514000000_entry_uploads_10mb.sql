-- First-entry file proofs allow up to 10MB (PDF, Office, images).
update storage.buckets
set file_size_limit = 10485760
where id = 'entry-uploads';
