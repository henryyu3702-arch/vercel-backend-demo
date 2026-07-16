import { NextResponse } from "next/server";
import { listContent, saveContent } from "../../lib/db";

export async function GET() {
  const content = await listContent();

  return NextResponse.json({ ok: true, content });
}

export async function POST(request) {
  const { text, author } = await request.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ message: "请输入要保存的内容" }, { status: 400 });
  }

  if (!author || !author.trim()) {
    return NextResponse.json({ message: "请先登录再保存" }, { status: 401 });
  }

  const savedContent = await saveContent(text.trim(), author.trim());

  return NextResponse.json({ ok: true, content: savedContent });
}
