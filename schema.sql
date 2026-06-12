-- ============================================================
--  Portal Tantauco — Schema D1
--  Aplica con: npx wrangler d1 execute portaltantauco-db --file=schema.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT    NOT NULL,
  color     TEXT    NOT NULL DEFAULT '#14b8a6',
  avatar    TEXT    NOT NULL DEFAULT '🐺',
  text      TEXT    NOT NULL,
  time      TEXT    NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Índice para acelerar la consulta de los últimos mensajes
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp DESC);
