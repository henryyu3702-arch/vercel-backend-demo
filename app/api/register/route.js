import { corsJson, corsOptions } from "../../lib/cors";
import { createAuthToken, createUser } from "../../lib/db";

export async function OPTIONS(request) {
  return corsOptions(request);
}

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    const normalizedUsername = username?.trim();

    if (!normalizedUsername || !password) {
      return corsJson(request, { message: "请输入账号和密码" }, { status: 400 });
    }

    const user = await createUser(normalizedUsername, password);

    if (!user) {
      return corsJson(request, { message: "账号已存在，请换一个账号" }, { status: 409 });
    }

    const token = await createAuthToken(user.username);

    return corsJson(request, { ok: true, username: user.username, token });
  } catch (error) {
    return corsJson(request, { message: error.message || "注册接口异常" }, { status: 500 });
  }
}
