export const PSN_OAUTH_URL = "https://ca.account.sony.com/api/authz/v3/oauth";
export const PSN_CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
export const PSN_REDIRECT_URI = "com.scee.psxandroid.scecompcall://redirect";
export const PSN_SCOPE = "psn:mobile.v2.core psn:clientapp";

export function getPsnAuthorizeUrl() {
  const params = new URLSearchParams({
    access_type: "offline",
    client_id: PSN_CLIENT_ID,
    redirect_uri: PSN_REDIRECT_URI,
    response_type: "code",
    scope: PSN_SCOPE,
  });
  return `${PSN_OAUTH_URL}/authorize?${params.toString()}`;
}
