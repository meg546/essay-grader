import { motion } from "motion/react"
import { Zap, Target, Sparkles, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Zap,
    title: "Instant Feedback",
    description:
      "Get detailed essay feedback in seconds, not days. No more waiting for manual reviews.",
  },
  {
    icon: Target,
    title: "Rubric-Aligned",
    description:
      "Scores mapped directly to your rubric criteria so you know exactly where to improve.",
  },
  {
    icon: Sparkles,
    title: "Highlighted Passages",
    description:
      "See which parts of your essay earned or lost points with inline highlights.",
  },
  {
    icon: FileText,
    title: "PDF Support",
    description:
      "Upload essays as PDF files or paste text directly. Works with any format.",
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
}

export function FeatureHighlights() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-foreground text-balance">
          Why EssayGrader?
        </h2>
        <motion.div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <Card className="h-full">
                <CardContent className="pt-2">
                  <feature.icon aria-hidden="true" className="mb-3 size-8 text-primary" />
                  <h3 className="font-semibold text-card-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
