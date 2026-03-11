const WORDS = [
  { text: "thesis", top: "5%", left: "8%", delay: "0s", duration: "20s" },
  { text: "clarity", top: "18%", left: "78%", delay: "-5s", duration: "24s" },
  { text: "structure", top: "32%", left: "12%", delay: "-2s", duration: "22s" },
  { text: "evidence", top: "48%", left: "82%", delay: "-8s", duration: "26s" },
  { text: "argument", top: "62%", left: "35%", delay: "-4s", duration: "23s" },
  { text: "analysis", top: "8%", left: "52%", delay: "-10s", duration: "18s" },
  { text: "coherence", top: "75%", left: "70%", delay: "-12s", duration: "25s" },
  { text: "insight", top: "88%", left: "5%", delay: "-7s", duration: "21s" },
]

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes word-float {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(40px, -30px); }
          50% { transform: translate(-25px, 35px); }
          75% { transform: translate(30px, 20px); }
        }
        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(100px, -60px) scale(1.1); }
          66% { transform: translate(-50px, 80px) scale(0.95); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-80px, 50px) scale(1.05); }
          66% { transform: translate(70px, -90px) scale(0.9); }
        }
      `}</style>

      {/* Gradient orbs — no blur filter, using large soft gradients instead */}
      <div
        className="absolute -left-[10%] -top-[5%] h-[800px] w-[800px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(145 30% 50% / 0.08), transparent 60%)",
          animation: "orb-float-1 30s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[50%] top-[25%] h-[700px] w-[700px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(145 25% 45% / 0.07), transparent 60%)",
          animation: "orb-float-2 38s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[10%] top-[55%] h-[900px] w-[900px] rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(145 30% 50% / 0.06), transparent 60%)",
          animation: "orb-float-1 45s ease-in-out infinite reverse",
        }}
      />

      {/* Floating words */}
      {WORDS.map((word) => (
        <span
          key={word.text}
          className="absolute select-none text-sm font-medium md:text-base"
          style={{
            top: word.top,
            left: word.left,
            color: "hsl(145 30% 40%)",
            opacity: 0.15,
            animation: `word-float ${word.duration} ease-in-out ${word.delay} infinite`,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}
