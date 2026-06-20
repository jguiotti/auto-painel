/*
  migration: fix circular RLS on platform_sales_reps_select_own_rep
  purpose:
    - policy previously called current_platform_sales_rep_id(), which reads
      platform_sales_reps under the same policy → infinite recursion
      (Postgres: "stack depth limit exceeded")
    - rep portal and QA script depend on current_platform_sales_rep_id() resolving
  affected:
    - public.platform_sales_reps policy "platform_sales_reps_select_own_rep"
*/

drop policy if exists "platform_sales_reps_select_own_rep" on public.platform_sales_reps;

create policy "platform_sales_reps_select_own_rep"
on public.platform_sales_reps
for select
to authenticated
using (
  user_id = (select auth.uid())
  and status = 'active'
);
