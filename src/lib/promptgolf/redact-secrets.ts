const AUTHORIZATION_SECRET = /\b(Bearer|Basic)\s+[^\s,;"']+/gi;
const PROVIDER_KEY = /\b(?:sk|pk|key)-[A-Za-z0-9_-]{8,}/gi;
const SECRET_ASSIGNMENT = /\b([A-Z][A-Z0-9_]*(?:API_KEY|ACCESS_TOKEN|AUTH_TOKEN|SECRET))\s*=\s*([^\s,;]+)/g;
const JSON_SECRET = /(["'](?:api[_-]?key|access[_-]?token|auth[_-]?token|authorization|secret)["']\s*:\s*["'])([^"']+)(["'])/gi;
const QUERY_SECRET = /([?&](?:api[_-]?key|access[_-]?token|auth[_-]?token|token)=)([^&#\s]+)/gi;
const URL_CREDENTIALS = /(https?:\/\/)([^\s/@:]+):([^\s/@]+)@/gi;

/** Redacts credential-shaped values before provider failures or logs cross a public boundary. */
export function redactSecrets(input: string, maxLength = 1000) {
  return input
    .replace(AUTHORIZATION_SECRET, "$1 [redacted]")
    .replace(PROVIDER_KEY, "[redacted-key]")
    .replace(SECRET_ASSIGNMENT, "$1=[redacted]")
    .replace(JSON_SECRET, "$1[redacted]$3")
    .replace(QUERY_SECRET, "$1[redacted]")
    .replace(URL_CREDENTIALS, "$1[redacted]@")
    .slice(0, maxLength);
}
