"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  BookOpen,
  Trophy,
  Brain,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Option = { id: string; text: string };

type Question = {
  id: number;
  category: string;
  categoryIcon: "vocab" | "math" | "reading";
  text: string;
  options: Option[];
  correctId: string;
  explanation: string;
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'Choose the word that is closest in meaning to the underlined word.\n\n"The senator delivered an **eloquent** speech that moved many in the audience to tears."',
    options: [
      { id: "a", text: "Persuasive and well-expressed" },
      { id: "b", text: "Loud and boisterous" },
      { id: "c", text: "Brief and concise" },
      { id: "d", text: "Confusing and unclear" },
    ],
    correctId: "a",
    explanation:
      "Eloquent means fluent, persuasive, and well-expressed in speech or writing. A speaker who is eloquent conveys ideas clearly and movingly — exactly what the context implies.",
  },
  {
    id: 2,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "A government employee earns ₱18,500 per month. If she receives a 12% salary increase, what will her new monthly salary be?",
    options: [
      { id: "a", text: "₱20,220" },
      { id: "b", text: "₱20,720" },
      { id: "c", text: "₱21,200" },
      { id: "d", text: "₱19,850" },
    ],
    correctId: "b",
    explanation:
      "12% of ₱18,500 = ₱2,220. Add to original: ₱18,500 + ₱2,220 = ₱20,720. Always multiply the base salary by the percentage increase, then add it back to find the new total.",
  },
  {
    id: 3,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'Select the word that is OPPOSITE in meaning to the underlined word.\n\n"The committee made a **hasty** decision without reviewing all the facts."',
    options: [
      { id: "a", text: "Impulsive" },
      { id: "b", text: "Deliberate" },
      { id: "c", text: "Reckless" },
      { id: "d", text: "Careless" },
    ],
    correctId: "b",
    explanation:
      "Hasty means done too quickly without careful thought. Its antonym is deliberate, which means done with full consideration and intention. Options A, C, and D are all synonyms or near-synonyms of hasty.",
  },
  {
    id: 4,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "In a barangay election, Candidate A received 3/5 of the total votes cast, and Candidate B received the remaining votes. If Candidate B got 480 votes, how many total votes were cast?",
    options: [
      { id: "a", text: "1,100" },
      { id: "b", text: "1,200" },
      { id: "c", text: "1,250" },
      { id: "d", text: "1,320" },
    ],
    correctId: "b",
    explanation:
      "Candidate B received 2/5 of total votes (since A got 3/5). So 2/5 × Total = 480. Therefore Total = 480 ÷ (2/5) = 480 × 5/2 = 1,200 votes.",
  },
  {
    id: 5,
    category: "Reading Comprehension",
    categoryIcon: "reading",
    text: 'Read the passage and answer the question.\n\n*"The Philippine Civil Service Commission was established to promote morale, efficiency, integrity, and responsiveness in the civil service. It serves as the central personnel agency of the government."*\n\nWhat is the PRIMARY role of the Civil Service Commission according to the passage?',
    options: [
      { id: "a", text: "To audit government financial transactions" },
      { id: "b", text: "To serve as the central personnel agency of the government" },
      { id: "c", text: "To create laws governing public officials" },
      { id: "d", text: "To resolve disputes between government agencies" },
    ],
    correctId: "b",
    explanation:
      'The passage explicitly states that the CSC "serves as the central personnel agency of the government." While promoting morale and integrity are mentioned as goals, the primary structural role identified is that of the central personnel agency.',
  },
  {
    id: 6,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'Choose the word that best completes the sentence.\n\n"Despite the _______ evidence against him, the accused maintained his innocence throughout the trial."',
    options: [
      { id: "a", text: "flimsy" },
      { id: "b", text: "scant" },
      { id: "c", text: "overwhelming" },
      { id: "d", text: "ambiguous" },
    ],
    correctId: "c",
    explanation:
      '"Despite" signals a contrast — maintaining innocence despite evidence implies the evidence was very strong. Overwhelming fits perfectly. Flimsy and scant would mean weak evidence, making it less surprising to claim innocence. Ambiguous means unclear, which wouldn\'t create a strong contrast.',
  },
  {
    id: 7,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "If 6 clerks can process 300 documents in 5 days, how many documents can 9 clerks process in 4 days at the same rate?",
    options: [
      { id: "a", text: "320" },
      { id: "b", text: "340" },
      { id: "c", text: "360" },
      { id: "d", text: "380" },
    ],
    correctId: "c",
    explanation:
      "Rate per clerk per day = 300 ÷ 6 ÷ 5 = 10 documents. For 9 clerks in 4 days: 9 × 10 × 4 = 360 documents.",
  },
  {
    id: 8,
    category: "Reading Comprehension",
    categoryIcon: "reading",
    text: 'Read and answer:\n\n*"A true public servant puts the needs of the community above personal gain. This selfless dedication to service is the cornerstone of an effective and trustworthy government."*\n\nThe author\'s main point is that:',
    options: [
      { id: "a", text: "Government officials are always selfless" },
      { id: "b", text: "Selfless dedication defines effective public service" },
      { id: "c", text: "Personal gain motivates most public servants" },
      { id: "d", text: "Community needs are hard to determine" },
    ],
    correctId: "b",
    explanation:
      'The passage states that "selfless dedication to service is the cornerstone of effective government." The main point is that this quality — putting community above self — defines what good public service looks like. Option A overgeneralizes; the passage describes an ideal, not a universal fact.',
  },
  {
    id: 9,
    category: "Numerical Reasoning",
    categoryIcon: "math",
    text: "A water tank is 3/4 full. After using 45 liters, it becomes 1/2 full. What is the total capacity of the tank?",
    options: [
      { id: "a", text: "160 liters" },
      { id: "b", text: "175 liters" },
      { id: "c", text: "180 liters" },
      { id: "d", text: "200 liters" },
    ],
    correctId: "c",
    explanation:
      "3/4 – 1/2 = 1/4 of the tank = 45 liters. Therefore total capacity = 45 × 4 = 180 liters.",
  },
  {
    id: 10,
    category: "Vocabulary",
    categoryIcon: "vocab",
    text: 'The word "MITIGATE" most nearly means:',
    options: [
      { id: "a", text: "To worsen or intensify" },
      { id: "b", text: "To make less severe or harsh" },
      { id: "c", text: "To completely eliminate" },
      { id: "d", text: "To officially investigate" },
    ],
    correctId: "b",
    explanation:
      'Mitigate means to lessen the severity, seriousness, or painfulness of something. It\'s commonly used in legal contexts ("mitigating circumstances") and disaster management. It does NOT mean to eliminate — only to reduce the impact.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  vocab: BookOpen,
  math: Brain,
  reading: Trophy,
};

