const databaseUrl =
  process.env.POSTGRES_URL ||
  process.env.STORAGE_URL ||
  process.env.STORAGE_POSTGRES_URL ||
  process.env.DATABASE_URL;
const isVercelPostgresAvailable = Boolean(databaseUrl);
const memoryUsers = [{ username: "admin", password_hash: "admin" }];
const memoryContent = [];
const memoryTokens = [];
const tokenExpiresInMs = 7 * 24 * 60 * 60 * 1000;

function createTokenValue() {
  return `${Date.now().toString(36)}-${crypto.randomUUID()}`;
}

async function hashValue(value, salt, iterations = 100000) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(value),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password) {
  const salt = crypto.randomUUID();
  const hash = await hashValue(password, salt);

  return `pbkdf2_sha256$100000$${salt}$${hash}`;
}

async function verifyPassword(password, passwordHash) {
  if (!passwordHash?.startsWith("pbkdf2_sha256$")) {
    return password === passwordHash;
  }

  const [, iterations, salt, storedHash] = passwordHash.split("$");
  const hash = await hashValue(password, salt, Number(iterations));

  return hash === storedHash;
}

function getTokenExpiresAt() {
  return new Date(Date.now() + tokenExpiresInMs).toISOString();
}

async function getSql() {
  if (!process.env.POSTGRES_URL && databaseUrl) {
    process.env.POSTGRES_URL = databaseUrl;
  }

  const { sql } = await import("@vercel/postgres");
  return sql;
}

async function getDemoUser(username, password) {
  const user = memoryUsers.find((memoryUser) => memoryUser.username === username);

  if (!user) {
    return null;
  }

  const isValidPassword = await verifyPassword(password, user.password_hash);

  return isValidPassword ? { username: user.username } : null;
}

async function ensureUsersTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      username TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      password_hash TEXT
    )
  `;
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS password_hash TEXT
  `;
  await sql`
    INSERT INTO users (username, password, password_hash)
    VALUES ('admin', 'admin', ${await hashPassword("admin")})
    ON CONFLICT (username) DO NOTHING
  `;
}

async function ensureAuthTokensTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      token TEXT PRIMARY KEY,
      username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE auth_tokens
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
  `;
  await sql`
    UPDATE auth_tokens
    SET expires_at = NOW() + INTERVAL '7 days'
    WHERE expires_at IS NULL
  `;
  await sql`
    ALTER TABLE auth_tokens
    ALTER COLUMN expires_at SET NOT NULL
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
  const passwordHash = await hashPassword(password);

  if (!isVercelPostgresAvailable) {
    const existingUser = memoryUsers.find((memoryUser) => memoryUser.username === username);

    if (existingUser) {
      return null;
    }

    memoryUsers.push({ username, password_hash: passwordHash });
    return { username };
  }

  const sql = await getSql();
  await ensureUsersTable(sql);

  const { rows } = await sql`
    INSERT INTO users (username, password, password_hash)
    VALUES (${username}, '', ${passwordHash})
    ON CONFLICT (username) DO NOTHING
    RETURNING username
  `;

  return rows[0] ?? null;
}

export async function createAuthToken(username) {
  const token = createTokenValue();
  const expiresAt = getTokenExpiresAt();

  if (!isVercelPostgresAvailable) {
    memoryTokens.push({ token, username, expires_at: expiresAt, created_at: new Date().toISOString() });
    return token;
  }

  const sql = await getSql();
  await ensureUsersTable(sql);
  await ensureAuthTokensTable(sql);

  await sql`
    INSERT INTO auth_tokens (token, username, expires_at)
    VALUES (${token}, ${username}, ${expiresAt})
  `;

  return token;
}

export async function findUserByToken(token) {
  if (!token) {
    return null;
  }

  if (!isVercelPostgresAvailable) {
    const authToken = memoryTokens.find((memoryToken) => memoryToken.token === token);
    if (!authToken || new Date(authToken.expires_at).getTime() <= Date.now()) {
      return null;
    }
    return authToken ? { username: authToken.username } : null;
  }

  const sql = await getSql();
  await ensureUsersTable(sql);
  await ensureAuthTokensTable(sql);

  const { rows } = await sql`
    SELECT username FROM auth_tokens
    WHERE token = ${token} AND expires_at > NOW()
    LIMIT 1
  `;

  return rows[0] ?? null;
}

export async function findUser(username, password) {
  const demoUser = await getDemoUser(username, password);

  if (!isVercelPostgresAvailable) {
    return demoUser;
  }

  if (isVercelPostgresAvailable) {
    const sql = await getSql();

    await ensureUsersTable(sql);

    const { rows } = await sql`
      SELECT username, password, password_hash FROM users
      WHERE username = ${username}
      LIMIT 1
    `;
    const user = rows[0];

    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password_hash || user.password);

    if (!isValidPassword) {
      return null;
    }

    if (!user.password_hash) {
      await sql`
        UPDATE users
        SET password_hash = ${await hashPassword(password)}, password = ''
        WHERE username = ${username}
      `;
    }

    return { username: user.username };
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
