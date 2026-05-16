CREATE TABLE room_views (
  id           BIGSERIAL PRIMARY KEY,
  "userId"     TEXT      NOT NULL,
  "roomId"     TEXT      NOT NULL,
  "lastSeenAt" BIGINT    NOT NULL,
  UNIQUE ("userId", "roomId")
);

CREATE INDEX idx_room_views_user_id ON room_views ("userId");
