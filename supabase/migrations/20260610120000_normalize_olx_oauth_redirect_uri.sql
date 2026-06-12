-- Normalize OLX OAuth redirect URI: OLX portal registers callbacks without query strings.
-- Provider is resolved from OAuth `state` in classifieds-oauth-callback Edge Function.

update public.platform_classifieds_oauth_providers
set
  redirect_uri = 'https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback',
  updated_at = now()
where
  provider = 'olx'
  and redirect_uri is distinct from 'https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback';

comment on column public.platform_classifieds_oauth_providers.redirect_uri is
  'OAuth redirect URI registered at the classifieds portal. OLX must not include ?provider= query params.';
