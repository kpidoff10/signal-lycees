// Le jeton anti-robot n'est demandé qu'au premier geste (création de l'identité
// anonyme) : on tente sans jeton, et on ne lance Turnstile que si le serveur le réclame.
export async function withCaptcha<R extends { ok: boolean; code?: string }>(
  run: (token: string | null) => Promise<R>,
  getToken: () => Promise<string | null>,
): Promise<R> {
  const first = await run(null);
  if (first.ok || first.code !== "captcha") return first;
  return run(await getToken());
}
