import { useEffect, useMemo, useState } from "react";

const DEFAULT_QUESTIONS = [
  {
    id: "qa-moat",
    text: "Why won't a big company copy you?",
    category: "moat",
  },
  {
    id: "qa-retention",
    text: "How do you reduce churn?",
    category: "retention",
  },
  {
    id: "qa-timing",
    text: "Why is now the right time?",
    category: "timing",
  },
];

const QUESTION_HINTS = {
  moat: ["moat", "distribution", "speed", "focus", "data", "defensible"],
  retention: ["retention", "onboarding", "activation", "support", "cohort", "value"],
  timing: ["timing", "market", "shift", "adoption", "trend", "window"],
  gtm: ["channel", "pipeline", "acquisition", "conversion", "sales", "repeatable"],
  financials: ["margin", "burn", "runway", "revenue", "cash", "unit economics"],
  general: ["customer", "metric", "proof", "risk", "execution", "roadmap"],
};

const PERSONAS = {
  balanced: {
    label: "Balanced Investor",
    strictness: 1,
    style: "direct",
  },
  skeptical_vc: {
    label: "Skeptical VC",
    strictness: 1.25,
    style: "skeptical",
  },
  friendly_angel: {
    label: "Friendly Angel",
    strictness: 0.9,
    style: "supportive",
  },
  enterprise_cfo: {
    label: "Enterprise CFO",
    strictness: 1.2,
    style: "financial",
  },
};

const BUZZWORDS = [
  "revolutionary",
  "game-changing",
  "best-in-class",
  "world-class",
  "synergy",
  "disruptive",
  "next-gen",
  "ai-powered",
  "seamless",
];

const EVASIVE_PHRASES = [
  "it depends",
  "we are exploring",
  "hard to say",
  "too early to tell",
  "we'll see",
  "can't disclose",
  "no comment",
];

const PROOF_SIGNALS = [
  "because",
  "for example",
  "customer",
  "case study",
  "cohort",
  "retention",
  "pilot",
  "contract",
  "metric",
  "kpi",
  "mrr",
  "arr",
  "nps",
  "source",
  "evidence",
  "benchmark",
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatSeconds(totalSeconds) {
  const safe = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) return DEFAULT_QUESTIONS;
  return questions.map((entry, index) => {
    if (typeof entry === "string") {
      const fallbackCategory = Object.keys(QUESTION_HINTS)[index % 3] ?? "general";
      return {
        id: `question-${index}`,
        text: entry,
        category: fallbackCategory,
      };
    }
    return {
      id: entry.id ?? `question-${index}`,
      text: entry.text ?? `Question ${index + 1}`,
      category: entry.category ?? "general",
    };
  });
}

function countKeywordMatches(text, list) {
  return list.filter((item) => text.includes(item)).length;
}

function extractClaims(cleaned) {
  const patterns = [
    /\b\d+(\.\d+)?%\b/g,
    /\$\d+[a-z]*/g,
    /\b\d+x\b/g,
    /\b(we|our)\s+(grew|improved|reduced|cut|increased|doubled|tripled)\b/g,
    /\b(top|leading|best)\b/g,
  ];

  return patterns.reduce((total, pattern) => {
    const matches = cleaned.match(pattern);
    return total + (matches ? matches.length : 0);
  }, 0);
}

function timingCoach(elapsedSec, words) {
  if (!words) return "No timing data yet.";
  if (elapsedSec < 15) return "Too short. Aim for 20-60 seconds with one concrete proof point.";
  if (elapsedSec > 90) return "Too long. Keep first response under 60 seconds, then expand if asked.";
  return "Timing is in the useful range for live investor Q&A.";
}

function brevityCoach(words) {
  if (!words) return "No answer entered.";
  if (words < 20) return "Answer is too short; add context, mechanism, and proof.";
  if (words > 150) return "Answer is too long; tighten to core claim + evidence + risk control.";
  return "Brevity is balanced.";
}

