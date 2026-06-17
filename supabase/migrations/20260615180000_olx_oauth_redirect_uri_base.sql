-- OLX OAuth redirect URI must be the bare callback URL (no ?provider= query).
-- OLX replaces the entire query string on redirect; provider is carried in OAuth `state`.

update public.platform_classifieds_oauth_providers
set
  redirect_uri = 'https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback',
  updated_at = now()
where
  provider = 'olx';
