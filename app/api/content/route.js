import { corsJson, corsOptions } from "../../lib/cors";
import { listContent, saveContent } from "../../lib/db";

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
    const { text, author } = await request.json();

    if (!text || !text.trim()) {
      return corsJson(request, { message: "请输入要保存的内容" }, { status: 400 });
    }

    if (!author || !author.trim()) {
      return corsJson(request, { message: "请先登录再保存" }, { status: 401 });
    }

    const savedContent = await saveContent(text.trim(), author.trim());

    return corsJson(request, { ok: true, content: savedContent });
  } catch (error) {
    return corsJson(request, { message: error.message || "保存接口异常" }, { status: 500 });
  }
}
