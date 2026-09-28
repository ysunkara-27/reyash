CREATE TABLE IF NOT EXISTS atlas_state (id INTEGER PRIMARY KEY CHECK(id=1), body TEXT NOT NULL, lease_until INTEGER NOT NULL DEFAULT 0, lease_token TEXT);
INSERT OR IGNORE INTO atlas_state (id,body) VALUES (1,'{"version":1,"quotes":{},"routes":[],"enabled":false,"intervalDays":30,"attempts":[],"message":"Ready for initial import."}');
