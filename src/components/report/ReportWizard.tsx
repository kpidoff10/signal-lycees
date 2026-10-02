"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { checkDuplicatesAction, submitIssueAction, voteAction, type DuplicateView, type SubmitResult } from "@/app/actions/issues";
import { HelpResources } from "@/app/(public)/(info)/aide/HelpResources";
import { SchoolSearch } from "@/components/school/SchoolSearch";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TrustLine, TrustNote } from "@/components/ui/TrustNote";
import { track } from "@/lib/analytics";
import { CATEGORIES, category, type CategoryId } from "@/lib/categories";
import { formatNumber, plural, timeAgo } from "@/lib/format";
import { DESCRIPTION_MAX, DESCRIPTION_MIN, issueDraftSchema, TITLE_MAX, TITLE_MIN } from "@/lib/schemas";
import { useTurnstile } from "./useTurnstile";
import { withCaptcha } from "./captcha";

export interface WizardSchool {
  id: string;
  slug: string;
  name: string;
  city: string;
  postalCode: string;
}

type Step = "school" | "category" | "describe" | "duplicates" | "checking" | "done";

const DRAFT_KEY = "signal-lycees:brouillon";

function loadDraft(): { title?: string; description?: string; category?: CategoryId } {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function saveDraft(d: { title: string; description: string; category: CategoryId | null }) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  } catch {
    /* stockage indisponible : pas de brouillon */
  }
}
function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* rien */
  }
}

const STEPS: { id: Step; label: string }[] = [
  { id: "school", label: "Lycée" },
  { id: "category", label: "Problème" },
  { id: "describe", label: "Description" },
  { id: "checking", label: "Vérification" },
];

function Progress({ step }: { step: Step }) {
  const index = step === "duplicates" || step === "done" ? 3 : STEPS.findIndex((s) => s.id === step);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Étapes">
      {STEPS.map((s, i) => (
        <li key={s.id} className="grid gap-1.5" aria-current={i === index ? "step" : undefined}>
          <span className={`h-1.5 rounded-full ${i <= index ? "bg-signal" : "bg-surface-sunken"}`} />
          <span className={`text-[12px] font-semibold ${i === index ? "text-ink" : "text-ink-muted"} max-sm:sr-only`}>{s.label}</span>
        </li>
      ))}
    </ol>
  );
}

