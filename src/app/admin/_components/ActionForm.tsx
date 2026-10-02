"use client";

import { startTransition, useActionState, useEffect, useRef, type ReactNode } from "react";
import type { ActionState } from "@/server/admin/forms";

type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

/**
 * Formulaire relié à une action serveur : message de retour, boutons désactivés
 * pendant l'envoi, confirmation facultative. Les champs ne sont pas vidés en cas
 * d'erreur (pas de réinitialisation automatique).
 */
export function ActionForm({
  action,
  children,
  className = "adm-form",
  confirmMessage,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
        const fd = new FormData(e.currentTarget, submitter);
        startTransition(() => dispatch(fd));
      }}
    >
      <fieldset disabled={pending} className="adm-form">
        {children}
      </fieldset>
      {state.error && (
        <p role="alert" className="adm-msg adm-msg-error">
          {state.error}
        </p>
      )}
      {state.message && !state.error && (
        <p role="status" className="adm-msg adm-msg-ok">
          {state.message}
        </p>
      )}
    </form>
  );
}
