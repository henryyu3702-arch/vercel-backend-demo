import Link from "next/link";
import { listContent } from "../lib/db";

export const dynamic = "force-dynamic";

export default async function ContentsPage() {
  const content = await listContent();

  return (
    <main className="page-shell list-shell">
      <section className="card list-card">
        <p className="eyebrow">内容列表</p>
        <h1>所有输入过的内容</h1>
        <p className="description">这里展示 content 表中的所有记录，包括内容、作者和保存时间。</p>

        {content.length === 0 ? (
          <p className="empty">还没有保存过内容。</p>
        ) : (
          <div className="content-list">
            {content.map((item) => (
              <article className="content-item" key={item.id}>
                <p className="content-text">{item.text}</p>
                <p className="content-meta">
                  作者：{item.author} · 时间：{new Date(item.created_at).toLocaleString("zh-CN")}
                </p>
              </article>
            ))}
          </div>
        )}

        <Link className="link-button" href="/">
          返回登录/保存页面
        </Link>
      </section>
    </main>
  );
}
