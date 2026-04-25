"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  Loader2,
  X,
  Target,
  ArrowLeft,
  ArrowRight,
  Flag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { getPracticeQuestions, checkPracticeAnswer } from "../actions";

type Option = { id: string; text: string };

type Question = {
  id: string; // Changed to string for UUID
  category: string;
  text: string;
  options: Option[];
};

type QuestionState = {
  selectedId: string | null;
  correctId: string | null;
  explanation: string | null;
  aiHint: string | null;
  isGrading: boolean;
};

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

export default function PracticePage() {
  const router = useRouter();
  const params = useParams<{ practiceId: string }>();

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<QuestionState[]>([]);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [flagged, setFlagged] = useState<Set<number>>(new Set());

  // Fetch Questions on Mount
  useEffect(() => {
    async function loadQuestions() {
      if (!params.practiceId) return;
      const res = await getPracticeQuestions(params.practiceId);
      
      if (res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
        setStates(res.questions.map(() => ({
          selectedId: null,
          correctId: null,
          explanation: null,
          aiHint: null,
          isGrading: false,
        })));
      } else {
        // Handle empty session or error
        router.push("/dashboard/practice/setup");
      }
      setLoading(false);
    }
    loadQuestions();
  }, [params.practiceId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) return null;

  const question = questions[currentIndex];
  const currentState = states[currentIndex];
  const total = questions.length;

  const isAnswered = currentState.selectedId !== null;
  const isCorrect = isAnswered && currentState.selectedId === currentState.correctId;

  const checkedCount = states.filter((s) => s.selectedId !== null).length;
  const score = states.filter((s) => s.selectedId !== null && s.selectedId === s.correctId).length;
  const progressValue = (checkedCount / total) * 100;

  // ── Secure Grading ───────────────────────────────────────────────────────
  async function handleSelect(id: string) {
    if (currentState.selectedId !== null || currentState.isGrading) return; 

    // Optimistically lock UI
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], selectedId: id, isGrading: true };
      return next;
    });

    // Securely fetch correct answer and explanation
    const result = await checkPracticeAnswer(question.id);

    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { 
        ...next[currentIndex], 
        correctId: result.correctId || null,
        explanation: result.explanation || "No explanation available.",
        isGrading: false 
      };
      return next;
    });
  }

  function toggleFlag(index: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function advanceOrFinish() {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  const handleAiHint = async () => {
    setLoadingAi(true);
    await new Promise((r) => setTimeout(r, 1400)); // Simulated AI delay
    setStates((prev) => {
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        aiHint: "💡 Think carefully about the context. Eliminate obviously incorrect choices first.",
      };
      return next;
    });
    setLoadingAi(false);
  };

  function getCellVariant(i: number) {
    const s = states[i];
    const isCurrent = i === currentIndex;
    const answered = s.selectedId !== null;
    const correct = answered && s.selectedId === s.correctId;

    if (isCurrent) {
      if (!answered || s.isGrading) return "current";
      return correct ? "current-correct" : "current-wrong";
    }

    if (!answered || s.isGrading) return "unanswered";
    return correct ? "correct" : "wrong";
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    const message = pct >= 80 ? "Kahanga-hanga! 🎉 Outstanding performance!" : pct >= 60 ? "Magaling! 👍 You're on the right track." : "Keep going! 💪 Practice makes perfect.";

    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md text-center">
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden bg-card border-border">
            <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)))" }} />
            <CardContent className="p-10 space-y-6">
              <div className="text-7xl">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}</div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Practice Complete</p>
                <h1 className="font-heading text-4xl font-bold text-foreground">{score}/{total}</h1>
                <p className="text-xl font-heading font-semibold mt-1 text-primary">{pct}% Correct</p>
              </div>
              <p className="text-base text-muted-foreground font-medium">{message}</p>
              <Button className="w-full h-12 rounded-2xl font-heading font-semibold" onClick={() => router.push("/dashboard/practice")}>Return to Dashboard</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-background lg:grid lg:grid-cols-[1fr_300px] overflow-hidden text-foreground">
      <div className="flex flex-col h-full overflow-hidden border-r border-border">
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/practice")} className="rounded-full bg-muted/50 hover:bg-muted">
              <X className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading text-sm md:text-base font-extrabold tracking-tight">Practice Session</h1>
            </div>
          </div>
          <Badge variant="outline" className="hidden sm:inline-flex bg-card">{question.category}</Badge>
        </header>

        <div className="flex-1 overflow-y-auto">
          <main className="w-full max-w-3xl mx-auto px-6 py-8 pb-4">
            <div className="mb-8 space-y-3 lg:hidden">
              <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                <span>Question {currentIndex + 1} of {total}</span>
              </div>
              <Progress value={progressValue} className="h-1.5" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={question.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="rounded-3xl border shadow-sm bg-card mb-6">
                  <CardContent className="p-8">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Question {currentIndex + 1}</p>
                    <p className="font-heading text-[1.2rem] font-semibold leading-[1.75] text-foreground whitespace-pre-line" dangerouslySetInnerHTML={{ __html: parseMarkdown(question.text) }} />
                  </CardContent>
                </Card>

                <div className="space-y-3 mb-8">
                  {question.options.map((opt) => {
                    const isSelected = currentState.selectedId === opt.id;
                    const isRight = currentState.correctId === opt.id;
                    const locked = isAnswered;

                    let cardClass = "w-full text-left p-5 rounded-2xl border-[1.5px] transition-all duration-200 flex items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ";

                    if (!locked) {
                      cardClass += "cursor-pointer border-border bg-card hover:border-primary/50 hover:bg-muted/50";
                    } else if (isRight) {
                      cardClass += "cursor-default border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]";
                    } else if (isSelected && !isRight) {
                      cardClass += "cursor-default border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]";
                    } else {
                      cardClass += "cursor-default border-border bg-card opacity-40";
                    }

                    return (
                      <button key={opt.id} disabled={locked || currentState.isGrading} onClick={() => handleSelect(opt.id)} className={cardClass}>
                        <span className={cn("w-8 h-8 rounded-xl flex items-center justify-center text-xs font-heading font-bold shrink-0 transition-colors", !locked ? "bg-muted text-muted-foreground" : isRight ? "bg-[var(--spark-correct-text)] text-[var(--spark-correct-bg)]" : isSelected ? "bg-[var(--spark-wrong-text)] text-[var(--spark-wrong-bg)]" : "bg-muted text-muted-foreground")}>
                          {opt.id.toUpperCase()}
                        </span>
                        <span className="font-medium text-sm leading-relaxed flex-1">{opt.text}</span>
                        {locked && isRight && <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--spark-correct-text)]" />}
                        {locked && isSelected && !isRight && <XCircle className="w-5 h-5 shrink-0 text-[var(--spark-wrong-text)]" />}
                        {currentState.isGrading && isSelected && <Loader2 className="w-5 h-5 shrink-0 animate-spin text-muted-foreground" />}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {isAnswered && !currentState.isGrading && currentState.explanation && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                      <Card className="rounded-2xl border-[1.5px] shadow-sm" style={{ borderColor: isCorrect ? "var(--spark-correct-border)" : "var(--spark-wrong-border)", background: isCorrect ? "var(--spark-correct-bg)" : "var(--spark-wrong-bg)" }}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex items-center gap-2">
                            {isCorrect ? <CheckCircle2 className="w-5 h-5" style={{ color: "var(--spark-correct-text)" }} /> : <XCircle className="w-5 h-5" style={{ color: "var(--spark-wrong-text)" }} />}
                            <p className="font-heading font-bold text-base" style={{ color: isCorrect ? "var(--spark-correct-text)" : "var(--spark-wrong-text)" }}>
                              {isCorrect ? "Tama! That's correct." : "Hindi tama. Here's why:"}
                            </p>
                          </div>
                          <p className="text-sm leading-relaxed font-medium" style={{ color: isCorrect ? "var(--spark-correct-text)" : "var(--spark-wrong-text)", opacity: 0.9 }}>
                            {currentState.explanation}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isAnswered && !currentState.isGrading && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                      <Button size="lg" className="w-full h-14 rounded-2xl font-heading font-bold text-lg shadow-md group" onClick={advanceOrFinish}>
                        {currentIndex + 1 === total ? "Finish Practice" : "Next Question"}
                        <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <footer className="px-6 py-4 border-t border-border shrink-0 bg-background">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0} className="gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <Button variant="ghost" size="sm" onClick={() => toggleFlag(currentIndex)} className={cn("gap-1.5 text-muted-foreground", flagged.has(currentIndex) && "text-amber-600 hover:text-amber-700")}>
                <Flag className={cn("w-3.5 h-3.5", flagged.has(currentIndex) && "fill-current")} />
                <span className="hidden sm:inline">{flagged.has(currentIndex) ? "Flagged" : "Flag"}</span>
              </Button>
            </div>
            <Button onClick={() => setCurrentIndex((i) => Math.min(total - 1, i + 1))} disabled={currentIndex === total - 1} className="gap-1.5 font-heading font-bold">
              Next <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </footer>
      </div>

      <aside className="hidden lg:flex flex-col gap-5 sticky top-0 h-screen overflow-y-auto p-5 bg-card border-l border-border">
        <div className="rounded-[var(--radius-lg)] border p-5 text-center border-border bg-muted/40">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Current Score</p>
          </div>
          <p className="font-mono text-[2.5rem] font-extrabold tracking-tight tabular-nums leading-none text-foreground">{score}<span className="text-xl text-muted-foreground/50">/{total}</span></p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Question Navigator</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((_, i) => {
              const variant = getCellVariant(i);
              const isFlagged = flagged.has(i);

              return (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "relative aspect-square rounded-lg text-xs font-bold transition-all duration-100",
                    variant === "unanswered" && "border-[1.5px] border-border bg-background text-muted-foreground hover:border-primary hover:text-primary",
                    variant === "correct" && "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)]",
                    variant === "wrong" && "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)]",
                    variant === "current" && "border-[2px] border-foreground/30 text-foreground font-extrabold bg-muted ring-2 ring-foreground/20 ring-offset-2",
                    variant === "current-correct" && "bg-[var(--spark-correct-bg)] border-[1.5px] border-[var(--spark-correct-border)] text-[var(--spark-correct-text)] ring-2 ring-[var(--spark-correct-border)] ring-offset-2",
                    variant === "current-wrong" && "bg-[var(--spark-wrong-bg)] border-[1.5px] border-[var(--spark-wrong-border)] text-[var(--spark-wrong-text)] ring-2 ring-[var(--spark-wrong-border)] ring-offset-2"
                  )}
                >
                  {i + 1}
                  {isFlagged && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 ring-1 ring-background" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 border border-border p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-semibold text-primary">{checkedCount}/{total}</span>
          </div>
          <Progress value={progressValue} className="h-1.5 bg-muted [&>div]:bg-primary" />
        </div>
        <div className="flex-1" />
        <div className="space-y-2">
          <Button variant="outline" size="lg" className="w-full font-heading font-extrabold text-sm tracking-wide border-border" onClick={() => router.push("/dashboard/practice")}>Exit Practice</Button>
        </div>
      </aside>
    </div>
  );
}