import { corsJson, corsOptions } from "../../lib/cors";

export async function OPTIONS(request) {
  return corsOptions(request);
}

export async function GET(request) {
  return corsJson(request, { ok: true, service: "vercel-backend-demo" });
}
