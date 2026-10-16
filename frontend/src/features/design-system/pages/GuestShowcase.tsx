import { useState, type CSSProperties } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleMinus, Clock3, RotateCcw, XCircle } from "lucide-react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { CheckboxGroup } from "@/components/CheckboxGroup";
import { Dialog } from "@/components/Dialog";
import { Input } from "@/components/Input";
import { RadioGroup } from "@/components/RadioGroup";
import { Spinner } from "@/components/Spinner";
import { GuestBackground, GuestStateArtwork, LandingArtwork, type GuestStateKind } from "@/features/guest-quiz/components/GuestArtwork";
import { GuestReveal, QuestionTransition } from "@/features/guest-quiz/components/GuestMotion";
import { ProgressBar } from "@/features/guest-quiz/components/ProgressBar";
import { ScoreSummary } from "@/features/guest-quiz/components/ScoreSummary";
import { Timer } from "@/features/guest-quiz/components/Timer";

const colors = ["background", "surface", "text", "text-muted", "primary", "primary-contrast", "success", "danger", "warning", "border"];
const extras = ["primary-shadow", "secondary", "secondary-shadow", "accent", "danger-shadow"];
const states: { kind: GuestStateKind; title: string; message: string; action?: string }[] = [
  { kind: "unavailable", title: "This quiz is no longer available", message: "This quiz link is no longer available." },
  { kind: "not-found", title: "Quiz not found", message: "This quiz could not be found." },
  { kind: "session", title: "Your session was lost", message: "This attempt is no longer available in this browser. Start again to receive a new attempt.", action: "Start again" },
  { kind: "timeout", title: "Time ran out", message: "Time ran out before your answers reached the server. This attempt was not scored.", action: "Try again" },
  { kind: "network", title: "We could not load this quiz", message: "The quiz could not be reached. Check your connection and try again.", action: "Retry" },
];

