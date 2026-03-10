import { useEffect } from "react"
import { useNavigate } from "react-router"
import { Check } from "lucide-react"
import { motion } from "motion/react"

export function CompletionStep() {
  const navigate = useNavigate()

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigate("/grade")
    }, 1500)
    return () => clearTimeout(timeout)
  }, [navigate])

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex h-20 w-20 items-center justify-center rounded-full bg-primary"
      >
        <Check className="h-10 w-10 text-primary-foreground" />
      </motion.div>
      <h2 className="text-2xl font-bold">You're all set!</h2>
      <p className="text-muted-foreground">Redirecting you to start grading...</p>
    </div>
  )
}
