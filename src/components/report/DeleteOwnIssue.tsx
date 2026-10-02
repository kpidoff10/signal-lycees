"use client";

import { useState, useTransition } from "react";
import { deleteOwnIssueAction } from "@/app/actions/issues";
import { Button, ButtonLink } from "@/components/ui/Button";

export function DeleteOwnIssue({ token, schoolSlug }: { token: string; schoolSlug: string }) {
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done)
    return (
      <div className="grid gap-3">
        <p role="status" className="font-semibold text-resolved">
          Ton signalement a été supprimé.
        </p>
        <ButtonLink href={`/lycee/${schoolSlug}`} variant="secondary">
          Retour à la fiche du lycée
        </ButtonLink>
      </div>
    );

  return (
    <div className="grid gap-3">
      {!confirming ? (
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Supprimer mon signalement
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteOwnIssueAction({ token });
                if (r.ok) setDone(true);
                else setError(r.error);
              })
            }
          >
            Oui, supprimer définitivement
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Annuler
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm font-semibold text-signal-ink">
          {error}
        </p>
      )}
    </div>
  );
}
