// api/oauth-callback.js
// Vercel Serverless Function — يستقبل OAuth callback من Meta

export default async function handler(req, res) {
  const { code, platform } = req.query;

  if (!code || !platform) {
    return res.redirect('/?error=missing_params');
  }

  const APP_ID     = process.env.META_APP_ID;
  const APP_SECRET = process.env.META_APP_SECRET;
  const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
  const REDIRECT   = `${BASE_URL}/api/oauth-callback?platform=${platform}`;

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${APP_ID}&client_secret=${APP_SECRET}&redirect_uri=${encodeURIComponent(REDIRECT)}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return res.redirect(`/?error=${encodeURIComponent(tokenData.error.message)}`);
    }

    const userToken = tokenData.access_token;

    // 2. Get long-lived token
    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${APP_ID}&client_secret=${APP_SECRET}&fb_exchange_token=${userToken}`
    );
    const llData = await llRes.json();
    const longToken = llData.access_token || userToken;

    if (platform === 'facebook') {
      // 3a. Get Pages list
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`
      );
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];

      if (!page) {
        return res.redirect('/?error=no_pages_found');
      }

      return res.redirect(
        `/?platform=facebook&token=${encodeURIComponent(page.access_token)}&page_id=${page.id}`
      );

    } else if (platform === 'instagram') {
      // 3b. Get Instagram Business Account
      const pagesRes = await fetch(
        `https://graph.facebook.com/v19.0/me/accounts?access_token=${longToken}`
      );
      const pagesData = await pagesRes.json();
      const page = pagesData.data?.[0];

      if (!page) return res.redirect('/?error=no_pages_found');

      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();
      const igId = igData.instagram_business_account?.id;

      if (!igId) {
        return res.redirect('/?error=no_instagram_business_account');
      }

      return res.redirect(
        `/?platform=instagram&token=${encodeURIComponent(page.access_token)}&page_id=${igId}`
      );
    }

  } catch (e) {
    return res.redirect(`/?error=${encodeURIComponent(e.message)}`);
  }
}
