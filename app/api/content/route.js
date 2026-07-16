import { NextResponse } from "next/server";
import { saveContent } from "../../lib/db";

export async function POST(request) {
  const { text } = await request.json();

  if (!text || !text.trim()) {
    return NextResponse.json({ message: "请输入要保存的内容" }, { status: 400 });
  }

  const savedContent = await saveContent(text.trim());

  return NextResponse.json({ ok: true, content: savedContent });
}
