import { Hono } from "npm:hono";

const app = new Hono();

app.get("/make-server-f1a393b4/dev/email-previews", async (c) => {
  const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>What You Missed</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #030213;
          color: #ffffff;
          padding: 32px 24px;
          text-align: center;
        }
        .content {
          padding: 32px 24px;
        }
        .footer {
          padding: 24px;
          text-align: center;
          color: #717182;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 28px;">What You Missed</h1>
        </div>
        <div class="content">
          <p>Email content will go here...</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">Heard - Debate App</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return c.html(emailHtml);
});

export { app as devApi };