export function ReportWizard({ initialSchool }: { initialSchool: WizardSchool | null }) {
  const [step, setStep] = useState<Step>(initialSchool ? "category" : "school");
  const [school, setSchool] = useState<WizardSchool | null>(initialSchool);
  const [cat, setCat] = useState<CategoryId | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"title" | "description" | "form", string>>>({});
  const [duplicates, setDuplicates] = useState<DuplicateView[]>([]);
  const [result, setResult] = useState<Extract<SubmitResult, { ok: true }> | null>(null);
  const [confirmedDuplicate, setConfirmedDuplicate] = useState<DuplicateView | null>(null);
  const [pending, start] = useTransition();
  const { getToken, widget } = useTurnstile();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const started = useRef(false);

  // Brouillon local (stockage du navigateur, absent côté serveur) : relu après l'hydratation.
  useEffect(() => {
    const d = loadDraft();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronisation avec localStorage
    if (d.title) setTitle(d.title);
    if (d.description) setDescription(d.description);
    if (d.category && CATEGORIES.some((c) => c.id === d.category)) setCat(d.category);
  }, []);

  useEffect(() => {
    if (step !== "done") saveDraft({ title, description, category: cat });
  }, [title, description, cat, step]);

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (!started.current && step !== "school") {
      started.current = true;
      track("issue_start");
    }
  }, [step]);

  function draft() {
    return { schoolId: school?.id ?? "", category: cat ?? "", title, description };
  }

  function validateDescription(): boolean {
    const parsed = issueDraftSchema.safeParse(draft());
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const e: typeof errors = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if ((k === "title" || k === "description") && !e[k]) e[k] = issue.message;
    }
    setErrors(e);
    return false;
  }

  function submit() {
    setStep("checking");
    start(async () => {
      const token = await getToken();
      const r = await submitIssueAction({ ...draft(), turnstileToken: token });
      if (!r.ok) {
        setErrors({ form: r.error });
        setStep("describe");
        return;
      }
      clearDraft();
      setResult(r);
      track("issue_submitted", { category: cat!, outcome: r.status });
      setStep("done");
    });
  }

  function next() {
    if (!validateDescription()) return;
    start(async () => {
      const r = await checkDuplicatesAction(draft());
      if (r.ok && r.duplicates.length > 0) {
        setDuplicates(r.duplicates);
        track("duplicate_detected", { category: cat! });
        setStep("duplicates");
      } else if (!r.ok) {
        setErrors({ form: r.error });
      } else {
        submit();
      }
    });
  }

  function confirmDuplicate(d: DuplicateView) {
    start(async () => {
      const r = await withCaptcha((token) => voteAction({ issueId: d.id, choice: "UP", turnstileToken: token }), getToken);
      if (!r.ok) {
        setErrors({ form: r.error });
        return;
      }
      clearDraft();
      track("issue_confirmed", { category: cat! });
      setConfirmedDuplicate({ ...d, upCount: r.upCount });
      setStep("done");
    });
  }

  const h = "font-display text-[28px] font-bold leading-[34px] tracking-[-0.015em] outline-none md:text-[36px] md:leading-[42px]";

  return (
    <div className="mx-auto grid max-w-[640px] grid-cols-[minmax(0,1fr)] gap-8">
      {step !== "done" && <Progress step={step} />}

      {step === "school" && (
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <h1 ref={headingRef} tabIndex={-1} className={h}>
            Dans quel lycée ?
          </h1>
          <SchoolSearch
            label="Recherche ton lycée"
            placeholder="Nom du lycée, ville ou code postal"
            className="!max-w-none"
            autoFocus
            onSelect={(o) => {
              if (o.type !== "school") return;
              setSchool({ id: o.id, slug: o.slug, name: o.name, city: o.city, postalCode: o.postalCode });
              setStep("category");
            }}
          />
          <p className="text-sm text-ink-muted">Tous les lycées de France sont référencés, y compris en outre-mer.</p>
          <TrustNote className="mt-2" />
        </section>
      )}

      {step === "category" && school && (
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <SchoolReminder school={school} onChange={() => setStep("school")} />
          <h1 ref={headingRef} tabIndex={-1} className={h}>
            Quel est le problème ?
          </h1>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Catégorie">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={cat === c.id}
                onClick={() => {
                  setCat(c.id);
                  setStep("describe");
                }}
                className={`grid min-h-[112px] content-start gap-1.5 rounded-[var(--radius-md)] border-[1.5px] p-4 text-left transition-colors ${
                  cat === c.id ? "border-signal bg-signal-soft" : "border-border-strong bg-surface hover:bg-surface-sunken"
                }`}
              >
                <span className="text-[26px] leading-none" aria-hidden="true">
                  {c.emoji}
                </span>
                <span className="font-semibold">{c.label}</span>
                <span className="text-[13px] leading-[18px] text-ink-muted">{c.hint}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {step === "describe" && school && cat && (
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <SchoolReminder school={school} category={cat} onChange={() => setStep("category")} />
          <h1 ref={headingRef} tabIndex={-1} className={h}>
            Explique-nous ce qui se passe.
          </h1>
          <div className="flex gap-3 rounded-[var(--radius-md)] bg-signal-soft p-4 text-[15px]">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-signal-ink" />
            <p>
              <b>Décris uniquement la situation.</b> Ne mentionne pas le nom d’un élève ou d’un membre du personnel, ni rien qui permette de
              le reconnaître. <Link href="/regles" className="link" target="_blank">Voir les règles</Link>
            </p>
          </div>
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              next();
            }}
          >
            <Field label="Titre court" hint={`${title.length}/${TITLE_MAX}`} error={errors.title} id="titre">
              <input
                id="titre"
                className="field"
                value={title}
                maxLength={TITLE_MAX}
                placeholder="Ex. : Plusieurs salles sans chauffage"
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? "titre-err" : undefined}
                onChange={(e) => setTitle(e.target.value)}
                enterKeyHint="next"
              />
            </Field>
            <Field label="Ce qui se passe" hint={`${description.length}/${DESCRIPTION_MAX}`} error={errors.description} id="description">
              <textarea
                id="description"
                className="field min-h-40"
                value={description}
                maxLength={DESCRIPTION_MAX}
                placeholder="Ex. : Depuis lundi, plusieurs salles du bâtiment B n’ont plus de chauffage."
                aria-invalid={!!errors.description}
                aria-describedby={errors.description ? "description-err" : undefined}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
            <p className="text-[13px] text-ink-muted">
              Entre {TITLE_MIN} et {TITLE_MAX} caractères pour le titre, {DESCRIPTION_MIN} à {DESCRIPTION_MAX} pour la description.
            </p>
            <TrustLine link={false} />
            {errors.form && (
              <p role="alert" className="rounded-[var(--radius-md)] border border-signal bg-signal-soft p-3 text-sm font-semibold text-signal-ink">
                {errors.form}
              </p>
            )}
            {widget}
            <Button type="submit" block disabled={pending}>
              {pending ? "Vérification…" : "Continuer"}
            </Button>
          </form>
        </section>
      )}

      {step === "duplicates" && school && cat && (
        <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
          <h1 ref={headingRef} tabIndex={-1} className={h}>
            Ce problème semble déjà avoir été signalé.
          </h1>
          <p className="text-ink-muted">S’il s’agit du même problème, confirme-le : il sera plus visible qu’un nouveau signalement.</p>
          <ul className="grid gap-3">
            {duplicates.map((d) => (
              <li key={d.id} className="grid gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4">
                <p className="text-[13px] text-ink-muted">
                  Signalé {timeAgo(new Date(d.createdAt))} · <b className="num text-ink">{formatNumber(d.upCount)}</b> {plural(d.upCount, "confirmation")}
                </p>
                <p className="text-[17px] font-semibold">{d.title}</p>
                <p className="user-text text-[15px] text-ink-muted">{d.description}</p>
                <Button block disabled={pending} onClick={() => confirmDuplicate(d)}>
                  Oui, c’est le même problème
                </Button>
              </li>
            ))}
          </ul>
          {errors.form && (
            <p role="alert" className="text-sm font-semibold text-signal-ink">
              {errors.form}
            </p>
          )}
          {widget}
          <Button variant="secondary" block disabled={pending} onClick={submit}>
            Mon problème est différent
          </Button>
        </section>
      )}

      {step === "checking" && (
        <section className="grid justify-items-center gap-5 py-16 text-center" aria-busy="true">
          <span className="relative block h-12 w-12" aria-hidden="true">
            <span className="absolute inset-0 animate-ping rounded-full bg-signal-soft" />
            <span className="absolute inset-3 rounded-full bg-signal" />
          </span>
          <h1 ref={headingRef} tabIndex={-1} className={h}>
            Nous vérifions ton signalement…
          </h1>
          <p className="text-ink-muted">Quelques secondes : on s’assure qu’il ne vise personne. Ton identité n’est jamais enregistrée.</p>
        </section>
      )}

      {step === "done" && confirmedDuplicate && (
        <Done heading="Ta confirmation a été prise en compte." headingRef={headingRef}>
          <p>
            {formatNumber(confirmedDuplicate.upCount)} {plural(confirmedDuplicate.upCount, "personne confirme", "personnes confirment")} ce problème.
          </p>
          <ButtonLink href={`/probleme/${confirmedDuplicate.id}`} block>
            Voir le problème
          </ButtonLink>
        </Done>
      )}

      {step === "done" && result && <Result result={result} headingRef={headingRef} />}
    </div>
  );
}

