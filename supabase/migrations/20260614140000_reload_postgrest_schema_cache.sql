/*
  migration: reload PostgREST schema cache after CRM phase B tables
  purpose: ensure nested embeds (leads ↔ lead_notes) resolve after new FKs/tables
*/

notify pgrst, 'reload schema';
