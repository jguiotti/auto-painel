-- migration: remove dealership team member (owner-only)
-- purpose: titular removes colaborador; soft-deactivates employee profile and removes profiles row

create or replace function public.remove_dealership_team_member(
  p_user_id uuid
)
returns table (
  removed_user_id uuid,
  removed_email text,
  removed_full_name text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_caller uuid;
  v_dealership_id uuid;
  v_target_role text;
  v_target_email text;
  v_target_name text;
  v_caller_is_owner boolean;
  v_caller_is_super_admin boolean;
begin
  v_caller := (select auth.uid());
  if v_caller is null then
    raise exception 'Não autenticado.';
  end if;

  if p_user_id is null or p_user_id = v_caller then
    raise exception 'Não é possível remover a própria conta.';
  end if;

  select exists (
    select 1
    from public.profiles as p
    where p.id = v_caller
      and p.role = 'super_admin'
      and p.dealership_id is null
  )
  into v_caller_is_super_admin;

  select p.dealership_id, p.role::text, u.email::text
  into v_dealership_id, v_target_role, v_target_email
  from public.profiles as p
  inner join auth.users as u on u.id = p.id
  where p.id = p_user_id
    and p.dealership_id is not null
    and p.role = any (array['manager'::text, 'seller'::text]);

  if v_dealership_id is null then
    raise exception 'Colaborador não encontrado nesta loja.';
  end if;

  select exists (
    select 1
    from public.profiles as p
    where p.id = v_caller
      and p.dealership_id = v_dealership_id
      and p.role = 'owner'
  )
  into v_caller_is_owner;

  if not v_caller_is_owner and not v_caller_is_super_admin then
    raise exception 'Apenas o titular da loja pode remover colaboradores.';
  end if;

  select coalesce(
    ep.full_name,
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    split_part(u.email, '@', 1)
  )
  into v_target_name
  from auth.users as u
  left join public.dealership_employee_profiles as ep on ep.user_id = u.id
  where u.id = p_user_id;

  insert into public.dealership_employee_profiles (
    user_id,
    dealership_id,
    full_name,
    is_active
  )
  values (
    p_user_id,
    v_dealership_id,
    coalesce(v_target_name, 'Colaborador'),
    false
  )
  on conflict (user_id) do update set
    is_active = false,
    full_name = coalesce(
      excluded.full_name,
      public.dealership_employee_profiles.full_name
    ),
    updated_at = now();

  delete from public.profiles as p
  where p.id = p_user_id
    and p.dealership_id = v_dealership_id
    and p.role = any (array['manager'::text, 'seller'::text]);

  if not found then
    raise exception 'Não foi possível remover o colaborador.';
  end if;

  return query
  select p_user_id, v_target_email, coalesce(v_target_name, 'Colaborador');
end;
$$;

comment on function public.remove_dealership_team_member(uuid) is
  'Owner removes manager/seller from dealership; deactivates employee profile and deletes profiles row.';

grant execute on function public.remove_dealership_team_member(uuid) to authenticated;

revoke all on function public.remove_dealership_team_member(uuid) from public;
