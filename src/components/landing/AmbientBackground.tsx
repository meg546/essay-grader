const WORDS = [
  { text: "thesis", top: "12%", left: "8%", delay: "0s", duration: "45s" },
  { text: "clarity", top: "25%", left: "75%", delay: "-8s", duration: "50s" },
  { text: "structure", top: "45%", left: "15%", delay: "-3s", duration: "42s" },
  { text: "evidence", top: "70%", left: "85%", delay: "-12s", duration: "48s" },
  { text: "argument", top: "85%", left: "40%", delay: "-6s", duration: "55s" },
  { text: "analysis", top: "10%", left: "55%", delay: "-15s", duration: "40s" },
  { text: "coherence", top: "55%", left: "90%", delay: "-20s", duration: "52s" },
  { text: "insight", top: "80%", left: "5%", delay: "-10s", duration: "44s" },
]

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden motion-reduce:hidden"
      aria-hidden="true"
    >
      <style>{`
        @keyframes drift {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(18px, -12px); }
          50% { transform: translate(-10px, 15px); }
          75% { transform: translate(12px, 8px); }
        }
        @keyframes orb-drift-1 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(60px, -40px); }
          66% { transform: translate(-30px, 50px); }
        }
        @keyframes orb-drift-2 {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(-50px, 30px); }
          66% { transform: translate(40px, -60px); }
        }
      `}</style>

      {/* Gradient orbs - using hsl for broad compatibility */}
      <div
        className="absolute -left-[5%] -top-[10%] h-[600px] w-[600px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(145 30% 40% / 0.15), transparent 70%)",
          animation: "orb-drift-1 35s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[60%] top-[30%] h-[500px] w-[500px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(145 30% 40% / 0.12), transparent 70%)",
          animation: "orb-drift-2 42s ease-in-out infinite",
        }}
      />
      <div
        className="absolute left-[20%] top-[60%] h-[700px] w-[700px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, hsl(145 30% 40% / 0.10), transparent 70%)",
          animation: "orb-drift-1 50s ease-in-out infinite reverse",
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
            opacity: 0.12,
            animation: `drift ${word.duration} ease-in-out ${word.delay} infinite`,
          }}
        >
          {word.text}
        </span>
      ))}
    </div>
  )
}
