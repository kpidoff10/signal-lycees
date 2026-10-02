import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_EMAIL, PRESS_EMAIL, PRIVACY_EMAIL } from "@/lib/contact";
import { InfoHeader } from "../(info)/_components/InfoHeader";
import "../(info)/prose.css";
import { ContactForm } from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact et suppression",
  description:
    "Demande la suppression d’un signalement, exerce tes droits sur tes données ou contacte l’éditeur de Signal Lycées (point de contact DSA). Sans compte.",
};

export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const type = first(params.type);
  const ref = first(params.ref)?.slice(0, 100) ?? "";

  return (
    <div className="container-page">
      <div className="sl-info">
        <InfoHeader
          eyebrow="Nous écrire"
          title="Contact et suppression"
          lead="Pour faire supprimer un signalement, exercer tes droits sur tes données, contester une décision de modération ou nous contacter (y compris au titre du DSA)."
        />

        <div className="sl-prose">
          <p>
            Comme il n’y a pas de compte, indique si possible ton <strong>lien de suivi</strong> (reçu après ton signalement) ou
            l’<strong>adresse de la page du problème</strong> : c’est ce qui nous permet de retrouver le signalement concerné. Si tu
            as ton lien de suivi, tu peux aussi demander la suppression directement depuis cette page.
          </p>
          <p>
            Pour signaler un contenu qui vise quelqu’un ou contient des données personnelles, le plus rapide est le bouton{" "}
            <strong>« Signaler un contenu »</strong> sur le problème. Si tu es en danger ou si tu ne vas pas bien, va plutôt sur{" "}
            <Link href="/aide">Besoin d’aide ?</Link>
          </p>

          <ContactForm defaultKind={type === "suppression" ? "DELETION" : type === "contact" ? "CONTACT" : undefined} defaultRef={ref} />

          <h2>Par e-mail</h2>
          <p>
            Tu peux aussi écrire à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Pour tes données personnelles :{" "}
            <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. Journalistes et associations :{" "}
            <a href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL}</a>.
          </p>
          <p>
            Un e-mail nous montre ton adresse. Pour rester anonyme, utilise plutôt le formulaire ci-dessus.
          </p>

          <p className="text-[15px] leading-[22px] text-ink-muted">
            Ta demande est lue par l’éditeur du site. Elle est utilisée uniquement pour y répondre : voir la{" "}
            <Link href="/confidentialite">politique de confidentialité</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
