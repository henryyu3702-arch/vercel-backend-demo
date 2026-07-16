# Vercel 后端部署体验 Demo

这是一个最小 Next.js 示例：

- 前端登录页，默认用户名/密码都是 `admin`
- 后端接口 `/api/login` 校验账号密码
- 登录后可输入内容并保存到数据库 `content` 表
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

Vercel 线上推荐添加 Vercel Postgres：

1. 进入 Vercel 项目。
2. 打开 `Storage`。
3. 创建并连接 Postgres。
4. Vercel 会自动注入 `POSTGRES_URL` 等环境变量。
5. 重新部署项目。

连接 Postgres 后，接口会自动创建 `users` 和 `content` 表。
