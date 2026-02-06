export const getNoirEmailTemplate = (title: string, message: string, ctaLink?: string, ctaText?: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #050505; color: #d4d4d4; font-family: 'Courier New', Courier, monospace; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid #c5a059; }
        .header { background-color: #080808; padding: 20px; text-align: center; border-bottom: 1px solid #333; }
        .logo { color: #c5a059; font-size: 20px; font-weight: bold; text-decoration: none; letter-spacing: 4px; }
        .content { padding: 40px 30px; text-align: left; }
        h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; border-left: 3px solid #c5a059; padding-left: 15px; }
        .btn { display: inline-block; background-color: #c5a059; color: #000; padding: 14px 28px; text-decoration: none; font-weight: bold; margin-top: 20px; }
        .footer { background-color: #080808; padding: 20px; text-align: center; font-size: 10px; color: #444; border-top: 1px solid #333; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><a href="https://thesinsofthefathers.com" class="logo">TSOF // INTEL</a></div>
        <div class="content">
          <h1>${title}</h1>
          <p>${message}</p>
          ${ctaLink ? `<div style="text-align:center"><a href="${ctaLink}" class="btn">${ctaText || "ACCESS"}</a></div>` : ""}
        </div>
        <div class="footer">
          <p>TOP SECRET // EYES ONLY</p>
          <p>&copy; 2026 The Sins of the Fathers.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
