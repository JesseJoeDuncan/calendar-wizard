import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Compare against a fixed-length buffer first so mismatched lengths don't short-circuit before
  // the timing-safe comparison even runs.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Gates every request behind a single shared username/password (HTTP Basic Auth) when
 * AUTH_PASSWORD is set in the environment. Left unset, this is a no-op — local dev stays
 * frictionless, and only a deployment that opts in by setting the env var gets the prompt.
 */
export function basicAuth(req: Request, res: Response, next: NextFunction) {
  const password = process.env.AUTH_PASSWORD;
  if (!password) return next();
  const username = process.env.AUTH_USERNAME || "team";

  const header = req.headers.authorization;
  if (header?.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    const user = sep === -1 ? decoded : decoded.slice(0, sep);
    const pass = sep === -1 ? "" : decoded.slice(sep + 1);
    if (safeEqual(user, username) && safeEqual(pass, password)) {
      return next();
    }
  }

  res.set("WWW-Authenticate", 'Basic realm="Calendar Wizard"');
  res.status(401).send("Authentication required.");
}
