import { corsJson, corsOptions } from "../../lib/cors";
import { findUser } from "../../lib/db";

export async function OPTIONS(request) {
  return corsOptions(request);
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return corsJson(request, { message: "请输入用户名和密码" }, { status: 400 });
    }

    const user = await findUser(username, password);

    if (!user) {
      return corsJson(request, { message: "用户名或密码错误" }, { status: 401 });
    }

    return corsJson(request, { ok: true, username: user.username });
  } catch (error) {
    return corsJson(request, { message: error.message || "登录接口异常" }, { status: 500 });
  }
}
