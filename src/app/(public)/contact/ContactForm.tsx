"use client";

import Link from "next/link";
import { useActionState, useId, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { submitContactRequest, type ContactState } from "./actions";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

type Kind = "DELETION" | "CONTACT";

const KINDS: { value: Kind; label: string; hint: string }[] = [
  { value: "DELETION", label: "Supprimer un signalement", hint: "Le tien, ou un signalement qui te concerne." },
  { value: "CONTACT", label: "Autre demande ou contact DSA", hint: "Question, droits sur tes données, contestation, autorités…" },
];

const initialState: ContactState = { status: "idle" };

export function ContactForm({ defaultKind, defaultRef = "" }: { defaultKind?: Kind; defaultRef?: string }) {
  const [state, action, pending] = useActionState(submitContactRequest, initialState);
  const [kind, setKind] = useState<Kind | undefined>(defaultKind);
  const [ref, setRef] = useState(defaultRef);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const id = useId();
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  if (state.status === "success") {
    return (
      <div className="sl-callout is-resolved" role="status" aria-live="polite">
        <p className="sl-callout-title">
          <Icon name="check" size={20} className="mr-2 inline-block align-[-3px]" />
          Ta demande a bien été envoyée
        </p>
        <p>
          {state.kind === "DELETION"
            ? "Elle sera traitée par l’éditeur du site dans les meilleurs délais."
            : "Elle sera lue par l’éditeur du site dans les meilleurs délais."}{" "}
          {state.issueFound
            ? "Le signalement mentionné a bien été retrouvé."
            : ref.trim()
              ? "Nous n’avons pas reconnu automatiquement le signalement indiqué : l’éditeur le cherchera à la main."
              : null}
        </p>
        {!contact.trim() && (
          <p>Comme tu n’as pas laissé de moyen de contact, tu ne recevras pas de réponse directe.</p>
        )}
        <p>
          <ButtonLink href="/" variant="secondary">
            Retour à la carte
          </ButtonLink>
        </p>
      </div>
    );
  }

  const messageLength = message.trim().length;

  return (
    <form action={action} noValidate className="grid gap-6" aria-describedby={state.status === "error" ? `${id}-error` : undefined}>
      {state.status === "error" && state.message && (
        <div id={`${id}-error`} className="sl-callout is-signal" role="alert">
          <p className="font-semibold">{state.message}</p>
        </div>
      )}

      <fieldset className="grid gap-2" aria-describedby={errors.kind ? `${id}-kind-err` : undefined}>
        <legend className="mb-2 text-[17px] font-bold">
          Type de demande <span className="font-normal text-ink-muted">(obligatoire)</span>
        </legend>
        {KINDS.map((k) => (
          <label
            key={k.value}
            className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border bg-surface p-4 ${
              kind === k.value ? "border-signal" : "border-border"
            }`}
          >
            <input
              type="radio"
              name="kind"
              value={k.value}
              checked={kind === k.value}
              onChange={() => setKind(k.value)}
              required
              className="mt-1 size-5 flex-none accent-[var(--signal)]"
            />
            <span>
              <span className="block font-semibold">{k.label}</span>
              <span className="block text-[15px] leading-[22px] text-ink-muted">{k.hint}</span>
            </span>
          </label>
        ))}
        {errors.kind && (
          <p id={`${id}-kind-err`} className="text-[15px] font-semibold text-signal-ink">
            {errors.kind}
          </p>
        )}
      </fieldset>

      <div className="grid gap-2">
        <label htmlFor={`${id}-ref`} className="text-[17px] font-bold">
          Lien ou identifiant du signalement <span className="font-normal text-ink-muted">(facultatif)</span>
        </label>
        <p id={`${id}-ref-hint`} className="text-[15px] leading-[22px] text-ink-muted">
          Ton lien de suivi (…/suivi/…) ou l’adresse de la page du problème (…/probleme/…).
        </p>
        <input
          id={`${id}-ref`}
          name="issueId"
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          className="field"
          aria-invalid={errors.issueId ? true : undefined}
          aria-describedby={`${id}-ref-hint${errors.issueId ? ` ${id}-ref-err` : ""}`}
        />
        {errors.issueId && (
          <p id={`${id}-ref-err`} className="text-[15px] font-semibold text-signal-ink">
            {errors.issueId}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${id}-msg`} className="text-[17px] font-bold">
          Ton message <span className="font-normal text-ink-muted">(obligatoire)</span>
        </label>
        <p id={`${id}-msg-hint`} className="text-[15px] leading-[22px] text-ink-muted">
          Explique ta demande. N’écris pas d’information qui permette de t’identifier si ce n’est pas nécessaire.
        </p>
        <textarea
          id={`${id}-msg`}
          name="message"
          rows={6}
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="field min-h-40 resize-y"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={`${id}-msg-hint ${id}-msg-count${errors.message ? ` ${id}-msg-err` : ""}`}
        />
        <p id={`${id}-msg-count`} className="num text-right text-[13px] text-ink-muted" aria-live="off">
          {messageLength} / {MESSAGE_MAX} caractères{messageLength > 0 && messageLength < MESSAGE_MIN ? ` (${MESSAGE_MIN} minimum)` : ""}
        </p>
        {errors.message && (
          <p id={`${id}-msg-err`} className="text-[15px] font-semibold text-signal-ink">
            {errors.message}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <label htmlFor={`${id}-contact`} className="text-[17px] font-bold">
          Moyen de te recontacter <span className="font-normal text-ink-muted">(facultatif)</span>
        </label>
        <p id={`${id}-contact-hint`} className="sl-callout text-[15px] leading-[22px]">
          <strong>Facultatif — ne laisse un moyen de te recontacter que si tu le souhaites.</strong> Une adresse e-mail par exemple.
          Il servira uniquement à te répondre. Sans ça, ta demande est quand même traitée.
        </p>
        <input
          id={`${id}-contact`}
          name="contact"
          type="text"
          autoComplete="off"
          maxLength={200}
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="field"
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={`${id}-contact-hint${errors.contact ? ` ${id}-contact-err` : ""}`}
        />
        {errors.contact && (
          <p id={`${id}-contact-err`} className="text-[15px] font-semibold text-signal-ink">
            {errors.contact}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Envoi…" : "Envoyer ma demande"}
        </Button>
        <Link href="/regles" className="link text-[15px]">
          Relire les règles de publication
        </Link>
      </div>
    </form>
  );
}
