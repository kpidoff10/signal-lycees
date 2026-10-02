import { defineConfig, devices } from "@playwright/test";

// Lancer contre un serveur déjà démarré (BASE_URL), données de développement (npm run db:seed).
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    // Aperçu protégé par mot de passe (PREVIEW_USER / PREVIEW_PASSWORD).
    httpCredentials: process.env.PREVIEW_PASSWORD ? { username: process.env.PREVIEW_USER ?? "kevin", password: process.env.PREVIEW_PASSWORD } : undefined,
  },
  projects: [
    { name: "smartphone", use: { ...devices["Pixel 7"] } },
    { name: "tablette", use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