const CATEGORY_COLORS: Record<string, string> = {
  Vocabulary: "bg-violet-100 text-violet-700 border border-violet-200",
  "Numerical Reasoning": "bg-sky-100 text-sky-700 border border-sky-200",
  "Reading Comprehension": "bg-amber-100 text-amber-700 border border-amber-200",
};

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const question = QUESTIONS[currentIndex];
  const total = QUESTIONS.length;
  const progress = ((currentIndex) / total) * 100;
  const isCorrect = selectedId === question.correctId;
  const Icon = CATEGORY_ICONS[question.categoryIcon];

  // Reset per-question state
  useEffect(() => {
    setSelectedId(null);
    setChecked(false);
    setAiHint(null);
  }, [currentIndex]);

  const handleCheck = () => {
    if (!selectedId) return;
    setChecked(true);
    if (selectedId === question.correctId) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setShowConfetti(true);
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleAiHint = async () => {
    setLoadingAi(true);
    // Simulate AI response (replace with real Anthropic API call)
    await new Promise((r) => setTimeout(r, 1400));
    const hints: Record<number, string> = {
      1: "💡 Think about what makes a great speaker. The word 'eloquent' is often used to praise politicians and orators. Focus on the quality of expression, not volume or length.",
      2: "💡 Break it into two steps: (1) Find 12% of the base salary, (2) Add it to the original. Remember: percentage × base = increase amount.",
      3: "💡 The question asks for the OPPOSITE. Hasty means rushed. Think: what word describes the complete opposite — someone who takes their time and thinks carefully?",
      4: "💡 If A got 3/5, then B got the remaining fraction. Set up an equation: (B's fraction) × Total = B's votes. Then solve for Total.",
      5: "💡 Go back to the passage and look for words that describe the CSC's function or role — not its goals. The answer is stated almost word-for-word.",
      6: "💡 Focus on the word 'Despite.' It signals a contrast. If someone maintains innocence DESPITE evidence, the evidence must be very _______ to make that surprising.",
      7: "💡 Find the rate per clerk per day first, then scale up. Rate = Total ÷ Workers ÷ Days.",
      8: "💡 Identify the 'cornerstone' claim. The author is making a point about what defines good public servants — find the sentence that captures that idea.",
      9: "💡 Find what fraction of the tank was used (3/4 minus 1/2). That fraction equals 45 liters. Use that to find the whole.",
      10: "💡 Think of contexts where you've heard 'mitigate' — like 'mitigating factors' in law. It's about reducing, not removing. Which option fits that meaning?",
    };
    setAiHint(hints[question.id] ?? "💡 Re-read the question carefully and eliminate the obviously wrong answers first.");
    setLoadingAi(false);
  };

  // ── Finished Screen ──────────────────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const message =
      pct >= 80
        ? "Kahanga-hanga! 🎉 Outstanding performance!"
        : pct >= 60
        ? "Magaling! 👍 You're on the right track."
        : "Keep going! 💪 Practice makes perfect.";

    return (
      <div className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--muted)) 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md text-center"
        >
          <Card className="rounded-3xl shadow-2xl border-0 overflow-hidden">
            <div className="h-2 w-full" style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)))" }} />
            <CardContent className="p-10 space-y-6">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="text-7xl"
              >
                {pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}
              </motion.div>
              <div>
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Practice Complete</p>
                <h1 className="font-heading text-4xl font-bold text-foreground">{score}/{total}</h1>
                <p className="text-xl font-heading font-semibold mt-1" style={{ color: "hsl(var(--primary))" }}>{pct}% Correct</p>
              </div>
              <p className="text-base text-muted-foreground font-medium">{message}</p>
              <div className="pt-2 flex flex-col gap-3">
                <Button
                  className="w-full h-12 rounded-2xl font-heading font-semibold text-base"
                  onClick={() => { setCurrentIndex(0); setScore(0); setFinished(false); }}
                >
                  Try Again
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-2xl font-heading font-medium text-base">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ── Main Practice UI ──────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ background: "linear-gradient(160deg, hsl(var(--background)) 0%, hsl(var(--muted)/0.4) 100%)" }}
    >
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" />
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${CATEGORY_COLORS[question.category]}`}>
                {question.category}
              </span>
            </div>
            <span className="font-heading text-sm font-bold text-muted-foreground">
              <span className="text-foreground">{currentIndex + 1}</span>
              <span className="mx-0.5">/</span>
              {total}
            </span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2 rounded-full" />
            <motion.div
              className="absolute top-0 left-0 h-2 rounded-full"
              style={{
                width: `${((currentIndex + (checked ? 1 : 0)) / total) * 100}%`,
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-2)))",
                transition: "width 0.5s ease",
              }}
            />
          </div>
        </motion.div>

        {/* ── Question Card ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
          >
            <Card className="rounded-3xl border shadow-lg shadow-black/5">
              <CardContent className="p-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Question {currentIndex + 1}
                </p>
                <p
                  className="font-heading text-xl md:text-2xl font-semibold text-foreground leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(question.text) }}
                />
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* ── Options ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`options-${question.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {question.options.map((opt, i) => {
              const isSelected = selectedId === opt.id;
              const isRight = opt.id === question.correctId;

              let cardClass =
                "w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group ";

              if (!checked) {
                cardClass += isSelected
                  ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm";
              } else if (isRight) {
                cardClass +=
                  "border-[var(--spark-correct-border)] bg-[var(--spark-correct-bg)] text-[var(--spark-correct-text)]";
              } else if (isSelected && !isRight) {
                cardClass +=
                  "border-[var(--spark-wrong-border)] bg-[var(--spark-wrong-bg)] text-[var(--spark-wrong-text)]";
              } else {
                cardClass += "border-border bg-card opacity-50";
              }

              return (
                <motion.button
                  key={opt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  disabled={checked}
                  onClick={() => !checked && setSelectedId(opt.id)}
                  className={cardClass}
                >
                  <div className="flex items-center gap-4">
                    {/* Letter badge */}
                    <span
                      className={`
                        w-8 h-8 rounded-xl flex items-center justify-center text-sm font-heading font-bold shrink-0 transition-colors
                        ${!checked
                          ? isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                          : isRight
                          ? "bg-[var(--spark-correct-text)] text-[var(--spark-correct-bg)]"
                          : isSelected
                          ? "bg-[var(--spark-wrong-text)] text-[var(--spark-wrong-bg)]"
                          : "bg-muted text-muted-foreground"
                        }
                      `}
                    >
                      {opt.id.toUpperCase()}
                    </span>

                    {/* Option text */}
                    <span className="font-medium text-base leading-snug flex-1 text-left">
                      {opt.text}
                    </span>

                    {/* Status icon */}
                    {checked && isRight && (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-[var(--spark-correct-text)]" />
                    )}
                    {checked && isSelected && !isRight && (
                      <XCircle className="w-5 h-5 shrink-0 text-[var(--spark-wrong-text)]" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* ── Explanation Card ── */}
        <AnimatePresence>
          {checked && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <Card
                className="rounded-2xl border-2"
                style={{
                  borderColor: isCorrect
                    ? "var(--spark-correct-border)"
                    : "var(--spark-wrong-border)",
                  background: isCorrect
                    ? "var(--spark-correct-bg)"
                    : "var(--spark-wrong-bg)",
                }}
              >
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    {isCorrect ? (
                      <CheckCircle2
                        className="w-5 h-5"
                        style={{ color: "var(--spark-correct-text)" }}
                      />
                    ) : (
                      <XCircle
                        className="w-5 h-5"
                        style={{ color: "var(--spark-wrong-text)" }}
                      />
                    )}
                    <p
                      className="font-heading font-bold text-base"
                      style={{
                        color: isCorrect
                          ? "var(--spark-correct-text)"
                          : "var(--spark-wrong-text)",
                      }}
                    >
                      {isCorrect ? "Tama! That's correct." : "Hindi tama. Here's why:"}
                    </p>
                  </div>

                  <p
                    className="text-sm leading-relaxed font-medium"
                    style={{
                      color: isCorrect
                        ? "var(--spark-correct-text)"
                        : "var(--spark-wrong-text)",
                      opacity: 0.9,
                    }}
                  >
                    {question.explanation}
                  </p>

                  {/* AI Hint */}
                  <AnimatePresence>
                    {aiHint && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-xl p-4 border-2"
                        style={{
                          background: "var(--spark-ai-bg)",
                          borderColor: "var(--spark-ai-border)",
                        }}
                      >
                        <p
                          className="text-sm font-medium leading-relaxed"
                          style={{ color: "var(--spark-ai-text)" }}
                        >
                          {aiHint}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Ask AI button */}
                  {!aiHint && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAiHint}
                      disabled={loadingAi}
                      className="rounded-xl border-2 font-semibold text-sm h-9 px-4"
                      style={{
                        background: "var(--spark-ai-bg)",
                        color: "var(--spark-ai-text)",
                        borderColor: "var(--spark-ai-border)",
                      }}
                    >
                      {loadingAi ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Asking AI…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Ask AI for a Hint
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Button ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="pb-8"
        >
          {!checked ? (
            <Button
              size="lg"
              className="w-full h-14 rounded-2xl font-heading font-bold text-lg shadow-lg transition-all"
              disabled={!selectedId}
              onClick={handleCheck}
            >
              Check Answer
            </Button>
          ) : (
            <motion.div
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Button
                size="lg"
                className="w-full h-14 rounded-2xl font-heading font-bold text-lg shadow-lg group"
                onClick={handleNext}
              >
                {currentIndex + 1 === total ? "View Results" : "Next Question"}
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  );
}