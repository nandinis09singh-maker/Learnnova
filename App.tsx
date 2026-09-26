import { useMemo, useState } from "react";
import {
  answerDiagnostic,
  diagnosticQuestions,
  getInitialProfile,
  saveProfile,
  type LearningProfile,
} from "./learningEngine";

type IconName =
  | "spark"
  | "grid"
  | "path"
  | "chart"
  | "brain"
  | "book"
  | "clock"
  | "flame"
  | "target"
  | "arrow"
  | "check"
  | "lock"
  | "play"
  | "message"
  | "bell"
  | "search"
  | "chevron"
  | "x"
  | "bolt"
  | "trophy"
  | "heart";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    spark: <path d="M12 2l1.7 5.3L19 9l-5.3 1.7L12 16l-1.7-5.3L5 9l5.3-1.7L12 2zm7 13l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
    grid: <><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>,
    path: <><circle cx="6" cy="18" r="3" /><circle cx="18" cy="6" r="3" /><path d="M8.5 16.5c2-2 1-5 3-7s3.5-1 4-1" /></>,
    chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
    brain: <path d="M9.5 4.5A3.5 3.5 0 006 8v.5a3.5 3.5 0 00-1 6.8A3.5 3.5 0 009.5 21c1 0 1.8-.4 2.5-1 .7.6 1.5 1 2.5 1a3.5 3.5 0 004.5-5.7 3.5 3.5 0 00-1-6.8V8a3.5 3.5 0 00-6-2.5 3.5 3.5 0 00-2.5-1zM12 5.5V20M8 9.5c0 1.3 1 2.5 2.5 2.5M16 9.5c0 1.3-1 2.5-2.5 2.5" />,
    book: <><path d="M4 5.5A3.5 3.5 0 017.5 2H12v18H7.5A3.5 3.5 0 004 23V5.5z" /><path d="M20 5.5A3.5 3.5 0 0016.5 2H12v18h4.5a3.5 3.5 0 013.5 3V5.5z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    flame: <path d="M13 2s1 4-2 6c-2-3-5-1-5 3 0 1.8.8 3 2 4-1-.3-2-.8-3-2 0 5 3 9 7 9s7-3 7-7c0-5-3-8-6-13z" />,
    target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    check: <path d="M5 12l4 4L19 6" />,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
    play: <path d="M8 5l11 7-11 7V5z" />,
    message: <path d="M21 15a4 4 0 01-4 4H8l-5 3 1.5-5A7 7 0 013 13V8a4 4 0 014-4h10a4 4 0 014 4v7z" />,
    bell: <><path d="M18 9a6 6 0 00-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8" /><path d="M10 21h4" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
    chevron: <path d="M9 6l6 6-6 6" />,
    x: <><path d="M6 6l12 12M18 6L6 18" /></>,
    bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />,
    trophy: <><path d="M8 4h8v5a4 4 0 01-8 0V4z" /><path d="M8 6H4v2a4 4 0 004 4M16 6h4v2a4 4 0 01-4 4M12 13v5M8 21h8M9 18h6" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 00-.1-7.8z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={name === "spark" || name === "flame" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function Button({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
}) {
  return <button className={`btn btn-${variant} ${className}`} onClick={onClick} disabled={disabled}>{children}</button>;
}

const navItems: { id: string; label: string; icon: IconName }[] = [
  { id: "home", label: "Dashboard", icon: "grid" },
  { id: "path", label: "My Learning Path", icon: "path" },
  { id: "progress", label: "Progress & Insights", icon: "chart" },
  { id: "challenge", label: "Challenge Arena", icon: "bolt" },
  { id: "tutor", label: "AI Study Coach", icon: "brain" },
  { id: "library", label: "Resource Library", icon: "book" },
];

function Ring({ value, color = "violet" }: { value: number; color?: "violet" | "mint" | "amber" }) {
  return <span className={`ring ring-${color}`} style={{ "--score": value } as React.CSSProperties}><span>{value}%</span></span>;
}

function AssessmentModal({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (profile: LearningProfile) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const question = diagnosticQuestions[step];

  const choose = (index: number) => {
    const next = [...answers, index];
    setAnswers(next);
    if (step === diagnosticQuestions.length - 1) {
      setFinished(true);
    } else {
      setTimeout(() => setStep(step + 1), 220);
    }
  };

  const result = useMemo(() => finished ? answerDiagnostic(answers) : null, [answers, finished]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="assessment-modal">
        <div className="modal-top">
          <div>
            <span className="eyebrow">DIAGNOSTIC ASSESSMENT</span>
            <p>{finished ? "Analysis complete" : `Question ${step + 1} of ${diagnosticQuestions.length}`}</p>
          </div>
          <Button variant="ghost" className="icon-button" onClick={onClose}><Icon name="x" /></Button>
        </div>
        {!finished && (
          <>
            <div className="question-progress"><span style={{ width: `${((step + 1) / diagnosticQuestions.length) * 100}%` }} /></div>
            <div className="question-area">
              <div className="difficulty-row"><span>{question.topic}</span><span>{question.difficulty}</span></div>
              <h2>{question.prompt}</h2>
              <div className="answers">
                {question.answers.map((answer, index) => (
                  <Button key={answer} variant="secondary" onClick={() => choose(index)}>
                    <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{answer}</span>
                  </Button>
                ))}
              </div>
              <p className="adaptive-note"><Icon name="spark" size={15} /> Difficulty adapts to your responses in real time</p>
            </div>
          </>
        )}
        {finished && result && (
          <div className="result-area">
            <div className="result-icon"><Icon name="brain" size={32} /></div>
            <h2>Your learning profile is ready</h2>
            <p>We analyzed your concept mastery and prerequisite gaps. Your path has been rebuilt around what you need next.</p>
            <div className="result-stats">
              <div><strong>{result.overallMastery}%</strong><span>Current mastery</span></div>
              <div><strong>{result.gaps.length}</strong><span>Gaps detected</span></div>
              <div><strong>{result.recommendedLevel}</strong><span>Starting level</span></div>
            </div>
            <Button onClick={() => onComplete(result)}>View my personalized path <Icon name="arrow" /></Button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, detail, tone }: { icon: IconName; label: string; value: string; detail: string; tone: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon name={icon} /></div>
      <div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>
    </div>
  );
}

function Dashboard({ profile, startAssessment, setPage }: { profile: LearningProfile; startAssessment: () => void; setPage: (page: string) => void }) {
  return (
    <>
      <section className="welcome-row">
        <div><p className="overline">MONDAY, 24 JUNE</p><h1>Good morning, Alex</h1><p>Your learning path has adapted based on your latest quiz. Keep the momentum going.</p></div>
        <Button variant="secondary" onClick={startAssessment}><Icon name="target" /> Retake diagnostic</Button>
      </section>

      <section className="stats-grid">
        <StatCard icon="target" label="Overall mastery" value={`${profile.overallMastery}%`} detail="+8% this week" tone="purple" />
        <StatCard icon="clock" label="Learning time" value="4h 35m" detail="42m today" tone="blue" />
        <StatCard icon="flame" label="Day streak" value="12 days" detail="Personal best: 18" tone="orange" />
        <StatCard icon="book" label="Concepts mastered" value={`${profile.mastered}/42`} detail="3 added this week" tone="green" />
      </section>

      <section className="challenge-banner">
        <div className="challenge-art">
          <span className="shape shape-one" />
          <span className="shape shape-two" />
          <div><Icon name="bolt" size={26} /></div>
        </div>
        <div className="challenge-copy">
          <span className="eyebrow">DAILY ADAPTIVE SPRINT</span>
          <h2>Turn your weakest concept into today&apos;s win</h2>
          <p>5 questions that get harder as you improve. Earn up to 250 XP and protect your 12-day streak.</p>
        </div>
        <div className="challenge-reward"><Icon name="trophy" /><div><strong>+250 XP</strong><span>Perfect run</span></div></div>
        <Button onClick={() => setPage("challenge")}>Start challenge <Icon name="arrow" /></Button>
      </section>

      <section className="dashboard-grid">
        <div className="main-column">
          <div className="section-heading">
            <div><span className="eyebrow">UP NEXT</span><h2>Continue your learning path</h2></div>
            <Button variant="ghost" onClick={() => setPage("path")}>View full path <Icon name="arrow" /></Button>
          </div>
          <div className="lesson-card">
            <div className="lesson-art">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <span className="math-symbol">ƒ(x)</span>
            </div>
            <div className="lesson-copy">
              <div className="lesson-meta"><span>ALGEBRA II</span><span>•</span><span>LESSON 4 OF 7</span></div>
              <h3>Understanding Quadratic Functions</h3>
              <p>Explore how coefficients transform a parabola and learn to identify key features from its equation.</p>
              <div className="mini-progress"><span style={{ width: "68%" }} /></div>
              <div className="lesson-footer"><span><Icon name="clock" size={15} /> 18 min remaining</span><Button onClick={() => setPage("path")}><Icon name="play" size={16} /> Continue lesson</Button></div>
            </div>
          </div>

          <div className="section-heading compact">
            <div><span className="eyebrow">TODAY'S PLAN</span><h2>Built for your current level</h2></div>
            <span className="time-pill"><Icon name="clock" size={15} /> 42 min total</span>
          </div>
          <div className="plan-list">
            {[
              ["check", "Review", "Factoring expressions", "8 min", "complete"],
              ["play", "Learn", "Quadratic functions", "18 min", "active"],
              ["lock", "Practice", "Graph transformations", "10 min", "locked"],
              ["lock", "Adaptive quiz", "Algebra checkpoint", "6 min", "locked"],
            ].map(([icon, type, title, time, status]) => (
              <div className={`plan-item ${status}`} key={title}>
                <span className="plan-connector" />
                <div className="plan-icon"><Icon name={icon as IconName} size={16} /></div>
                <div className="plan-title"><small>{type}</small><strong>{title}</strong></div>
                <span className="plan-time">{time}</span>
                <Icon name="chevron" size={16} />
              </div>
            ))}
          </div>
        </div>

        <aside className="right-column">
          <div className="insight-card">
            <div className="card-head"><div><span className="eyebrow">MASTERY SNAPSHOT</span><h3>Your knowledge map</h3></div><Button variant="ghost" className="icon-button"><Icon name="chevron" /></Button></div>
            <div className="mastery-item"><Ring value={82} /><div><strong>Linear equations</strong><span>Strong · Ready to advance</span></div></div>
            <div className="mastery-item"><Ring value={64} color="amber" /><div><strong>Factoring</strong><span>Developing · Keep practicing</span></div></div>
            <div className="mastery-item"><Ring value={38} color="mint" /><div><strong>Graph transformations</strong><span>Knowledge gap detected</span></div></div>
            <Button variant="secondary" className="full" onClick={() => setPage("progress")}>Explore knowledge map</Button>
          </div>

          <div className="coach-card">
            <div className="coach-top"><div className="coach-orb"><Icon name="spark" /></div><span>AI STUDY COACH</span></div>
            <h3>Need a different explanation?</h3>
            <p>I can break down quadratic functions with a visual example tailored to how you learn best.</p>
            <Button variant="secondary" className="full" onClick={() => setPage("tutor")}><Icon name="message" /> Ask your study coach</Button>
          </div>

          <div className="weekly-card">
            <div className="card-head"><div><span className="eyebrow">WEEKLY GOAL</span><h3>4 of 5 days</h3></div><strong>80%</strong></div>
            <div className="days">{["M", "T", "W", "T", "F", "S", "S"].map((day, i) => <span key={`${day}${i}`} className={i < 4 ? "done" : i === 4 ? "today" : ""}>{i < 4 ? <Icon name="check" size={13} /> : day}</span>)}</div>
            <p>One more learning day to hit your weekly goal.</p>
          </div>
        </aside>
      </section>
    </>
  );
}

function LearningPath({ setPage }: { setPage: (page: string) => void }) {
  const units = [
    { n: "01", title: "Algebra foundations", detail: "5 concepts mastered", score: "92%", state: "done" },
    { n: "02", title: "Factoring expressions", detail: "4 lessons · 1 practice", score: "76%", state: "done" },
    { n: "03", title: "Quadratic functions", detail: "Lesson 4 of 7 · In progress", score: "68%", state: "active" },
    { n: "04", title: "Graph transformations", detail: "Unlocks after current lesson", score: "Gap focus", state: "next" },
    { n: "05", title: "Systems of equations", detail: "Prerequisite path not started", score: "Locked", state: "locked" },
  ];
  return (
    <div className="page-view">
      <div className="page-hero"><div><span className="eyebrow">PERSONALIZED CURRICULUM</span><h1>Your learning path</h1><p>This path updates after every activity. We prioritize gaps without slowing down concepts you already know.</p></div><div className="hero-score"><Ring value={68} /><span>Path progress</span></div></div>
      <div className="path-layout">
        <div className="path-list">
          {units.map((unit) => <div className={`path-unit ${unit.state}`} key={unit.n}><span className="unit-num">{unit.state === "done" ? <Icon name="check" /> : unit.n}</span><div><small>UNIT {unit.n}</small><h3>{unit.title}</h3><p>{unit.detail}</p></div><span className="unit-score">{unit.score}</span>{unit.state === "active" && <Button onClick={() => setPage("home")}>Continue <Icon name="arrow" /></Button>}</div>)}
        </div>
        <aside className="gap-panel"><div className="gap-icon"><Icon name="brain" /></div><span className="eyebrow">AI PATH UPDATE</span><h3>Why this comes next</h3><p>Your quiz showed that graph transformations are limiting your progress with quadratic functions.</p><div className="gap-flow"><span>Factoring</span><Icon name="arrow" /><span>Transformations</span><Icon name="arrow" /><span>Quadratics</span></div><small>We added a 10-minute visual practice before your next checkpoint.</small></aside>
      </div>
    </div>
  );
}

function ProgressView({ profile }: { profile: LearningProfile }) {
  return (
    <div className="page-view">
      <div className="page-hero"><div><span className="eyebrow">LEARNING PROFILE · UPDATED TODAY</span><h1>Progress & insights</h1><p>See how your understanding changes at the concept level—not just your grades.</p></div><Button variant="secondary"><Icon name="chart" /> Download report</Button></div>
      <div className="insights-grid">
        <div className="large-panel"><span className="eyebrow">MASTERY BY CONCEPT</span><h2>Knowledge map</h2><div className="concept-bars">
          {profile.concepts.map((c) => <div key={c.name}><div><span>{c.name}</span><strong>{c.mastery}%</strong></div><span className="bar"><span className={c.mastery < 50 ? "risk" : c.mastery < 70 ? "medium" : ""} style={{ width: `${c.mastery}%` }} /></span><small>{c.note}</small></div>)}
        </div></div>
        <div className="large-panel"><span className="eyebrow">PERFORMANCE TREND</span><h2>Mastery is trending up</h2><div className="trend-chart"><div className="chart-line"><span /><span /><span /><span /><span /></div><div className="chart-labels"><span>May 27</span><span>Jun 3</span><span>Jun 10</span><span>Jun 17</span><span>Today</span></div></div><div className="trend-callout"><Icon name="spark" /><div><strong>+14% in four weeks</strong><span>Your strongest growth is in algebraic reasoning.</span></div></div></div>
        <div className="large-panel gap-summary"><span className="eyebrow">PREREQUISITE ANALYSIS</span><h2>2 gaps need attention</h2><div className="gap-row"><span className="risk-dot" /><div><strong>Graph transformations</strong><p>Impacts: quadratics, function composition</p></div><Button variant="secondary">Practice</Button></div><div className="gap-row"><span className="warn-dot" /><div><strong>Completing the square</strong><p>Impacts: vertex form, equation solving</p></div><Button variant="secondary">Review</Button></div></div>
      </div>
    </div>
  );
}

function CoachView() {
  const [messages, setMessages] = useState<{ from: "ai" | "user"; text: string }[]>([
    { from: "ai", text: "Hi Alex. I noticed graph transformations felt tricky today. Want a visual explanation, a real-world example, or a quick practice problem?" },
  ]);
  const [value, setValue] = useState("");
  const send = (text = value) => {
    if (!text.trim()) return;
    setMessages([...messages, { from: "user", text }, { from: "ai", text: "Think of y = x² as the original shape. Adding +3 outside the square lifts every point 3 spaces. So y = x² + 3 moves up, while y = (x + 3)² moves left. The change inside acts in the opposite direction. Want to try one?" }]);
    setValue("");
  };
  return (
    <div className="coach-page">
      <div className="coach-header"><div className="coach-avatar"><Icon name="spark" /></div><div><span className="eyebrow">AI-POWERED SUPPORT</span><h2>Nova, your study coach</h2><p><span className="online-dot" /> Online · Knows your learning profile</p></div></div>
      <div className="chat-area">
        <div className="chat-context"><Icon name="brain" /><span>Using context from: <strong>Quadratic functions · Graph transformations</strong></span></div>
        {messages.map((message, i) => <div key={i} className={`message ${message.from}`}><span className="message-avatar">{message.from === "ai" ? <Icon name="spark" size={15} /> : "AM"}</span><p>{message.text}</p></div>)}
        {messages.length === 1 && <div className="suggestions">{["Show me visually", "Use a real-life example", "Give me a practice problem"].map((text) => <Button key={text} variant="secondary" onClick={() => send(text)}>{text}</Button>)}</div>}
      </div>
      <div className="composer"><input aria-label="Ask your coach" value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a question about what you're learning…" /><Button onClick={() => send()}><Icon name="arrow" /></Button></div>
    </div>
  );
}

const challengeQuestions = [
  {
    level: "Warm-up",
    topic: "Factoring",
    prompt: "Factor x² + 7x + 12.",
    answers: ["(x + 3)(x + 4)", "(x + 2)(x + 6)", "(x − 3)(x − 4)", "(x + 1)(x + 12)"],
    correct: 0,
    explanation: "Find two numbers that multiply to 12 and add to 7. Those numbers are 3 and 4.",
  },
  {
    level: "Focused",
    topic: "Graph shifts",
    prompt: "The graph y = x² moves 5 units down. What is its new equation?",
    answers: ["y = (x − 5)²", "y = x² − 5", "y = (x + 5)²", "y = 5x²"],
    correct: 1,
    explanation: "A number outside the function changes its vertical position. Subtracting 5 shifts every point down.",
  },
  {
    level: "Stretch",
    topic: "Vertex form",
    prompt: "What is the vertex of y = 2(x − 3)² + 4?",
    answers: ["(−3, 4)", "(3, −4)", "(3, 4)", "(2, 4)"],
    correct: 2,
    explanation: "Vertex form is y = a(x − h)² + k, where the vertex is (h, k). Here h = 3 and k = 4.",
  },
  {
    level: "Challenge",
    topic: "Quadratic reasoning",
    prompt: "Which change makes y = x² narrower without moving its vertex?",
    answers: ["y = x² + 3", "y = (x − 3)²", "y = 3x²", "y = ⅓x²"],
    correct: 2,
    explanation: "A coefficient greater than 1 creates a vertical stretch, making the parabola appear narrower.",
  },
  {
    level: "Mastery",
    topic: "Synthesis",
    prompt: "Which equation has vertex (−2, 5) and opens downward?",
    answers: ["y = (x − 2)² + 5", "y = −(x + 2)² + 5", "y = (x + 2)² − 5", "y = −(x − 2)² − 5"],
    correct: 1,
    explanation: "The vertex (−2, 5) gives (x + 2)² + 5. A negative sign in front makes it open downward.",
  },
];

function ChallengeView({ onFinish }: { onFinish: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [complete, setComplete] = useState(false);
  const question = challengeQuestions[index];
  const correct = selected === question.correct;

  const choose = (answer: number) => {
    if (selected !== null) return;
    setSelected(answer);
    if (answer === question.correct) setScore((current) => current + 50);
  };

  const next = () => {
    if (index === challengeQuestions.length - 1) {
      setComplete(true);
      onFinish(score);
      return;
    }
    setIndex((current) => current + 1);
    setSelected(null);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setScore(0);
    setComplete(false);
  };

  if (complete) {
    const finalScore = score;
    return (
      <div className="challenge-page result">
        <div className="confetti confetti-a" /><div className="confetti confetti-b" /><div className="confetti confetti-c" />
        <div className="trophy-orb"><Icon name="trophy" size={42} /></div>
        <span className="eyebrow">SPRINT COMPLETE</span>
        <h1>{finalScore >= 200 ? "You crushed it, Alex!" : "Strong effort, Alex!"}</h1>
        <p>Your learning profile has been updated with five new performance signals.</p>
        <div className="result-score"><strong>{finalScore}</strong><span>XP earned</span></div>
        <div className="result-pills"><span><Icon name="target" /> {Math.round(finalScore / 2.5)}% accuracy</span><span><Icon name="flame" /> Streak protected</span><span><Icon name="brain" /> Path updated</span></div>
        <Button onClick={restart}>Try another adaptive sprint <Icon name="arrow" /></Button>
      </div>
    );
  }

  return (
    <div className="challenge-page">
      <div className="challenge-status">
        <div><span className="challenge-level"><Icon name="bolt" size={14} /> {question.level}</span><span>Question {index + 1} of {challengeQuestions.length}</span></div>
        <div className="challenge-track">{challengeQuestions.map((_, i) => <span key={i} className={i < index ? "passed" : i === index ? "current" : ""} />)}</div>
        <div className="game-stats"><span><Icon name="heart" size={15} /> 3 lives</span><span><Icon name="trophy" size={15} /> {score} XP</span></div>
      </div>
      <div className="quiz-card">
        <div className="quiz-topic"><span>{question.topic}</span><small>Difficulty adapted from your last answer</small></div>
        <h1>{question.prompt}</h1>
        <div className="quiz-answers">
          {question.answers.map((answer, answerIndex) => {
            const state = selected === null ? "" : answerIndex === question.correct ? "correct" : answerIndex === selected ? "incorrect" : "muted";
            return <Button key={answer} variant="secondary" className={state} onClick={() => choose(answerIndex)}><span>{String.fromCharCode(65 + answerIndex)}</span>{answer}{state === "correct" && <Icon name="check" />}{state === "incorrect" && <Icon name="x" />}</Button>;
          })}
        </div>
        {selected !== null && <div className={`answer-feedback ${correct ? "good" : "retry"}`}><div><Icon name={correct ? "spark" : "brain"} /><div><strong>{correct ? "Exactly right!" : "Good try—here's the connection."}</strong><p>{question.explanation}</p></div></div><Button onClick={next}>{index === challengeQuestions.length - 1 ? "See results" : "Next question"} <Icon name="arrow" /></Button></div>}
      </div>
      <p className="quiz-ai-note"><Icon name="spark" size={15} /> Nova is adjusting your next question using accuracy, speed, and concept mastery.</p>
    </div>
  );
}

function LibraryView() {
  return <div className="page-view"><div className="page-hero"><div><span className="eyebrow">CURATED FOR YOU</span><h1>Resource library</h1><p>Explanations, examples, and practice selected for your current learning goals.</p></div><div className="search-box"><Icon name="search" /><input placeholder="Search concepts and resources" /></div></div><div className="resource-grid">{[
    ["VISUAL GUIDE", "How parabolas move", "A visual walkthrough of horizontal and vertical shifts.", "8 min", "purple"],
    ["PRACTICE SET", "Factoring refresher", "Six targeted questions based on your recent mistakes.", "10 min", "blue"],
    ["AI EXPLANATION", "Vertex form, simplified", "A personalized explanation using patterns you already know.", "6 min", "green"],
    ["INTERACTIVE", "Build a quadratic", "Change each coefficient and see the graph respond instantly.", "12 min", "orange"],
  ].map(([type, title, text, time, tone]) => <div className="resource-card" key={title}><div className={`resource-visual ${tone}`}><Icon name={type === "PRACTICE SET" ? "target" : type === "AI EXPLANATION" ? "spark" : "book"} size={28} /></div><span className="eyebrow">{type}</span><h3>{title}</h3><p>{text}</p><div><span><Icon name="clock" size={14} /> {time}</span><Button variant="ghost">Open <Icon name="arrow" /></Button></div></div>)}</div></div>;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [profile, setProfile] = useState(getInitialProfile);
  const [assessmentOpen, setAssessmentOpen] = useState(false);

  const completeAssessment = (result: LearningProfile) => {
    saveProfile(result);
    setProfile(result);
    setAssessmentOpen(false);
    setPage("path");
  };

  const finishChallenge = (score: number) => {
    const improved = {
      ...profile,
      overallMastery: Math.min(99, profile.overallMastery + (score >= 200 ? 3 : 1)),
      updatedAt: new Date().toISOString(),
    };
    setProfile(improved);
    saveProfile(improved);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span><Icon name="spark" /></span><strong>Learnova</strong></div>
        <nav>
          <span className="nav-label">LEARN</span>
          {navItems.map((item) => <Button key={item.id} variant="ghost" className={page === item.id ? "active" : ""} onClick={() => setPage(item.id)}><Icon name={item.icon} /><span>{item.label}</span>{item.id === "tutor" && <small>AI</small>}</Button>)}
        </nav>
        <div className="daily-goal"><div><span>Daily goal</span><strong>42 / 50 min</strong></div><div className="goal-bar"><span /></div><p>Almost there—8 min to go</p></div>
        <div className="sidebar-profile"><span>AM</span><div><strong>Alex Morgan</strong><small>Grade 10 · Learner</small></div><Icon name="chevron" size={15} /></div>
      </aside>
      <main>
        <header className="topbar"><div className="mobile-brand"><Icon name="spark" /><strong>Learnova</strong></div><div className="top-actions"><div className="search"><Icon name="search" /><span>Search anything</span><kbd>⌘ K</kbd></div><Button variant="ghost" className="icon-button notification"><Icon name="bell" /><span /></Button><div className="focus-pill"><Icon name="flame" size={16} /> 12 day streak</div></div></header>
        <div className="content">
          {page === "home" && <Dashboard profile={profile} startAssessment={() => setAssessmentOpen(true)} setPage={setPage} />}
          {page === "path" && <LearningPath setPage={setPage} />}
          {page === "progress" && <ProgressView profile={profile} />}
          {page === "challenge" && <ChallengeView onFinish={finishChallenge} />}
          {page === "tutor" && <CoachView />}
          {page === "library" && <LibraryView />}
        </div>
      </main>
      {assessmentOpen && <AssessmentModal onClose={() => setAssessmentOpen(false)} onComplete={completeAssessment} />}
    </div>
  );
}
