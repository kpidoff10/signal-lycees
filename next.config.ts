import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const dev = process.env.NODE_ENV !== "production";

// CSP : Turnstile (Cloudflare) et Plausible sont les seuls tiers autorisés.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com https://plausible.io`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' https://plausible.io https://challenges.cloudflare.com${dev ? " ws: wss:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
securityHeaders.push({ key: "Content-Security-Policy", value: csp });

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Développement via Docker : le navigateur de test accède au serveur par 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost", ...(process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean) ?? [])],
  // forbidden() pour un vrai 403 dans l'admin.
  experimental: { authInterrupts: true },
  // Polices des images de partage, lues depuis le disque au rendu.
  outputFileTracingIncludes: { "/**/opengraph-image*": ["./assets/og/*.ttf"] },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
