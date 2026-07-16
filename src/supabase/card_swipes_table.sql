CREATE TABLE card_swipes (
  id         BIGSERIAL PRIMARY KEY,
  "userId"   TEXT      NOT NULL,
  "roomId"   TEXT      NOT NULL,
  "cardType" TEXT      NOT NULL,
  "swipedAt" BIGINT    NOT NULL,
  UNIQUE ("userId", "roomId", "cardType")
);

CREATE INDEX idx_card_swipes_user_id ON card_swipes ("userId");
CREATE INDEX idx_card_swipes_user_id_card_type ON card_swipes ("userId", "cardType");
