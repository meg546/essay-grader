const WORDS = [
  { text: "thesis", top: "12%", left: "8%", delay: 0, duration: 45 },
  { text: "clarity", top: "28%", left: "82%", delay: 8, duration: 52 },
  { text: "structure", top: "55%", left: "15%", delay: 3, duration: 48 },
  { text: "evidence", top: "72%", left: "75%", delay: 12, duration: 40 },
  { text: "argument", top: "40%", left: "55%", delay: 6, duration: 55 },
  { text: "analysis", top: "85%", left: "35%", delay: 15, duration: 42 },
  { text: "coherence", top: "18%", left: "60%", delay: 20, duration: 50 },
  { text: "insight", top: "65%", left: "45%", delay: 10, duration: 38 },
];

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes drift {
          0% { transform: translate(0, 0); }
          100% { transform: translate(20px, -15px); }
        }
      `}</style>
      {WORDS.map((word) => (
        <span
          key={word.text}
          className="absolute text-sm font-light text-primary"
          style={{
            top: word.top,
            left: word.left,
            opacity: 0.05,
            animation: `drift ${word.duration}s ease-in-out ${word.delay}s infinite alternate`,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}
