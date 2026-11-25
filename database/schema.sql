-- Схема бази даних Windows Evolution (SQLite)

CREATE TABLE IF NOT EXISTS os_versions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    slug             TEXT NOT NULL UNIQUE,
    name             TEXT NOT NULL,
    line             TEXT NOT NULL CHECK (line IN ('DOS','NT','CE')),
    category         TEXT NOT NULL DEFAULT 'desktop' CHECK (category IN ('desktop','beta','server','device')),
    kernel           TEXT,
    release_date     TEXT NOT NULL,           -- YYYY-MM-DD
    version          TEXT,
    build            TEXT,
    architecture     TEXT,
    bits             INTEGER,
    min_cpu_text     TEXT,
    min_cpu_mhz      REAL,
    rec_cpu_text     TEXT,
    min_ram_mb       REAL,
    rec_ram_mb       REAL,
    min_disk_mb      REAL,
    rec_disk_mb      REAL,
    disk_text        TEXT,
    directx          TEXT,
    file_systems     TEXT,
    support_end      TEXT,                    -- YYYY-MM-DD або NULL
    support_status   TEXT NOT NULL CHECK (support_status IN ('supported','ended','prerelease')),
    ui_summary       TEXT,
    security_summary TEXT,
    performance_note TEXT,
    summary          TEXT,
    significance     TEXT,
    data_note        TEXT,
    source           TEXT
);

-- Списки: нововведення, цікаві факти, переваги, недоліки
CREATE TABLE IF NOT EXISTS os_items (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    os_id   INTEGER NOT NULL REFERENCES os_versions(id) ON DELETE CASCADE,
    kind    TEXT NOT NULL CHECK (kind IN ('innovation','fact','pro','con')),
    text    TEXT NOT NULL,
    sort    INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_items_os ON os_items(os_id);
CREATE INDEX IF NOT EXISTS idx_os_release ON os_versions(release_date);

-- ===== Поглиблені дані: редакції, властивості, матриця можливостей =====
CREATE TABLE IF NOT EXISTS os_editions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    os_id   INTEGER NOT NULL REFERENCES os_versions(id) ON DELETE CASCADE,
    name    TEXT NOT NULL,
    sort    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_editions_os ON os_editions(os_id);

CREATE TABLE IF NOT EXISTS os_props (
    os_id   INTEGER NOT NULL REFERENCES os_versions(id) ON DELETE CASCADE,
    key     TEXT NOT NULL,
    value   TEXT NOT NULL,
    PRIMARY KEY (os_id, key)
);

CREATE TABLE IF NOT EXISTS os_features (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    category    TEXT NOT NULL,
    description TEXT NOT NULL,
    sort        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS os_feature_support (
    feature_id INTEGER NOT NULL REFERENCES os_features(id) ON DELETE CASCADE,
    os_id      INTEGER NOT NULL REFERENCES os_versions(id) ON DELETE CASCADE,
    PRIMARY KEY (feature_id, os_id)
);

-- ===== Енциклопедія: системні файли, словник, причини популярності, частки ринку =====
CREATE TABLE IF NOT EXISTS os_components (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    file        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    kind        TEXT NOT NULL,
    location    TEXT,
    description TEXT NOT NULL,
    since       TEXT,
    sort        INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS glossary (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    term       TEXT NOT NULL UNIQUE,
    category   TEXT NOT NULL,
    definition TEXT NOT NULL,
    sort       INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS reasons (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    kind  TEXT NOT NULL CHECK (kind IN ('reason','counter','caveat')),
    title TEXT NOT NULL UNIQUE,
    body  TEXT NOT NULL,
    sort  INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS market_share (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    source   TEXT NOT NULL,
    scope    TEXT NOT NULL,
    period   TEXT NOT NULL,
    os_name  TEXT NOT NULL,
    percent  REAL NOT NULL CHECK (percent >= 0 AND percent <= 100),
    note     TEXT,
    UNIQUE (source, scope, period, os_name)
);
