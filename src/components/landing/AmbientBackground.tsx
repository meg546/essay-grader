import { motion } from "motion/react"

const orbs = [
  {
    size: "w-[600px] h-[600px]",
    position: { top: "-10%", left: "-5%" },
    animate: { x: [0, 80, -60, 0], y: [0, -50, 70, 0] },
    duration: 35,
  },
  {
    size: "w-[500px] h-[500px]",
    position: { top: "30%", left: "60%" },
    animate: { x: [0, -70, 50, 0], y: [0, 60, -40, 0] },
    duration: 42,
  },
  {
    size: "w-[700px] h-[700px]",
    position: { top: "60%", left: "20%" },
    animate: { x: [0, 60, -80, 0], y: [0, -70, 30, 0] },
    duration: 50,
  },
]

const words = [
  { text: "thesis", top: "12%", left: "8%", duration: 45 },
  { text: "clarity", top: "25%", left: "75%", duration: 50 },
  { text: "structure", top: "45%", left: "15%", duration: 42 },
  { text: "evidence", top: "70%", left: "85%", duration: 48 },
  { text: "argument", top: "85%", left: "40%", duration: 55 },
  { text: "analysis", top: "10%", left: "55%", duration: 40 },
  { text: "coherence", top: "55%", left: "90%", duration: 52 },
  { text: "insight", top: "80%", left: "5%", duration: 44 },
]

export function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none motion-reduce:hidden"
      aria-hidden="true"
    >
      {orbs.map((orb, i) => (
        <motion.div
          key={`orb-${i}`}
          className={`absolute rounded-full blur-3xl ${orb.size}`}
          style={{
            top: orb.position.top,
            left: orb.position.left,
            background:
              "radial-gradient(circle, oklch(0.55 0.10 145 / 0.12), transparent 70%)",
          }}
          animate={orb.animate}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {words.map((word) => (
        <motion.span
          key={word.text}
          className="absolute text-primary opacity-[0.08] text-sm md:text-base font-medium select-none"
          style={{ top: word.top, left: word.left }}
          animate={{
            x: [0, 20, -15, 0],
            y: [0, -25, 10, 0],
          }}
          transition={{
            duration: word.duration,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        >
          {word.text}
        </motion.span>
      ))}
    </div>
  )
}
