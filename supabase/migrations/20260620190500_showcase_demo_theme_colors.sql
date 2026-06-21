/*
  migration: refresh marketing showcase demo themes (order-aligned palettes)
  purpose: align demo / demo-2 / demo-3 colors with marketing site swatches and layout templates
  affected: public.dealerships (slug demo, demo-2, demo-3)
*/

update public.dealerships
set
  layout_id = 3::smallint,
  theme_settings = '{
    "primary": "#ffa501",
    "accent": "#a06a0e",
    "storefront_theme_mode": "dark"
  }'::jsonb,
  theme_config = jsonb_set(
    jsonb_set(
      coalesce(theme_config, '{}'::jsonb),
      '{primary_color}',
      '"#ffa501"'::jsonb
    ),
    '{secondary_color}',
    '"#f8fafc"'::jsonb
  ) || '{"storefront_theme_mode":"dark","accent_color":"#a06a0e"}'::jsonb,
  logo_url = 'https://placehold.co/480x120/0f172a/ffa501?text=Demo&font=montserrat',
  updated_at = now()
where slug = 'demo';

update public.dealerships
set
  layout_id = 1::smallint,
  theme_settings = '{
    "primary": "#b32027",
    "accent": "#ca656a",
    "storefront_theme_mode": "dark"
  }'::jsonb,
  theme_config = jsonb_set(
    jsonb_set(
      coalesce(theme_config, '{}'::jsonb),
      '{primary_color}',
      '"#b32027"'::jsonb
    ),
    '{secondary_color}',
    '"#f8fafc"'::jsonb
  ) || '{"storefront_theme_mode":"dark","accent_color":"#ca656a"}'::jsonb,
  logo_url = 'https://placehold.co/480x120/18181b/b32027?text=Demo+2&font=montserrat',
  updated_at = now()
where slug = 'demo-2';

update public.dealerships
set
  layout_id = 2::smallint,
  theme_settings = '{
    "primary": "#67927d",
    "accent": "#14c671",
    "storefront_theme_mode": "dark"
  }'::jsonb,
  theme_config = jsonb_set(
    jsonb_set(
      coalesce(theme_config, '{}'::jsonb),
      '{primary_color}',
      '"#67927d"'::jsonb
    ),
    '{secondary_color}',
    '"#f8fafc"'::jsonb
  ) || '{"storefront_theme_mode":"dark","accent_color":"#14c671"}'::jsonb,
  logo_url = 'https://placehold.co/480x120/0f172a/67927d?text=Demo+3&font=montserrat',
  updated_at = now()
where slug = 'demo-3';
