"use client";

import ReactMarkdown from "react-markdown";

export type InternalMarkdownDocVariant = "onboarding" | "technical";

interface InternalMarkdownDocProps {
  markdown: string;
  variant?: InternalMarkdownDocVariant;
}

const baseStyles =
  "internal-markdown space-y-4 leading-relaxed text-foreground " +
  "[&_h1]:mb-2 [&_h1]:font-bold [&_h1]:tracking-tight [&_h1]:text-foreground " +
  "[&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground " +
  "[&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_hr]:border-border " +
  "[&_p]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground " +
  "[&_ul]:list-disc [&_ul]:text-muted-foreground [&_ol]:list-decimal [&_ol]:text-muted-foreground [&_li]:mb-1.5 " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-foreground " +
  "[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:text-[13px] [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/90 " +
  "[&_blockquote]:rounded-xl [&_blockquote]:border [&_blockquote]:border-primary/20 [&_blockquote]:bg-primary/5 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:text-sm [&_blockquote_p]:mb-0 [&_blockquote_p]:text-foreground/90 " +
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_th]:border [&_th]:border-border [&_th]:bg-muted/60 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground " +
  "[&_td]:border [&_td]:border-border [&_td]:px-4 [&_td]:py-2.5 [&_td]:text-muted-foreground";

const variantStyles: Record<InternalMarkdownDocVariant, string> = {
  onboarding:
    "max-w-3xl text-[15px] " +
    "[&_h1]:text-3xl [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:border-0 [&_h2]:pb-0 " +
    "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-lg " +
    "[&_hr]:my-10 " +
    "[&_p]:mb-4 [&_ul]:mb-5 [&_ul]:pl-5 [&_ol]:mb-5 [&_ol]:pl-5",
  technical:
    "max-w-4xl text-sm " +
    "[&_h1]:mb-6 [&_h1]:text-2xl [&_h1]:border-b [&_h1]:border-border [&_h1]:pb-4 " +
    "[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:scroll-mt-20 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-lg " +
    "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-base " +
    "[&_hr]:my-12 " +
    "[&_p]:mb-4 [&_ul]:mb-4 [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:pl-6",
};

export function InternalMarkdownDoc({
  markdown,
  variant = "onboarding",
}: InternalMarkdownDocProps) {
  return (
    <div className={`${baseStyles} ${variantStyles[variant]}`}>
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