function SchoolReminder({ school, category: cat, onChange }: { school: WizardSchool; category?: CategoryId; onChange: () => void }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
      <span className="min-w-0 flex-1 text-sm">
        <b className="block truncate" title={school.name}>{school.name}</b>
        <span className="text-ink-muted">
          {school.city}
          {cat ? ` · ${category(cat).emoji} ${category(cat).label}` : ""}
        </span>
      </span>
      <button type="button" className="link shrink-0 text-sm" onClick={onChange}>
        Modifier
      </button>
    </div>
  );
}

function Field({ label, hint, error, id, children }: { label: string; hint: string; error?: string; id: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <span className="num text-[13px] text-ink-muted">{hint}</span>
      </div>
      {children}
      {error && (
        <p id={`${id}-err`} className="text-sm font-semibold text-signal-ink">
          {error}
        </p>
      )}
    </div>
  );
}

function Done({ heading, headingRef, children, tone = "resolved" }: { heading: string; headingRef: React.RefObject<HTMLHeadingElement | null>; children: React.ReactNode; tone?: "resolved" | "signal" }) {
  return (
    <section className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
      <span className={`grid h-14 w-14 place-items-center rounded-full ${tone === "resolved" ? "bg-resolved-soft text-resolved" : "bg-signal-soft text-signal-ink"}`} aria-hidden="true">
        <Icon name={tone === "resolved" ? "check" : "info"} size={28} />
      </span>
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-[28px] font-bold leading-[34px] outline-none md:text-[36px] md:leading-[42px]">
        {heading}
      </h1>
      <div className="grid gap-4 text-[16px]">{children}</div>
    </section>
  );
}

function TrackingLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/suivi/${token}` : `/suivi/${token}`;
  return (
    <div className="grid gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <p className="font-semibold">Garde ce lien pour suivre ton signalement</p>
      <p className="text-sm text-ink-muted">C’est la seule façon de le retrouver ou de le supprimer : nous ne te demandons ni compte ni e-mail.</p>
      <code className="break-all rounded-[var(--radius-sm)] bg-surface-sunken p-2 text-[13px]">{url}</code>
      <Button
        variant="secondary"
        size="sm"
        icon={copied ? "check" : "link"}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
          } catch {
            /* presse-papiers indisponible */
          }
        }}
      >
        {copied ? "Lien copié" : "Copier le lien"}
      </Button>
    </div>
  );
}

function Result({ result, headingRef }: { result: Extract<SubmitResult, { ok: true }>; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  if (result.showHelp) {
    return (
      <Done heading="Merci de nous avoir écrit." headingRef={headingRef} tone="signal">
        <p>
          Ce que tu décris semble difficile à vivre. Tu n’es pas seul·e : des personnes peuvent t’écouter tout de suite, gratuitement et
          sans jugement.
        </p>
        <HelpResources />
        <p className="text-sm text-ink-muted">Ton message ne sera pas publié tel quel ; une personne de l’équipe va le lire.</p>
        <TrackingLink token={result.trackingToken} />
      </Done>
    );
  }
  if (result.status === "PUBLISHED") {
    return (
      <Done heading="Ton signalement est publié." headingRef={headingRef}>
        <p>
          Merci ! Il a passé la vérification et apparaît maintenant, de façon anonyme, sur la fiche de ton lycée et sur la carte. D’autres
          élèves pourront le confirmer.
        </p>
        <TrackingLink token={result.trackingToken} />
        <ButtonLink href={`/probleme/${result.issueId}`} block>
          Voir mon signalement
        </ButtonLink>
        <ButtonLink href={`/lycee/${result.schoolSlug}`} variant="secondary" block>
          Voir la fiche du lycée
        </ButtonLink>
      </Done>
    );
  }
  if (result.status === "REJECTED") {
    return (
      <Done heading="Ton signalement ne peut pas être publié." headingRef={headingRef} tone="signal">
        <p>{result.publicReason ?? "Il ne respecte pas les règles de publication."}</p>
        <p>
          Tu peux le reformuler en décrivant uniquement la situation. <Link href="/regles" className="link">Relire les règles</Link>
        </p>
        <ButtonLink href={`/signaler?lycee=${result.schoolSlug}`} block>
          Écrire un nouveau signalement
        </ButtonLink>
      </Done>
    );
  }
  return (
    <Done heading="Merci ! Ton signalement sera vérifié avant publication." headingRef={headingRef}>
      <p>
        Pour protéger tout le monde, une personne de l’équipe va le relire avant de le publier, en général sous quelques jours. Il reste
        anonyme : tu peux suivre son état avec le lien ci-dessous.
      </p>
      <TrackingLink token={result.trackingToken} />
      <ButtonLink href={`/lycee/${result.schoolSlug}`} variant="secondary" block>
        Voir la fiche du lycée
      </ButtonLink>
    </Done>
  );
}