function scoreAnswer({
  answer,
  question,
  elapsedSec,
  personaKey,
}) {
  const cleaned = answer.trim().toLowerCase();
  if (!cleaned) {
    return {
      score: 0,
      words: 0,
      hintMatches: 0,
      hasNumber: false,
      jargonCount: 0,
      evasiveCount: 0,
      claimCount: 0,
      proofCount: 0,
      unsupportedClaims: 0,
      elapsedSec: 0,
      timingMessage: "No answer entered.",
      brevityMessage: "No answer entered.",
      weaknessTags: ["no_answer"],
    };
  }

  const words = cleaned.split(/\s+/).filter(Boolean).length;
  const hints = QUESTION_HINTS[question.category] ?? QUESTION_HINTS.general;
  const hintMatches = countKeywordMatches(cleaned, hints);
  const hasNumber = /\d/.test(cleaned);
  const jargonCount = countKeywordMatches(cleaned, BUZZWORDS);
  const evasiveCount = countKeywordMatches(cleaned, EVASIVE_PHRASES);
  const claimCount = extractClaims(cleaned);
  const proofCount = countKeywordMatches(cleaned, PROOF_SIGNALS) + (hasNumber ? 1 : 0);
  const unsupportedClaims = Math.max(0, claimCount - proofCount);

  let score = 46;
  if (words >= 20) score += 11;
  if (words >= 40) score += 8;
  if (words >= 80) score += 3;
  if (words > 150) score -= 9;
  score += hintMatches * 6;
  if (hasNumber) score += 8;
  score += Math.min(12, proofCount * 3);

  const personaStrictness = PERSONAS[personaKey]?.strictness ?? 1;
  score -= Math.round(jargonCount * 3 * personaStrictness);
  score -= Math.round(evasiveCount * 8 * personaStrictness);
  score -= Math.round(unsupportedClaims * 6 * personaStrictness);
  if (elapsedSec < 15) score -= 8;
  if (elapsedSec > 90) score -= 6;

  const weaknessTags = [];
  if (!hasNumber) weaknessTags.push("no_metric");
  if (unsupportedClaims > 0) weaknessTags.push("unsupported_claims");
  if (evasiveCount > 0) weaknessTags.push("evasive");
  if (jargonCount > 1) weaknessTags.push("jargon");
  if (words < 20) weaknessTags.push("too_short");
  if (words > 150) weaknessTags.push("too_long");
  if (hintMatches < 2) weaknessTags.push("shallow");

  return {
    score: clamp(Math.round(score), 25, 98),
    words,
    hintMatches,
    hasNumber,
    jargonCount,
    evasiveCount,
    claimCount,
    proofCount,
    unsupportedClaims,
    elapsedSec,
    timingMessage: timingCoach(elapsedSec, words),
    brevityMessage: brevityCoach(words),
    weaknessTags,
  };
}

function feedbackText({ analysis, question, personaKey }) {
  if (!analysis.words) return "Add a specific answer to get feedback.";

  const persona = PERSONAS[personaKey] ?? PERSONAS.balanced;
  const opening =
    analysis.score >= 85
      ? "Strong answer."
      : analysis.score >= 70
        ? "Solid foundation."
        : analysis.score >= 55
          ? "Needs tightening."
          : "Weak response.";

  const lines = [opening];
  lines.push(analysis.brevityMessage);
  lines.push(analysis.timingMessage);

  if (!analysis.hasNumber) lines.push("Add at least one quantified proof point.");
  if (analysis.unsupportedClaims > 0) {
    lines.push("Some claims are unsupported. Attach evidence, source, or specific customer outcome.");
  }
  if (analysis.evasiveCount > 0) lines.push("Answer is partially evasive. State a direct position first.");
  if (analysis.jargonCount > 1) lines.push("Reduce buzzwords and use concrete language.");
  if (analysis.hintMatches < 2) {
    const coreHint = (QUESTION_HINTS[question.category] ?? QUESTION_HINTS.general)[0];
    lines.push(`Strengthen your ${coreHint} argument for this question.`);
  }

  if (persona.style === "skeptical") lines.push("Assume pushback and preempt one key objection.");
  if (persona.style === "financial") lines.push("Tie your answer to cost, ROI, and downside control.");

  return lines.join(" ");
}

function generateFollowUps({ analysis, question, personaKey }) {
  const persona = PERSONAS[personaKey] ?? PERSONAS.balanced;
  const base = [];

  if (analysis.unsupportedClaims > 0) {
    base.push("Which exact metric or source verifies that claim, and where was it measured?");
  }
  if (!analysis.hasNumber) {
    base.push("Give one hard number that proves your point in the last 90 days.");
  }
  if (analysis.evasiveCount > 0) {
    base.push("Answer in one sentence first: what is your direct position?");
  }
  if (analysis.words < 20) {
    base.push("What is one concrete customer example that demonstrates this?");
  }
  if (analysis.hintMatches < 2) {
    const hints = QUESTION_HINTS[question.category] ?? QUESTION_HINTS.general;
    base.push(`How is this defensible through ${hints[0]} and ${hints[1]} specifically?`);
  }

  if (!base.length) {
    base.push("What is the biggest risk in this answer, and how do you mitigate it?");
    base.push("If growth slowed next quarter, what would you change first?");
  }

  if (persona.style === "skeptical") {
    base[0] = `Convince me with evidence: ${base[0]}`;
  }
  if (persona.style === "supportive") {
    base[0] = `Good direction. Now tighten this: ${base[0]}`;
  }
  if (persona.style === "financial") {
    base.push("What is the quantified ROI impact and payback period?");
  }

  return base.slice(0, 3);
}