export function GuestShowcase() {
  const [selected, setSelected] = useState<number | null>(1);
  const [checked, setChecked] = useState(true);
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState(false);
  const [replay, setReplay] = useState(0);
  return (
    <section className="guest-shell guest-showcase" data-guest-theme="lagoon" id="guest">
      <GuestBackground />
      <div className="relative grid gap-6">
        <header><Badge>Guest theme</Badge><h2 className="mt-3 text-title">Lagoon Play</h2></header>
        <section className="guest-showcase-band grid gap-4">
          <h3 className="text-heading">Color tokens</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...colors.map((name) => [`--token-${name}`, name]), ...extras.map((name) => [`--guest-${name}`, name])].map(([variable, name]) => (
              <div key={variable}><div aria-hidden="true" className="guest-swatch" style={{ background: `var(${variable})` }} /><p className="mt-2 text-small">{name}</p></div>
            ))}
          </div>
        </section>
        <section className="guest-showcase-band grid gap-4">
          <h3 className="text-heading">Type, shape and motion</h3>
          <p className="text-body">Fredoka headings and controls; Nunito body. Question 22/28px, title 40/64px, score 72/96px. Body 16px, small 14px, label 12px.</p>
          <div className="flex flex-wrap gap-6">{["sm", "md", "lg"].map((size) => <div className="border-2 border-border bg-surface p-4" style={{ borderRadius: `var(--token-radius-${size})` }} key={size}>{size === "sm" ? "16px" : size === "md" ? "20px" : "24px"}</div>)}</div>
          <p className="text-small text-text-muted">4px spacing base and control depth. Press 150ms; slide, dialog and review 250ms; selection 120ms; count-up 900ms; confetti 2s; drift 24s. Reduced motion makes changes instant.</p>
        </section>
        <section className="guest-showcase-band grid gap-6">
          <h3 className="text-heading">Controls</h3>
          {(["primary", "secondary", "ghost", "danger"] as const).map((variant) => (
            <div className="grid gap-3" key={variant}>
              <h4 className="text-small font-semibold capitalize">{variant}</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant={variant}>Default</Button>
                <Button variant={variant} data-preview="hover">Hover</Button>
                <Button variant={variant} data-preview="active">Pressed</Button>
                <Button variant={variant} data-preview="focus">Focus</Button>
                <Button variant={variant} disabled>Disabled</Button>
                <Button variant={variant} loading>Loading</Button>
              </div>
            </div>
          ))}
          <div className="grid gap-6 md:grid-cols-2">
            <Input id="guest-name-preview" label="Your name" helperText="Maximum 255 characters." placeholder="Your name" />
            <Input id="guest-error-preview" label="Your name" error="Please enter your name." />
            <Input id="guest-disabled-preview" label="Disabled" disabled value="Unavailable" readOnly />
            <Input id="guest-focus-preview" label="Focus" data-preview="focus" value="Quiz participant" readOnly />
          </div>
        </section>
        <section className="guest-showcase-band grid gap-6">
          <h3 className="text-heading">Question controls</h3>
          <ProgressBar current={step} total={3} />
          <QuestionTransition index={step}>
            <div className="guest-question"><h1>Question {step} of 3</h1></div>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <RadioGroup legend="Single answer preview" selectedId={selected} onSelect={setSelected} options={[{ id: 1, label: "Selected answer" }, { id: 2, label: "Another answer" }, { id: 3, label: "Disabled answer", disabled: true }]} />
              <CheckboxGroup legend="Multiple answers preview" onToggle={(_id, value) => setChecked(value)} options={[{ id: 1, label: "Selected answer", checked }, { id: 2, label: "Disabled answer", checked: false, disabled: true }]} />
            </div>
          </QuestionTransition>
          <div className="flex flex-wrap gap-4"><Button variant="secondary" icon={<ArrowLeft aria-hidden="true" size={18} />} onClick={() => setStep(Math.max(1, step - 1))}>Prev</Button><Button icon={<ArrowRight aria-hidden="true" size={18} />} onClick={() => setStep(Math.min(3, step + 1))}>Next</Button></div>
          <div className="flex flex-wrap gap-4" style={{ "--guest-duration-seconds": 600 } as CSSProperties}>
            <Timer isCritical={false} remainingSeconds={312} /><Timer isCritical remainingSeconds={42} /><Timer isCritical remainingSeconds={9} /><Timer isCritical remainingSeconds={0} />
          </div>
          <Button className="w-fit" onClick={() => setOpen(true)}>Submit answers</Button>
          <Dialog title="Submit your answers?" description="This can't be undone." open={open} onClose={() => setOpen(false)}>
            <div className="flex flex-wrap gap-4"><Button variant="secondary" onClick={() => setOpen(false)}>Keep working</Button><Button onClick={() => setOpen(false)}>Submit answers</Button></div>
          </Dialog>
        </section>
        <section className="guest-showcase-band">
          <div className="guest-landing grid gap-5">
            <LandingArtwork /><Badge variant="info">Guest quiz</Badge>
            <h1>A little curiosity. A great start.</h1>
            <div className="guest-duration items-center gap-2"><Clock3 aria-hidden="true" size={18} />20 minutes</div>
            <div className="guest-start-form grid gap-5"><h2 className="text-heading">Before you begin</h2><form className="grid gap-5" onSubmit={(event) => event.preventDefault()}><Input label="Your name" id="guest-landing-preview" /><Button type="submit" className="w-fit" icon={<ArrowRight aria-hidden="true" size={18} />}>Start quiz</Button></form></div>
          </div>
        </section>
        <section className="guest-showcase-band grid gap-6">
          <h3 className="text-heading">Results and review</h3>
          <Button className="w-fit" variant="secondary" icon={<RotateCcw aria-hidden="true" size={18} />} onClick={() => setReplay((value) => value + 1)}>Replay result motion</Button>
          <div className="grid gap-6 xl:grid-cols-3" key={replay}>
            <ScoreSummary message="Congratulations" score={9} totalMarks={10} percentage={90} />
            <ScoreSummary message="Good effort" score={6} totalMarks={10} percentage={60} />
            <ScoreSummary message="Keep practising" score={3} totalMarks={10} percentage={30} />
          </div>
          <Button variant="secondary" className="w-fit" aria-expanded={review} onClick={() => setReview(!review)}>{review ? "Hide answers" : "Review answers"}</Button>
          <GuestReveal open={review}><div className="guest-review grid gap-4"><p className="flex items-center gap-2 text-success"><CheckCircle2 aria-hidden="true" size={20} />Correct</p><p className="flex items-center gap-2 text-danger"><XCircle aria-hidden="true" size={20} />Incorrect</p><p className="flex items-center gap-2 text-text-muted"><CircleMinus aria-hidden="true" size={20} />No answer</p></div></GuestReveal>
        </section>
        <section className="guest-showcase-band grid gap-6">
          <h3 className="text-heading">Loading and unavailable states</h3>
          <div className="flex items-center gap-3" role="status"><Spinner /><span>Loading quiz...</span></div>
          <div className="grid gap-8 md:grid-cols-2">
            {states.map(({ kind, title, message, action }) => <div className="guest-state grid gap-4 content-start" key={kind}><GuestStateArtwork kind={kind} /><h4 className="text-heading">{title}</h4><p className="text-text-muted">{message}</p>{action ? <Button className="w-fit" variant="secondary">{action}</Button> : null}</div>)}
          </div>
        </section>
      </div>
    </section>
  );
}
