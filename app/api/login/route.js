import { NextResponse } from "next/server";
import { findUser } from "../../lib/db";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: "请输入用户名和密码" }, { status: 400 });
  }

  const user = await findUser(username, password);

  if (!user) {
    return NextResponse.json({ message: "用户名或密码错误" }, { status: 401 });
  }

  return NextResponse.json({ ok: true, username: user.username });
}
