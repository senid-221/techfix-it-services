begin;
insert into storage.buckets (id,name,public) values ('technician-job-payment-proofs','technician-job-payment-proofs',false) on conflict (id) do nothing;
commit;
