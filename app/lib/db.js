import { sql } from "@vercel/postgres";

const isVercelPostgresAvailable = Boolean(process.env.POSTGRES_URL);

async function getLocalDb() {
  const sqlite = (await import("better-sqlite3")).default;
  const db = sqlite("demo.db");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.prepare(
    "INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)"
  ).run("admin", "admin");

  return db;
}

export async function findUser(username, password) {
  if (isVercelPostgresAvailable) {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        password TEXT NOT NULL
      )
    `;
    await sql`
      INSERT INTO users (username, password)
      VALUES ('admin', 'admin')
      ON CONFLICT (username) DO NOTHING
    `;

    const { rows } = await sql`
      SELECT username FROM users
      WHERE username = ${username} AND password = ${password}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }

  const db = await getLocalDb();
  return db
    .prepare("SELECT username FROM users WHERE username = ? AND password = ? LIMIT 1")
    .get(username, password) ?? null;
}

export async function saveContent(text) {
  if (isVercelPostgresAvailable) {
    await sql`
      CREATE TABLE IF NOT EXISTS content (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const { rows } = await sql`
      INSERT INTO content (text)
      VALUES (${text})
      RETURNING id, text, created_at
    `;
    return rows[0];
  }

  const db = await getLocalDb();
  const result = db.prepare("INSERT INTO content (text) VALUES (?)").run(text);
  return db
    .prepare("SELECT id, text, created_at FROM content WHERE id = ?")
    .get(result.lastInsertRowid);
}
