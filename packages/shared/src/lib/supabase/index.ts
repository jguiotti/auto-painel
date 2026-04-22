export {
  getSupabasePublicEnv,
  getSupabaseServiceRoleEnv,
  getSupabaseUrl,
} from "./env";
export { createSupabaseBrowserClient } from "./browser-client";
export {
  createSupabaseServerClient,
  type CookieStoreLike,
} from "./server-client";
export { createSupabaseAnonClient } from "./anon-client";
export {
  assertDealershipMatchesProfile,
  fetchProfileDealershipId,
} from "./tenant";
