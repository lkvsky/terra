import { createHmac, timingSafeEqual } from "crypto";

const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return secret;
}

export function generateActionToken(
  tripId: string,
  action: "approve" | "reject"
): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${tripId}|${action}|${expiresAt}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyActionToken(
  token: string
): { tripId: string; action: "approve" | "reject" } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;

    const [tripId, action, expiresAtStr, sig] = parts;

    if (action !== "approve" && action !== "reject") return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Date.now() > expiresAt) return null;

    const payload = `${tripId}|${action}|${expiresAtStr}`;
    const expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    return { tripId, action };
  } catch {
    return null;
  }
}
