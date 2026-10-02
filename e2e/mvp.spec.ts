import { expect, test, type Page } from "@playwright/test";

// Parcours de la définition du MVP (brief §34).

/** Si le site propose un doublon, on indique que le problème est différent. */
async function passDuplicates(page: Page) {
  const different = page.getByRole("button", { name: "Mon problème est différent" });
  const result = page.getByRole("heading", { name: /publié|vérifié avant publication|ne peut pas être publié|Merci de nous avoir écrit/ });
  await expect(different.or(result)).toBeVisible({ timeout: 20_000 });
  if (await different.isVisible()) await different.click();
}

async function openSchool(page: Page, query: string) {
  await page.goto("/");
  const search = page.getByRole("combobox", { name: "Trouve ton lycée" });
  await search.fill(query);
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/lycee\//);
}

test("consultation : homepage → recherche → fiche lycée → confirmer un problème", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("mérite d’être entendu");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 20_000 });

  await openSchool(page, "carnot dijon");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Carnot");
  await expect(page.getByText("Ils ne notent pas l’établissement")).toBeVisible();

  const first = page.locator("li").filter({ has: page.getByRole("button", { name: /Je confirme|Confirmé/ }) }).first();
  if (await first.count()) {
    const button = first.getByRole("button", { name: /Je confirme|Confirmé/ });
    const wasConfirmed = (await button.getAttribute("aria-pressed")) === "true";
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", wasConfirmed ? "false" : "true");
    if (!wasConfirmed) await expect(first.getByText("Ta confirmation a été prise en compte.")).toBeVisible();
    // Une seule confirmation par personne : le second clic retire la confirmation.
    await button.click();
    await expect(button).toHaveAttribute("aria-pressed", wasConfirmed ? "true" : "false");
  }
});

