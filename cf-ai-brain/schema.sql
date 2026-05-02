CREATE TABLE IF NOT EXISTS lore (
  id TEXT PRIMARY KEY,
  text TEXT NOT NULL,
  source TEXT
);

CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL,
  threatLevel TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bloodline_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  relationType TEXT NOT NULL,
  FOREIGN KEY(source_id) REFERENCES entities(id),
  FOREIGN KEY(target_id) REFERENCES entities(id)
);
