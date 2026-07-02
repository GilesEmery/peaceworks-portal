import crypto from "crypto";

export const DEV_PEACE_PROFILES_COOKIE_NAME = "dev_peace_profiles_access";
export const DEV_PEACE_PROFILES_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 6;
export const DEV_PEACE_PROFILES_COOKIE_PATH = "/dev/peace-profiles";

type DevPeaceProfilesAuthConfig =
  | {
      isConfigured: true;
      password: string;
      secret: string;
    }
  | {
      isConfigured: false;
      password: "";
      secret: "";
    };

export function getDevPeaceProfilesAuthConfig(): DevPeaceProfilesAuthConfig {
  const password = process.env.DEV_PEACE_PROFILES_PASSWORD;
  const secret = process.env.DEV_PEACE_PROFILES_AUTH_SECRET;

  if (!password || !secret) {
    return {
      isConfigured: false,
      password: "",
      secret: "",
    };
  }

  return {
    isConfigured: true,
    password,
    secret,
  };
}

export function createDevPeaceProfilesCookieValue(secret: string) {
  const issuedAt = Math.floor(Date.now() / 1000).toString();
  const signature = signCookiePayload(issuedAt, secret);

  return `${issuedAt}.${signature}`;
}

export function isValidDevPeaceProfilesCookie(value: string, secret: string) {
  const [issuedAt, signature] = value.split(".");

  if (!issuedAt || !signature) return false;

  const issuedAtSeconds = Number(issuedAt);
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (!Number.isFinite(issuedAtSeconds)) return false;
  if (issuedAtSeconds > nowSeconds) return false;
  if (nowSeconds - issuedAtSeconds > DEV_PEACE_PROFILES_COOKIE_MAX_AGE_SECONDS) {
    return false;
  }

  const expectedSignature = signCookiePayload(issuedAt, secret);

  return timingSafeEqual(signature, expectedSignature);
}

function signCookiePayload(payload: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

function timingSafeEqual(value: string, expectedValue: string) {
  const valueBuffer = Buffer.from(value);
  const expectedValueBuffer = Buffer.from(expectedValue);

  if (valueBuffer.length !== expectedValueBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedValueBuffer);
}
