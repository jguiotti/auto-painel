export const CONTENT_CALENDAR_CHANNELS = [
  "instagram",
  "linkedin",
  "blog",
  "email",
  "whatsapp",
  "other",
] as const;

export type ContentCalendarChannel = (typeof CONTENT_CALENDAR_CHANNELS)[number];

export const CONTENT_CALENDAR_CHANNEL_LABELS: Record<ContentCalendarChannel, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  blog: "Blog",
  email: "E-mail",
  whatsapp: "WhatsApp",
  other: "Outro",
};

export const CONTENT_CALENDAR_STATUSES = [
  "draft",
  "scheduled",
  "published",
  "cancelled",
] as const;

export type ContentCalendarStatus = (typeof CONTENT_CALENDAR_STATUSES)[number];

export const CONTENT_CALENDAR_STATUS_LABELS: Record<ContentCalendarStatus, string> = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  cancelled: "Cancelado",
};

export interface ContentCalendarItemRow {
  id: string;
  scheduled_for: string;
  channel: ContentCalendarChannel;
  title: string;
  objective: string | null;
  status: ContentCalendarStatus;
  body_notes: string | null;
  created_at: string;
  updated_at: string;
}
