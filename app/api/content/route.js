import { corsJson, corsOptions } from "../../lib/cors";
import { findUserByToken, listContent, saveContent } from "../../lib/db";

function getBearerToken(request) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return "";
  }

  return authorization.slice("Bearer ".length).trim();
}

export async function OPTIONS(request) {
  return corsOptions(request);
}

export async function GET(request) {
  try {
    const content = await listContent();

    return corsJson(request, { ok: true, content });
  } catch (error) {
    return corsJson(request, { message: error.message || "内容列表接口异常" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { text } = await request.json();
    const user = await findUserByToken(getBearerToken(request));

    if (!text || !text.trim()) {
      return corsJson(request, { message: "请输入要保存的内容" }, { status: 400 });
    }

    if (!user) {
      return corsJson(request, { message: "请先登录再保存" }, { status: 401 });
    }

    const savedContent = await saveContent(text.trim(), user.username);

    return corsJson(request, { ok: true, content: savedContent });
  } catch (error) {
    return corsJson(request, { message: error.message || "保存接口异常" }, { status: 500 });
  }
}
