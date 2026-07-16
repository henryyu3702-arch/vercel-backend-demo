# Vercel 后端部署体验 Demo

这是一个最小 Next.js 示例：

- 前端登录页，默认用户名/密码都是 `admin`
- 支持注册新账号，注册成功后自动登录
- 后端接口 `/api/login` 校验账号密码
- 登录/注册成功后返回登录 token
- 登录后可输入内容并保存到数据库 `content` 表，后端通过 token 识别作者
- `/contents` 页面展示所有保存过的内容和作者
- 本地开发默认使用 SQLite 文件 `demo.db`
- 部署到 Vercel 后，如果绑定 Vercel Postgres，会自动使用 Postgres

## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`，使用：

- 用户名：`admin`
- 密码：`admin`

也可以直接注册一个新账号。登录后保存内容，再打开 `http://localhost:3000/contents` 查看所有内容。

## 部署到 Vercel

### 方法一：GitHub 导入

1. 把项目推送到 GitHub。
2. 在 Vercel 控制台点击 `Add New Project`。
3. 选择这个 GitHub 仓库。
4. 直接 Deploy。

### 方法二：CLI 部署

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

## 数据库说明

本地开发会自动创建：

- `users` 表，并写入 `admin/admin`
- `content` 表，用来保存输入内容

保存内容时会自动记录作者字段 `author`。如果旧表没有 `author` 字段，程序会自动补充该字段。

登录 token 会保存到数据库的 `auth_tokens` 表。保存内容时，前端需要在请求头里携带：

```text
Authorization: Bearer <token>
```

后端会根据 token 查询当前用户，并把该用户作为内容作者，避免直接相信前端传来的作者名。

Vercel 线上推荐添加 Vercel Postgres：

1. 进入 Vercel 项目。
2. 打开 `Storage`。
3. 创建并连接 Postgres。
4. Vercel 会自动注入 `POSTGRES_URL` 等环境变量。
5. 重新部署项目。

连接 Postgres 后，接口会自动创建 `users` 和 `content` 表。

## 前后端分离时的 CORS

如果前端部署在 GitHub Pages，后端 API 部署在 Vercel，需要允许跨域请求。

本项目的 API 已经支持 CORS：

- `POST /api/login`
- `POST /api/register`
- `GET /api/content`
- `POST /api/content`

推荐在 Vercel 项目的 `Settings` → `Environment Variables` 中添加：

```text
FRONTEND_ORIGIN=https://henryyu3702-arch.github.io
```

如果你的 GitHub Pages 地址带仓库名，例如：

```text
https://henryyu3702-arch.github.io/vercel-frontend-demo
```

`FRONTEND_ORIGIN` 仍然只填写来源部分：

```text
https://henryyu3702-arch.github.io
```

添加或修改环境变量后，需要在 Vercel 中重新部署一次。

## GitHub Pages 静态前端

`docs/` 目录是一个纯静态前端，可以部署到 GitHub Pages：

- `docs/index.html`
- `docs/styles.css`
- `docs/app.js`

前端通过 `docs/app.js` 中的 `API_BASE_URL` 调用 Vercel 后端 API：

```js
const API_BASE_URL = "https://vercel-backend-demo-fx1cd0uka-henryyu3702-archs-projects.vercel.app";
```

发布 GitHub Pages：

1. 打开 GitHub 仓库 `vercel-backend-demo`。
2. 进入 `Settings` → `Pages`。
3. `Source` 选择 `Deploy from a branch`。
4. `Branch` 选择 `main`。
5. 目录选择 `/docs`。
6. 保存后等待 GitHub Pages 部署完成。

部署完成后，前端地址通常是：

```text
https://henryyu3702-arch.github.io/vercel-backend-demo/
```
