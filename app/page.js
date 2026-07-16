"use client";

import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [currentUser, setCurrentUser] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleAuth(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch(mode === "login" ? "/api/login" : "/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setMessage(data.message || (mode === "login" ? "登录失败" : "注册失败"));
      return;
    }

    setIsLoggedIn(true);
    setCurrentUser(data.username);
    setAuthToken(data.token);
    setMessage(mode === "login" ? "登录成功，可以输入内容并保存了。" : "注册成功，已自动登录。");
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`
      },
      body: JSON.stringify({ text: content })
    });
    const data = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setMessage(data.message || "保存失败");
      return;
    }

    setContent("");
    setMessage(`保存成功，记录 ID：${data.content.id}`);
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="page-shell">
      <section className="card">
        <p className="eyebrow">Vercel 后端部署体验</p>
        <h1>{isLoggedIn ? "保存内容" : mode === "login" ? "登录" : "注册"}</h1>
        <p className="description">
          支持注册账号、登录、保存内容，并在列表页查看所有输入过的内容和作者。
        </p>

        {!isLoggedIn ? (
          <>
            <div className="tabs">
              <button
                className={mode === "login" ? "tab active" : "tab"}
                type="button"
                onClick={() => switchMode("login")}
              >
                登录
              </button>
              <button
                className={mode === "register" ? "tab active" : "tab"}
                type="button"
                onClick={() => switchMode("register")}
              >
                注册
              </button>
            </div>
            <form onSubmit={handleAuth} className="form">
              <label>
                账号
                <input value={username} onChange={(event) => setUsername(event.target.value)} />
              </label>
              <label>
                密码
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button disabled={isLoading}>{isLoading ? "处理中..." : mode === "login" ? "登录" : "注册并登录"}</button>
            </form>
          </>
        ) : (
          <>
            <p className="signed-in">当前用户：{currentUser}</p>
            <form onSubmit={handleSave} className="form">
              <label>
                内容
                <input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="请输入要保存的内容"
                />
              </label>
              <button disabled={isLoading}>{isLoading ? "保存中..." : "保存"}</button>
            </form>
          </>
        )}

        {message ? <p className="message">{message}</p> : null}

        <Link className="link-button" href="/contents">
          查看所有内容
        </Link>
      </section>
    </main>
  );
}
