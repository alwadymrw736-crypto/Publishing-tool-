export default async function handler(req, res) {
  try {
    const {
      code,
      state
    } = req.query;

    const BASE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      'https://YOUR-DOMAIN.vercel.app';

    const APP_ID = process.env.META_APP_ID;
    const APP_SECRET = process.env.META_APP_SECRET;

    const redirectUri = `${BASE_URL}/api/oauth-callback`;

    if (!code) {
      return res.redirect(
        `${BASE_URL}/?conn_error=no_code`
      );
    }

    // exchange code
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${APP_ID}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${APP_SECRET}` +
      `&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return res.redirect(
        `${BASE_URL}/?conn_error=token_failed`
      );
    }

    const accessToken = tokenData.access_token;

    // get pages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`
    );

    const pagesData = await pagesRes.json();

    const firstPage = pagesData?.data?.[0];

    if (!firstPage) {
      return res.redirect(
        `${BASE_URL}/?conn_error=no_pages`
      );
    }

    return res.redirect(
      `${BASE_URL}/` +
      `?conn_ok=1` +
      `&conn_platform=facebook` +
      `&conn_token=${encodeURIComponent(accessToken)}` +
      `&conn_page_id=${firstPage.id}`
    );

  } catch (err) {
    console.error(err);

    return res.redirect(
      `/?conn_error=server_error`
    );
  }
}
