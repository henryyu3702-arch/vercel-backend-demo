import { sql } from "@vercel/postgres";

const isVercelPostgresAvailable = Boolean(process.env.POSTGRES_URL);
const memoryContent = [];

function getDemoUser(username, password) {
  if (username === "admin" && password === "admin") {
    return { username: "admin" };
  }

  return null;
}

export async function findUser(username, password) {
  const demoUser = getDemoUser(username, password);

  if (!isVercelPostgresAvailable) {
    return demoUser;
  }

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
}

export async function saveContent(text) {
  if (!isVercelPostgresAvailable) {
    const savedContent = {
      id: memoryContent.length + 1,
      text,
      created_at: new Date().toISOString()
    };
    memoryContent.push(savedContent);
    return savedContent;
  }

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
}
