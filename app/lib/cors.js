import { NextResponse } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5500",
  process.env.FRONTEND_ORIGIN
].filter(Boolean);

function getAllowOrigin(request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return "*";
  }

  if (allowedOrigins.includes(origin)) {
    return origin;
  }

  if (origin.endsWith(".github.io")) {
    return origin;
  }

  return allowedOrigins[0] || "*";
}

export function withCors(request, response) {
  response.headers.set("Access-Control-Allow-Origin", getAllowOrigin(request));
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  response.headers.set("Access-Control-Max-Age", "86400");

  return response;
}

export function corsJson(request, body, init) {
  return withCors(request, NextResponse.json(body, init));
}

export function corsOptions(request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
