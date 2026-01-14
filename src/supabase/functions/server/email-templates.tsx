export const getMagicLinkEmail = (magicLinkUrl: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login to Heard</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f5f5f5;">
  <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="color: #8B5CF6; font-size: 2.5rem; margin: 0;">Heard</h1>
    </div>
    
    <h2 style="color: #333; font-size: 1.5rem; margin: 0 0 16px 0;">Login to Your Account</h2>
    
    <p style="color: #555; line-height: 1.6; margin: 0 0 24px 0;">
      Click the button below to log in to your Heard account. This link will expire in 15 minutes.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${magicLinkUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: bold; font-size: 1.1rem; box-shadow: 0 4px 12px rgba(102,126,234,0.3);">
        Log In to Heard
      </a>
    </div>
    
    <p style="color: #666; font-size: 0.9rem; margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e0e0e0;">
      If you didn't request this login link, you can safely ignore this email.
    </p>
  </div>
</body>
</html>
  `;
};