function generateObjection({ analysis, question, personaKey }) {
  const persona = PERSONAS[personaKey] ?? PERSONAS.balanced;
  const lead = persona.style === "skeptical" ? "I don't buy this yet." : "Pushback:";

  if (analysis.unsupportedClaims > 0) {
    return `${lead} Your claims sound optimistic. Show third-party evidence or customer-level proof.`;
  }
  if (!analysis.hasNumber) {
    return `${lead} This is high level. What hard number validates your answer today?`;
  }
  if (analysis.hintMatches < 2) {
    return `${lead} You did not fully answer the ${question.category} risk. Why is this durable?`;
  }
  return `${lead} What happens if your core assumption is wrong next quarter?`;
}

function scoreRebuttal(text, objection) {
  const cleaned = text.trim().toLowerCase();
  if (!cleaned) return { score: 0, feedback: "Write a rebuttal first." };

  const words = cleaned.split(/\s+/).filter(Boolean).length;
  const hasMetric = /\d/.test(cleaned);
  const addressesObjection = objection
    .toLowerCase()
    .split(/\W+/)
    .filter((token) => token.length > 4)
    .some((token) => cleaned.includes(token));
  const hasMitigation = ["mitigate", "reduce", "fallback", "backup", "if", "plan"].some((token) =>
    cleaned.includes(token),
  );

  let score = 48;
  if (words >= 20) score += 14;
  if (hasMetric) score += 12;
  if (addressesObjection) score += 14;
  if (hasMitigation) score += 10;
  if (words > 130) score -= 7;
  const finalScore = clamp(Math.round(score), 30, 98);

  if (finalScore >= 82) {
    return { score: finalScore, feedback: "Strong rebuttal. Direct, quantified, and risk-aware." };
  }
  if (finalScore >= 68) {
    return { score: finalScore, feedback: "Good rebuttal. Add one tighter proof element." };
  }
  return {
    score: finalScore,
    feedback: "Rebuttal needs sharper evidence and clearer mitigation language.",
  };
}

