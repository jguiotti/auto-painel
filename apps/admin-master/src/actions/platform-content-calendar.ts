"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireAdminSession } from "@/lib/auth/require-admin";
import {
  CONTENT_CALENDAR_CHANNELS,
  CONTENT_CALENDAR_STATUSES,
  type ContentCalendarChannel,
  type ContentCalendarStatus,
} from "@/lib/data/platform-content-calendar-shared";

const REVALIDATE_PATHS = ["/painel/calendario-conteudo", "/painel/dashboard"];

interface ActionResult {
  error?: string;
  success?: boolean;
}

function isChannel(value: string): value is ContentCalendarChannel {
  return (CONTENT_CALENDAR_CHANNELS as readonly string[]).includes(value);
}

function isStatus(value: string): value is ContentCalendarStatus {
  return (CONTENT_CALENDAR_STATUSES as readonly string[]).includes(value);
}

export async function upsertContentCalendarItemAction(
  formData: FormData,
): Promise<ActionResult> {
  await requireAdminSession();

  const id = String(formData.get("id") ?? "").trim();
  const scheduledFor = String(formData.get("scheduled_for") ?? "").trim();
  const channel = String(formData.get("channel") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim();
  const status = String(formData.get("status") ?? "draft").trim();
  const bodyNotes = String(formData.get("body_notes") ?? "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledFor)) {
    return { error: "Data inválida." };
  }
  if (!isChannel(channel)) {
    return { error: "Canal inválido." };
  }
  if (title.length < 3) {
    return { error: "Título obrigatório (mínimo 3 caracteres)." };
  }
  if (!isStatus(status)) {
    return { error: "Status inválido." };
  }

  const payload = {
    scheduled_for: scheduledFor,
    channel,
    title,
    objective: objective || null,
    status,
    body_notes: bodyNotes || null,
    updated_at: new Date().toISOString(),
  };

  const supabase = await createSupabaseServerClient();
  const { error } = id
    ? await supabase.from("platform_content_calendar_items").update(payload).eq("id", id)
    : await supabase.from("platform_content_calendar_items").insert(payload);

  if (error) {
    return { error: "Não foi possível salvar o item do calendário." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}

export async function updateContentCalendarStatusAction(
  itemId: string,
  status: string,
): Promise<ActionResult> {
  await requireAdminSession();
  if (!isStatus(status)) {
    return { error: "Status inválido." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("platform_content_calendar_items")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", itemId);

  if (error) {
    return { error: "Não foi possível atualizar o status." };
  }

  REVALIDATE_PATHS.forEach((path) => revalidatePath(path));
  return { success: true };
}
