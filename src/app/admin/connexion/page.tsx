import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/admin/auth";
import { ActionForm } from "../_components/ActionForm";
import { loginAction } from "./actions";

export const metadata: Metadata = { title: "Connexion", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdminSession()) redirect("/admin");
  return (
    <div className="mx-auto w-full max-w-sm py-6">
      <div className="adm-card">
        <h1 className="adm-h1">Administration</h1>
        <p className="adm-sub">Accès réservé à l&apos;équipe de modération.</p>
        <ActionForm action={loginAction}>
          <label className="adm-label">
            Identifiant
            <input name="username" className="field" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={64} />
          </label>
          <label className="adm-label">
            Mot de passe
            <input name="password" type="password" className="field" autoComplete="current-password" required maxLength={256} />
          </label>
          <label className="adm-label">
            <span>
              Code à 6 chiffres <span className="adm-hint">(si la double authentification est activée)</span>
            </span>
            <input name="code" className="field" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7} />
          </label>
          <button type="submit" className="sl-btn sl-btn-primary sl-btn-block">
            Se connecter
          </button>
        </ActionForm>
      </div>
    </div>
  );
}
