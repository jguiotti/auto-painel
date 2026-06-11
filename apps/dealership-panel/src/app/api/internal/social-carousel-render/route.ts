import { NextResponse } from "next/server";

import { renderSocialCarouselSlides } from "@/lib/social/render-social-carousel-slides";

interface RenderRequestBody {
  jobId?: string;
  dealershipId?: string;
  artifactTemplate?: string;
  payloadSnapshot?: Record<string, unknown>;
}

function authorizeRenderRequest(req: Request): boolean {
  const configuredSecret = process.env.SOCIAL_CAROUSEL_RENDER_SECRET?.trim();
  if (!configuredSecret) {
    return false;
  }
  const headerSecret = req.headers.get("x-social-carousel-render-secret")?.trim();
  return headerSecret === configuredSecret;
}

function parseArtifactTemplate(value: string | undefined): "classic" | "performance" | "tech" {
  if (value === "performance" || value === "tech") {
    return value;
  }
  return "classic";
}

export async function POST(req: Request) {
  if (!authorizeRenderRequest(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RenderRequestBody;
  try {
    body = (await req.json()) as RenderRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobId = body.jobId?.trim();
  const dealershipId = body.dealershipId?.trim();
  const payloadSnapshot = body.payloadSnapshot;

  if (!jobId || !dealershipId || !payloadSnapshot) {
    return NextResponse.json(
      { error: "jobId, dealershipId and payloadSnapshot are required." },
      { status: 400 },
    );
  }

  try {
    const imageUrls = await renderSocialCarouselSlides({
      jobId,
      dealershipId,
      artifactTemplate: parseArtifactTemplate(body.artifactTemplate),
      payloadSnapshot,
    });

    return NextResponse.json({ imageUrls });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Render failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