test("dépôt : signaler → lycée → catégorie → description → vérification", async ({ page }) => {
  await page.goto("/signaler");
  await expect(page.getByRole("heading", { name: "Dans quel lycée ?" })).toBeVisible();
  await page.getByRole("combobox", { name: "Recherche ton lycée" }).fill("lycée carnot dijon");
  await page.getByRole("option").first().click();

  await expect(page.getByRole("heading", { name: "Quel est le problème ?" })).toBeVisible();
  await page.getByRole("radio", { name: /Locaux/ }).click();

  await expect(page.getByRole("heading", { name: "Explique-nous ce qui se passe." })).toBeVisible();
  await expect(page.getByText("Ne mentionne pas le nom d’un élève")).toBeVisible();
  const stamp = Date.now().toString(36);
  await page.getByLabel("Titre court").fill(`Lumières du gymnase en panne ${stamp}`);
  await page.getByLabel("Ce qui se passe").fill("Depuis la rentrée, la moitié des lumières du gymnase ne fonctionnent plus, on y voit mal en hiver.");
  await page.getByRole("button", { name: "Continuer" }).click();

  await passDuplicates(page);

  await expect(page.getByRole("heading", { name: /publié|vérifié avant publication|ne peut pas être publié/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Garde ce lien pour suivre ton signalement")).toBeVisible();
});

test("dépôt : un contenu nominatif n'est jamais publié directement", async ({ page }) => {
  await page.goto("/signaler?lycee=lycee-general-et-technologique-carnot-dijon");
  await page.getByRole("radio", { name: /Cours/ }).click();
  await page.getByLabel("Titre court").fill(`M. Dupont ne fait jamais cours ${Date.now().toString(36)}`);
  await page.getByLabel("Ce qui se passe").fill("M. Dupont est absent tout le temps et ne prévient jamais personne.");
  await page.getByRole("button", { name: "Continuer" }).click();
  await passDuplicates(page);
  await expect(page.getByRole("heading", { name: /vérifié avant publication|ne peut pas être publié/ })).toBeVisible({ timeout: 20_000 });
});

test("dépôt : validation des champs", async ({ page }) => {
  await page.goto("/signaler?lycee=lycee-general-et-technologique-carnot-dijon");
  await page.getByRole("radio", { name: /Locaux/ }).click();
  await page.getByLabel("Titre court").fill("froid");
  await page.getByLabel("Ce qui se passe").fill("trop court");
  await page.getByRole("button", { name: "Continuer" }).click();
  await expect(page.getByText("Titre : 8 caractères minimum.")).toBeVisible();
  await expect(page.getByText("Description : 20 caractères minimum.")).toBeVisible();
});

test("carte : filtres et zoom sur une région", async ({ page }) => {
  await page.goto("/#carte");
  await expect(page.locator(".maplibregl-canvas")).toBeVisible({ timeout: 20_000 });
  // Bulles régionales (beaucoup de lycées) ou points directement (peu de lycées).
  await expect(page.locator(".maplibregl-marker").first()).toBeVisible();
  await page.getByRole("button", { name: /Sécurité/ }).first().click();
  await expect(page.getByRole("button", { name: /Sécurité/ }).first()).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("radio", { name: "30 jours" }).click();
  const mobs = page.getByRole("radiogroup", { name: "Mobilisations lycéennes" });
  await mobs.getByRole("radio", { name: "Masquer" }).click();
  await expect(page.locator(".sl-mob-badge, .sl-marker-mob")).toHaveCount(0);
  await mobs.getByRole("radio", { name: "Afficher" }).click();
  await expect(mobs.getByRole("radio", { name: "Afficher" })).toHaveAttribute("aria-checked", "true");
  // Trois crans de zoom : depuis la vue France (plus éloignée sur mobile), on passe au niveau région.
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Zoomer", exact: true }).click();
    await page.waitForTimeout(400);
  }
  await expect(page.getByRole("button", { name: "France entière" })).toBeVisible();
});

test("pages publiques sans débordement horizontal", async ({ page }) => {
  for (const url of ["/", "/signaler", "/signaler?lycee=section-d-enseignement-professionnel-du-lycee-des-metiers-du-transport-de-la-logistique-et", "/comment-ca-marche", "/regles", "/aide", "/confidentialite", "/contact", "/presse", "/affiches", "/affiches/section-d-enseignement-professionnel-du-lycee-des-metiers-du-transport-de-la-logistique-et", "/lycee/lycee-general-et-technologique-carnot-dijon", "/lycee/lycee-jean-jaures-argenteuil", "/lycee/lycee-giocante-de-casabianca-bastia"]) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, url).toBeLessThanOrEqual(1);
  }
});

test("affiches : choisir son lycée donne une affiche et des flyers avec QR code", async ({ page }) => {
  await page.goto("/affiches");
  await page.getByRole("combobox", { name: "Ton lycée" }).fill("carnot dijon");
  await page.getByRole("option").first().click();
  await expect(page).toHaveURL(/\/affiches\/lycee-/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Carnot");
  await expect(page.locator(".poster-sheet.is-a4 .poster-qr svg")).toBeVisible();
  await page.getByRole("radio", { name: "4 flyers A6" }).click();
  await expect(page.locator(".poster-sheet.is-flyers .poster-qr svg")).toHaveCount(4);
  await expect(page.getByRole("button", { name: /Imprimer/ })).toBeVisible();
});

test("admin inaccessible sans session", async ({ page }) => {
  await page.goto("/admin/moderation");
  await expect(page).toHaveURL(/\/admin\/connexion/);
});

test.describe("recherche autour de moi", () => {
  test.use({ geolocation: { latitude: 47.3215, longitude: 5.0412 }, permissions: ["geolocation"] });
  test("le bouton de localisation propose les lycées les plus proches", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Trouver les lycées autour de moi" }).first().click();
    await expect(page.getByText("Lycées autour de toi").first()).toBeVisible();
    await expect(page.getByRole("option").first()).toContainText("Dijon");
    await page.getByRole("option").first().click();
    await expect(page).toHaveURL(/\/lycee\//);
  });
});
