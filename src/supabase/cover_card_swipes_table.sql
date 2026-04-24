CREATE TABLE cover_card_swipes (
  id         BIGSERIAL PRIMARY KEY,
  "userId"   TEXT      NOT NULL,
  "roomId"   TEXT      NOT NULL,
  "swipedAt" BIGINT    NOT NULL,
  UNIQUE ("userId", "roomId")
);

CREATE INDEX idx_cover_card_swipes_user_id ON cover_card_swipes ("userId");
