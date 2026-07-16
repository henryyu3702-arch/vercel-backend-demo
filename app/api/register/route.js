import { NextResponse } from "next/server";
import { createUser } from "../../lib/db";

export async function POST(request) {
  const { username, password } = await request.json();
  const normalizedUsername = username?.trim();

  if (!normalizedUsername || !password) {
    return NextResponse.json({ message: "请输入账号和密码" }, { status: 400 });
  }

  const user = await createUser(normalizedUsername, password);

  if (!user) {
    return NextResponse.json({ message: "账号已存在，请换一个账号" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, username: user.username });
}
