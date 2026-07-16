"use client";

import { useState } from "react";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [content, setContent] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await response.json();

    setIsLoading(false);

    if (!response.ok) {
      setMessage(data.message || "登录失败");
      return;
    }

    setIsLoggedIn(true);
    setMessage("登录成功，可以输入内容并保存了。");
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    const response = await fetch("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

  return (
    <main className="page-shell">
      <section className="card">
        <p className="eyebrow">Vercel 后端部署体验</p>
        <h1>{isLoggedIn ? "保存内容" : "登录"}</h1>
        <p className="description">
          默认账号和密码都是 <strong>admin</strong>。登录后输入内容，点击保存会写入后端数据库的 content 表。
        </p>

        {!isLoggedIn ? (
          <form onSubmit={handleLogin} className="form">
            <label>
              用户名
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
            <button disabled={isLoading}>{isLoading ? "登录中..." : "登录"}</button>
          </form>
        ) : (
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
        )}

        {message ? <p className="message">{message}</p> : null}
      </section>
    </main>
  );
}
