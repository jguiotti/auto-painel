import {
  authorizeSocialWorkerRequest,
  claimSocialPublicationJobs,
  createSocialWorkerAdminClient,
  processSocialPublicationJobSafe,
} from "../_shared/social-publish-process-job.ts";

interface WorkerRequestBody {
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!authorizeSocialWorkerRequest(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let limit = 5;
  try {
    const body = (await req.json()) as WorkerRequestBody;
    if (typeof body.limit === "number" && body.limit > 0 && body.limit <= 20) {
      limit = Math.floor(body.limit);
    }
  } catch {
    // empty body is fine
  }

  const admin = createSocialWorkerAdminClient();
  const jobs = await claimSocialPublicationJobs(admin, limit);
  const results = [];

  for (const job of jobs) {
    results.push(await processSocialPublicationJobSafe(admin, job));
  }

  return new Response(
    JSON.stringify({
      claimed: jobs.length,
      results,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json", Connection: "keep-alive" },
    },
  );
});
