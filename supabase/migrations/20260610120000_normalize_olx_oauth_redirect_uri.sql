-- Restore OLX redirect URI with ?provider= query param (required by OLX portal registration).
-- Provider is also resolved from OAuth `state` in classifieds-oauth-callback as fallback.

update public.platform_classifieds_oauth_providers
set
  redirect_uri = 'https://wcgevmvystdhqpzwuyig.supabase.co/functions/v1/classifieds-oauth-callback?provider=olx',
  updated_at = now()
where
  provider = 'olx';
