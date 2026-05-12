export type GoogleProfile = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
};

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

function appUrl(origin?: string) {
  return (origin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function googleRedirectUri(origin?: string) {
  if (origin) return `${appUrl(origin)}/api/auth/google/callback`;
  return process.env.GOOGLE_REDIRECT_URI || `${appUrl()}/api/auth/google/callback`;
}

export function getGoogleOAuthConfig(origin?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_KEY;
  const redirectUri = googleRedirectUri(origin);

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function createGoogleAuthorizationUrl(state: string, origin?: string) {
  const config = getGoogleOAuthConfig(origin);
  if (!config.clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");

  const url = new URL(GOOGLE_AUTH_URL);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("access_type", "online");
  return url;
}

export async function exchangeGoogleCode(code: string, origin?: string): Promise<GoogleProfile> {
  const config = getGoogleOAuthConfig(origin);
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Google OAuth is missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
  }

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text().catch(() => "");
    throw new Error(details || "Google token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenData.access_token) throw new Error("Google did not return an access token");

  const profileResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!profileResponse.ok) {
    const details = await profileResponse.text().catch(() => "");
    throw new Error(details || "Google profile lookup failed");
  }

  const profile = (await profileResponse.json()) as GoogleProfile;
  if (!profile.email || !profile.email_verified) {
    throw new Error("Google account email is not verified");
  }

  return profile;
}
