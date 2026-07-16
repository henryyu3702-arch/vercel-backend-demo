const databaseUrl = process.env.POSTGRES_URL || process.env.STORAGE_URL;
const isVercelPostgresAvailable = Boolean(databaseUrl);
const memoryUsers = [{ username: "admin", password: "admin" }];
const memoryContent = [];

async function getSql() {
  if (!process.env.POSTGRES_URL && process.env.STORAGE_URL) {
    process.env.POSTGRES_URL = process.env.STORAGE_URL;
  }

  const { sql } = await import("@vercel/postgres");
  return sql;
}

function getDemoUser(username, password) {
  const user = memoryUsers.find(
    (memoryUser) => memoryUser.username === username && memoryUser.password === password
  );

  return user ? { username: user.username } : null;
}

async function ensureUsersTable(sql) {
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
}

async function ensureContentTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS content (
      id SERIAL PRIMARY KEY,
      text TEXT NOT NULL,
      author TEXT NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE content
    ADD COLUMN IF NOT EXISTS author TEXT NOT NULL DEFAULT 'admin'
  `;
}

export async function createUser(username, password) {
  if (!isVercelPostgresAvailable) {
    const existingUser = memoryUsers.find((memoryUser) => memoryUser.username === username);

    if (existingUser) {
      return null;
    }

    memoryUsers.push({ username, password });
    return { username };
  }

  const sql = await getSql();
  await ensureUsersTable(sql);

  const { rows } = await sql`
    INSERT INTO users (username, password)
    VALUES (${username}, ${password})
    ON CONFLICT (username) DO NOTHING
    RETURNING username
  `;

  return rows[0] ?? null;
}

export async function findUser(username, password) {
  const demoUser = getDemoUser(username, password);

  if (!isVercelPostgresAvailable) {
    return demoUser;
  }

  if (isVercelPostgresAvailable) {
    const sql = await getSql();

    await ensureUsersTable(sql);

    const { rows } = await sql`
      SELECT username FROM users
      WHERE username = ${username} AND password = ${password}
      LIMIT 1
    `;
    return rows[0] ?? null;
  }
}

export async function saveContent(text, author) {
  if (!isVercelPostgresAvailable) {
    const savedContent = {
      id: memoryContent.length + 1,
      text,
      author,
      created_at: new Date().toISOString()
    };
    memoryContent.push(savedContent);
    return savedContent;
  }

  if (isVercelPostgresAvailable) {
    const sql = await getSql();

    await ensureContentTable(sql);

    const { rows } = await sql`
      INSERT INTO content (text, author)
      VALUES (${text}, ${author})
      RETURNING id, text, author, created_at
    `;
    return rows[0];
  }
}

export async function listContent() {
  if (!isVercelPostgresAvailable) {
    return [...memoryContent].sort((left, right) => right.id - left.id);
  }

  const sql = await getSql();
  await ensureContentTable(sql);

  const { rows } = await sql`
    SELECT id, text, author, created_at
    FROM content
    ORDER BY id DESC
  `;

  return rows;
}
