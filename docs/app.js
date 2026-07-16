const API_BASE_URL = "https://vercel-backend-demo.vercel.app";

let mode = "login";
let currentUser = "";

const title = document.querySelector("#title");
const loginTab = document.querySelector("#login-tab");
const registerTab = document.querySelector("#register-tab");
const authForm = document.querySelector("#auth-form");
const authSubmit = document.querySelector("#auth-submit");
const usernameInput = document.querySelector("#username");
const passwordInput = document.querySelector("#password");
const authArea = document.querySelector("#auth-area");
const contentArea = document.querySelector("#content-area");
const currentUserText = document.querySelector("#current-user");
const contentForm = document.querySelector("#content-form");
const contentInput = document.querySelector("#content-input");
const message = document.querySelector("#message");
const contentList = document.querySelector("#content-list");
const refreshButton = document.querySelector("#refresh-button");

function setMode(nextMode) {
  mode = nextMode;
  title.textContent = mode === "login" ? "登录" : "注册";
  authSubmit.textContent = mode === "login" ? "登录" : "注册并登录";
  loginTab.classList.toggle("active", mode === "login");
  registerTab.classList.toggle("active", mode === "register");
  hideMessage();
}

function showMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? "#b91c1c" : "#1e40af";
  message.style.background = isError ? "#fef2f2" : "#eff6ff";
  message.classList.remove("hidden");
}

function hideMessage() {
  message.classList.add("hidden");
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "请求失败");
  }

  return data;
}

async function handleAuth(event) {
  event.preventDefault();
  hideMessage();

  try {
    const data = await requestJson(mode === "login" ? "/api/login" : "/api/register", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

    currentUser = data.username;
    currentUserText.textContent = currentUser;
    authArea.classList.add("hidden");
    contentArea.classList.remove("hidden");
    title.textContent = "保存内容";
    showMessage(mode === "login" ? "登录成功。" : "注册成功，已自动登录。");
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function handleSave(event) {
  event.preventDefault();
  hideMessage();

  try {
    const data = await requestJson("/api/content", {
      method: "POST",
      body: JSON.stringify({
        text: contentInput.value,
        author: currentUser
      })
    });

    contentInput.value = "";
    showMessage(`保存成功，记录 ID：${data.content.id}`);
    await loadContent();
  } catch (error) {
    showMessage(error.message, true);
  }
}

async function loadContent() {
  try {
    const data = await requestJson("/api/content");

    if (data.content.length === 0) {
      contentList.innerHTML = '<p class="empty">还没有保存过内容。</p>';
      return;
    }

    contentList.innerHTML = data.content
      .map(
        (item) => `
          <article class="content-item">
            <p class="content-text">${escapeHtml(item.text)}</p>
            <p class="content-meta">作者：${escapeHtml(item.author)} · 时间：${new Date(item.created_at).toLocaleString("zh-CN")}</p>
          </article>
        `
      )
      .join("");
  } catch (error) {
    contentList.innerHTML = `<p class="empty">加载失败：${escapeHtml(error.message)}</p>`;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loginTab.addEventListener("click", () => setMode("login"));
registerTab.addEventListener("click", () => setMode("register"));
authForm.addEventListener("submit", handleAuth);
contentForm.addEventListener("submit", handleSave);
refreshButton.addEventListener("click", loadContent);

loadContent();
