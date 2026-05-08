"use client";

import ReactMarkdown from "react-markdown";

interface InternalMarkdownDocProps {
  markdown: string;
}

export function InternalMarkdownDoc({ markdown }: InternalMarkdownDocProps) {
  return (
    <div
      className={
        "internal-markdown max-w-3xl space-y-4 text-sm leading-relaxed text-foreground " +
        "[&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight " +
        "[&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight " +
        "[&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold " +
        "[&_hr]:my-8 [&_hr]:border-border " +
        "[&_p]:mb-4 [&_p]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground " +
        "[&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground " +
        "[&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-muted-foreground [&_li]:mb-1 " +
        "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_code]:text-foreground " +
        "[&_pre]:mb-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted/40 [&_pre]:p-4 [&_pre]:text-[13px] " +
        "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary/90"
      }
    >
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
