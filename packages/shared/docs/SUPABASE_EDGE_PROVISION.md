# Edge Function: `provision-dealership-user`

Creates an `auth.users` row and a matching `public.profiles` row with `role = owner` for a dealership. Intended to be called **only** from trusted server code (e.g. `admin-master` server actions), never from the browser.

## 1. Secret

Generate a long random string and set it in **two places** with the **same value**:

1. **Supabase Dashboard** → Project Settings → Edge Functions → Secrets (or *Secrets* in older UI):  
   - Name: `PROVISION_FUNCTION_SECRET`  
   - Value: your random string

2. **Local / deployment env for admin-master** (e.g. root `.env.local`):  
   - `ADMIN_PROVISION_FUNCTION_SECRET=<same string>`

## 2. Deploy the function (manual)

From your machine, in the repo root (with Supabase CLI logged in and project linked):

```bash
supabase functions deploy provision-dealership-user --no-verify-jwt
```

`--no-verify-jwt` is common for functions that authenticate with a custom header (`x-provision-key`) instead of a user JWT. If your project requires JWT verification, you must align with Supabase docs or call the function with a service-role `Authorization` header instead.

After deploy, confirm in Dashboard → Edge Functions that `provision-dealership-user` appears.

## 3. Invoke URL

```
POST {SUPABASE_URL}/functions/v1/provision-dealership-user
Headers:
  Content-Type: application/json
  x-provision-key: {PROVISION_FUNCTION_SECRET}
Body:
  { "email": "...", "full_name": "...", "dealership_id": "uuid" }
```

Success response includes `temporary_password` (share securely; rotate after first login).

## 4. Required database migration

Apply the migration that adds RBAC columns and `profiles` roles (`super_admin`, `owner`, `seller`) before using this function. The function inserts `role: owner`.

## 5. Bootstrap `super_admin` (optional)

Platform operators are not created by this function. Insert a `super_admin` profile manually in SQL (Dashboard → SQL), with `dealership_id` **NULL**, after the migration:

```sql
-- Example only: replace USER_UUID with auth.users.id
insert into public.profiles (id, dealership_id, role)
values ('USER_UUID', null, 'super_admin');
```

Use this account only for Supabase-authenticated tooling if you adopt JWT-based platform access; `admin-master` signs in with **Supabase Auth** (email + password) and requires `profiles.role = super_admin` with `dealership_id` **NULL**.

### 5b. Create the first admin-master user in Supabase (Dashboard)

1. **Authentication → Users → Add user → Create new user**  
   - Informe **e-mail** e **senha** (ou envie convite).  
   - Marque **Auto Confirm User** em desenvolvimento, se disponível, para poder entrar sem confirmar e-mail.

2. Copie o **User UID** (id) do usuário criado.

3. **SQL Editor** (ou migração) — insira o perfil de operadora da plataforma:

```sql
insert into public.profiles (id, dealership_id, role)
values ('USER_UUID_AQUI', null, 'super_admin');
```

4. Aplique a migração `20260423140000_profiles_select_own_row.sql` (ou equivalente) para que esse usuário consiga **ler a própria linha** em `profiles` após o login (necessário porque `super_admin` tem `dealership_id` nulo).

5. No `.env.local` da raiz do monorepo, mantenha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` apontando para o mesmo projeto — o admin-master usa o cliente anônimo com cookies de sessão.

Contas **owner** / **seller** de concessionária **não** entram no admin-master: o login verifica `super_admin` e encerra a sessão se o perfil for outro.
