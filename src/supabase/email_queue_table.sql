CREATE TABLE email_queue (
  id           TEXT        PRIMARY KEY,
  "userId"     TEXT        NOT NULL,
  "emailType"  TEXT        NOT NULL,
  priority     INT         NOT NULL,
  "postId"     TEXT        NOT NULL,
  data         JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'pending',
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_queue_status    ON email_queue (status);
CREATE INDEX idx_email_queue_user_id   ON email_queue ("userId");
CREATE INDEX idx_email_queue_created   ON email_queue ("createdAt");
