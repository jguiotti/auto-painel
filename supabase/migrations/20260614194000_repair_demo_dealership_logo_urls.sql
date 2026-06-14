/*
  migration: repair broken demo dealership logo URLs (Unsplash 404) — LOCAL / CI ONLY
  purpose: seed used photo IDs that no longer resolve in fresh db reset environments
  affected: public.dealerships (guiotti, autoprime, ecodrive) ONLY when logo_url still points at dead Unsplash IDs
  warning: never strip production storage URLs from theme_config (removed in follow-up 20260614213000)
*/

update public.dealerships
set
  logo_url = 'https://placehold.co/400x120/1a1a1a/C5A059?text=Guiotti+Multimarcas',
  updated_at = now()
where slug = 'guiotti'
  and logo_url like '%photo-1619767886555%';

update public.dealerships
set
  logo_url = 'https://placehold.co/400x120/2563EB/ffffff?text=EcoDrive',
  updated_at = now()
where slug = 'ecodrive'
  and logo_url like '%photo-1593941707882%';