export function QASimulator({
  category = "Investor Q&A Simulator",
  questions = DEFAULT_QUESTIONS,
  answerPlaceholder = "Type your answer like you're in a live investor meeting...",
  storageKey = "pitchops_qa_simulator_v2",
}) {
  const safeQuestions = useMemo(() => normalizeQuestions(questions), [questions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedPersona, setSelectedPersona] = useState("skeptical_vc");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [latestFeedback, setLatestFeedback] = useState("");
  const [latestScore, setLatestScore] = useState(0);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [objection, setObjection] = useState("");
  const [rebuttalDraft, setRebuttalDraft] = useState("");
  const [rebuttalScore, setRebuttalScore] = useState(0);
  const [rebuttalFeedback, setRebuttalFeedback] = useState("");
  const [answerStartedAt, setAnswerStartedAt] = useState(() => Date.now());
  const [liveElapsedSec, setLiveElapsedSec] = useState(0);
  const [attemptLog, setAttemptLog] = useState([]);
  const [attemptsByQuestion, setAttemptsByQuestion] = useState({});

  const currentQuestion = safeQuestions[currentIndex];
  const progressLabel = `${currentIndex + 1}/${safeQuestions.length}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      if (parsed.selectedPersona && PERSONAS[parsed.selectedPersona]) {
        setSelectedPersona(parsed.selectedPersona);
      }
      if (Array.isArray(parsed.attemptLog)) setAttemptLog(parsed.attemptLog);
      if (parsed.attemptsByQuestion && typeof parsed.attemptsByQuestion === "object") {
        setAttemptsByQuestion(parsed.attemptsByQuestion);
      }
    } catch {
      // ignore invalid storage
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          selectedPersona,
          attemptLog,
          attemptsByQuestion,
        }),
      );
    } catch {
      // ignore storage failures
    }
  }, [selectedPersona, attemptLog, attemptsByQuestion, storageKey]);

  useEffect(() => {
    const id = setInterval(() => {
      setLiveElapsedSec(Math.max(0, Math.floor((Date.now() - answerStartedAt) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [answerStartedAt]);

  const scoreToneClass = useMemo(() => {
    if (latestScore >= 80) return "text-emerald-400";
    if (latestScore >= 60) return "text-amber-300";
    return "text-red-300";
  }, [latestScore]);

  const heatmap = useMemo(() => {
    const grouped = attemptLog.reduce((acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = { attempts: 0, totalScore: 0, weakness: {} };
      }
      acc[entry.category].attempts += 1;
      acc[entry.category].totalScore += entry.score;
      (entry.weaknessTags || []).forEach((tag) => {
        acc[entry.category].weakness[tag] = (acc[entry.category].weakness[tag] ?? 0) + 1;
      });
      return acc;
    }, {});

    return Object.entries(grouped).map(([categoryKey, stats]) => {
      const topWeakness =
        Object.entries(stats.weakness).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
      return {
        categoryKey,
        attempts: stats.attempts,
        avgScore: Math.round(stats.totalScore / Math.max(1, stats.attempts)),
        topWeakness,
      };
    });
  }, [attemptLog]);

  const weakestCategory = useMemo(() => {
    if (!heatmap.length) return null;
    return [...heatmap].sort((a, b) => a.avgScore - b.avgScore)[0];
  }, [heatmap]);

  const versionDelta = useMemo(() => {
    const attempts = attemptsByQuestion[currentQuestion.id] ?? [];
    if (attempts.length < 2) return null;
    const latest = attempts[attempts.length - 1];
    const previous = attempts[attempts.length - 2];
    return {
      latest,
      previous,
      scoreDelta: latest.score - previous.score,
      wordDelta: latest.words - previous.words,
    };
  }, [attemptsByQuestion, currentQuestion.id]);

  const onSubmitAnswer = () => {
    const elapsedSec = Math.max(1, Math.floor((Date.now() - answerStartedAt) / 1000));
    const analysis = scoreAnswer({
      answer: draftAnswer,
      question: currentQuestion,
      elapsedSec,
      personaKey: selectedPersona,
    });

    setLatestAnalysis(analysis);
    setLatestScore(analysis.score);
    setLatestFeedback(
      feedbackText({
        analysis,
        question: currentQuestion,
        personaKey: selectedPersona,
      }),
    );
    setFollowUps(generateFollowUps({ analysis, question: currentQuestion, personaKey: selectedPersona }));
    setObjection(generateObjection({ analysis, question: currentQuestion, personaKey: selectedPersona }));
    setRebuttalDraft("");
    setRebuttalScore(0);
    setRebuttalFeedback("");

    const nextAttempt = {
      id: `attempt-${Date.now()}`,
      questionId: currentQuestion.id,
      questionText: currentQuestion.text,
      category: currentQuestion.category,
      score: analysis.score,
      words: analysis.words,
      elapsedSec,
      answer: draftAnswer.trim(),
      weaknessTags: analysis.weaknessTags,
      createdAt: new Date().toISOString(),
    };

    setAttemptLog((prev) => [nextAttempt, ...prev].slice(0, 60));
    setAttemptsByQuestion((prev) => ({
      ...prev,
      [currentQuestion.id]: [...(prev[currentQuestion.id] ?? []), nextAttempt].slice(-8),
    }));
  };

  const onScoreRebuttal = () => {
    const result = scoreRebuttal(rebuttalDraft, objection);
    setRebuttalScore(result.score);
    setRebuttalFeedback(result.feedback);
  };

  const onNextQuestion = () => {
    setCurrentIndex((prev) => (prev + 1) % safeQuestions.length);
    setDraftAnswer("");
    setLatestFeedback("");
    setLatestScore(0);
    setLatestAnalysis(null);
    setFollowUps([]);
    setObjection("");
    setRebuttalDraft("");
    setRebuttalScore(0);
    setRebuttalFeedback("");
    setAnswerStartedAt(Date.now());
    setLiveElapsedSec(0);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{category}</p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground">
            Persona
            <select
              value={selectedPersona}
              onChange={(event) => setSelectedPersona(event.target.value)}
              className="ml-2 h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {Object.entries(PERSONAS).map(([key, persona]) => (
                <option key={key} value={key}>
                  {persona.label}
                </option>
              ))}
            </select>
          </label>
          <p className="text-xs text-muted-foreground">Question {progressLabel}</p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Tough Investor Question</p>
          <p className="text-xs text-muted-foreground">
            Response timer {formatSeconds(liveElapsedSec)}
          </p>
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{currentQuestion.text}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Category: {currentQuestion.category}
        </p>
      </div>

      <label className="mt-3 block text-xs text-muted-foreground">
        Your Answer
        <textarea
          value={draftAnswer}
          onChange={(event) => setDraftAnswer(event.target.value)}
          placeholder={answerPlaceholder}
          className="mt-1 h-28 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmitAnswer}
          className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
        >
          Get AI Feedback
        </button>
        <button
          type="button"
          onClick={onNextQuestion}
          className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
        >
          Next Question
        </button>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Feedback</p>
          <p className={`text-xs font-medium ${scoreToneClass}`}>
            {latestScore ? `Confidence ${latestScore}%` : "No feedback yet"}
          </p>
        </div>
        <p className="mt-1 text-sm text-foreground">
          {latestFeedback || "Submit your answer to receive coaching feedback."}
        </p>
        {latestAnalysis && (
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground md:grid-cols-2">
            <p>Words: {latestAnalysis.words}</p>
            <p>Keyword depth: {latestAnalysis.hintMatches}</p>
            <p>Claims: {latestAnalysis.claimCount}</p>
            <p>Unsupported claims: {latestAnalysis.unsupportedClaims}</p>
            <p>Jargon hits: {latestAnalysis.jargonCount}</p>
            <p>Evasive phrases: {latestAnalysis.evasiveCount}</p>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Adaptive Follow-Up Questions</p>
        <div className="mt-1 space-y-1">
          {followUps.length ? (
            followUps.map((item, index) => (
              <p key={`${item}-${index}`} className="text-sm text-foreground">
                {index + 1}. {item}
              </p>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              Submit an answer to generate follow-up pressure questions.
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Objection Rebuttal Drill</p>
        <p className="mt-1 text-sm text-foreground">
          {objection || "Submit an answer to receive a pushback objection."}
        </p>
        <textarea
          value={rebuttalDraft}
          onChange={(event) => setRebuttalDraft(event.target.value)}
          placeholder="Write your rebuttal to the objection..."
          className="mt-2 h-20 w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onScoreRebuttal}
            className="rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground hover:bg-muted"
          >
            Score Rebuttal
          </button>
          <p className="text-xs text-muted-foreground">
            {rebuttalScore ? `Rebuttal ${rebuttalScore}%` : "Not scored"}
          </p>
        </div>
        <p className="mt-1 text-xs text-foreground">{rebuttalFeedback}</p>
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Question Heatmap and Weakness Trends</p>
          <p className="text-xs text-muted-foreground">Attempts: {attemptLog.length}</p>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          {heatmap.length ? (
            heatmap.map((entry) => (
              <div key={entry.categoryKey} className="rounded-md border border-border/60 p-2">
                <p className="text-xs text-muted-foreground">{entry.categoryKey}</p>
                <p className="text-sm font-medium text-foreground">Avg {entry.avgScore}%</p>
                <p className="text-xs text-muted-foreground">
                  {entry.attempts} attempt(s), top weakness: {entry.topWeakness}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">
              No trend data yet. Complete a few answers to populate the heatmap.
            </p>
          )}
        </div>
        {weakestCategory && (
          <p className="mt-2 text-xs text-amber-700">
            Current weakest category: {weakestCategory.categoryKey} ({weakestCategory.avgScore}% avg)
          </p>
        )}
      </div>

      <div className="mt-3 rounded-lg border border-border/70 bg-background p-3">
        <p className="text-xs text-muted-foreground">Answer Version Compare</p>
        {versionDelta ? (
          <div className="mt-1 space-y-1 text-xs text-foreground">
            <p>
              Latest vs previous score: {versionDelta.latest.score}% vs {versionDelta.previous.score}% (
              {versionDelta.scoreDelta >= 0 ? "+" : ""}
              {versionDelta.scoreDelta})
            </p>
            <p>
              Word count delta: {versionDelta.wordDelta >= 0 ? "+" : ""}
              {versionDelta.wordDelta}
            </p>
            <p>Previous attempt: {versionDelta.previous.createdAt}</p>
            <p>Latest attempt: {versionDelta.latest.createdAt}</p>
          </div>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            Need at least two attempts on this question to compare versions.
          </p>
        )}
      </div>
    </div>
  );
}
