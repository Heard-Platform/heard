CREATE TABLE room_follows (
  id           BIGSERIAL PRIMARY KEY,
  "userId"     TEXT      NOT NULL,
  "roomId"     TEXT      NOT NULL,
  "followedAt" BIGINT    NOT NULL,
  UNIQUE ("userId", "roomId")
);

CREATE INDEX idx_room_follows_user_id ON room_follows ("userId");
