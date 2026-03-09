import type { CategoryScore, GradingResult, HighlightRange, HistoryItem } from "./types";

export const mockEssayText = `The integration of technology into modern classrooms has fundamentally transformed how students engage with learning materials. While traditionalists argue that screens distract from genuine understanding, the evidence suggests a more nuanced picture. Digital tools, when implemented thoughtfully, can enhance critical thinking and collaboration among students.

Research from leading educational institutions demonstrates that blended learning environments produce measurable improvements in student outcomes. Interactive simulations allow learners to explore complex scientific concepts, while collaborative platforms enable peer feedback that strengthens writing skills. These tools do not replace teachers but rather amplify their impact.

However, the digital divide remains a pressing concern. Students without reliable internet access or personal devices fall further behind their connected peers. Schools must address infrastructure gaps before adopting technology mandates. Without equitable access, educational technology risks widening the very disparities it promises to close.

Ultimately, the question is not whether technology belongs in education but how we ensure it serves all students. Thoughtful implementation, ongoing teacher training, and a commitment to equity must guide every adoption decision.`;

// Helper to safely compute highlight ranges from the essay text
function hl(
  phrase: string,
  categoryId: string,
  type: "strength" | "improvement",
  startFrom = 0,
): HighlightRange {
  const start = mockEssayText.indexOf(phrase, startFrom);
  if (start === -1) throw new Error(`Highlight phrase not found: "${phrase}"`);
  return { start, end: start + phrase.length, categoryId, type };
}

const contentAndIdeas: CategoryScore = {
  id: "content-ideas",
  name: "Content & Ideas",
  score: 5,
  maxScore: 6,
  strengths: [
    "Strong central argument about the role of technology in modern education",
    "Effective use of specific examples including studies from educational research",
    "Clear awareness of counterarguments and potential drawbacks",
  ],
  improvements: [
    "Could explore long-term societal implications in greater depth",
    "Some claims would benefit from more recent data sources",
  ],
  justification:
    "The essay presents a well-developed argument with relevant evidence, though a few claims lack sufficient supporting data.",
  highlights: [
    hl("The integration of technology into modern classrooms has fundamentally transformed how students engage with learning materials", "content-ideas", "strength"),
    hl("Research from leading educational institutions demonstrates that blended learning environments produce measurable improvements in student outcomes", "content-ideas", "strength"),
    hl("the digital divide remains a pressing concern", "content-ideas", "strength"),
    hl("the question is not whether technology belongs in education but how we ensure it serves all students", "content-ideas", "improvement"),
    hl("Schools must address infrastructure gaps before adopting technology mandates", "content-ideas", "improvement"),
  ],
};

const organization: CategoryScore = {
  id: "organization",
  name: "Organization",
  score: 4,
  maxScore: 6,
  strengths: [
    "Logical progression from introduction through body paragraphs to conclusion",
    "Effective use of topic sentences to guide the reader",
  ],
  improvements: [
    "Transitions between the second and third paragraphs feel abrupt",
    "The conclusion could more effectively tie back to the opening thesis",
  ],
  justification:
    "The overall structure is sound, but a few transitions disrupt the flow and the conclusion misses an opportunity to reinforce the central argument.",
  highlights: [
    // "Digital tools" overlaps with content-ideas "fundamentally transformed" in same paragraph -- cross-category overlap
    hl("Digital tools, when implemented thoughtfully, can enhance critical thinking and collaboration among students", "organization", "strength"),
    hl("Interactive simulations allow learners to explore complex scientific concepts", "organization", "strength"),
    hl("However, the digital divide remains a pressing concern", "organization", "improvement"),
    hl("Ultimately, the question is not whether technology belongs in education", "organization", "improvement"),
  ],
};

const styleAndVoice: CategoryScore = {
  id: "style-voice",
  name: "Style & Voice",
  score: 5,
  maxScore: 6,
  strengths: [
    "Confident, authoritative tone appropriate for an academic essay",
    "Good variation in sentence length and structure",
    "Vocabulary choices are precise without being inaccessible",
  ],
  improvements: [
    "A few instances of passive voice weaken otherwise strong sentences",
  ],
  justification:
    "The writing voice is engaging and well-suited to the audience, with only minor stylistic inconsistencies.",
  highlights: [
    hl("the evidence suggests a more nuanced picture", "style-voice", "strength"),
    hl("These tools do not replace teachers but rather amplify their impact", "style-voice", "strength"),
    hl("educational technology risks widening the very disparities it promises to close", "style-voice", "strength"),
    // Passive voice example -- overlaps with content-ideas range
    hl("when implemented thoughtfully", "style-voice", "improvement"),
  ],
};

const languageConventions: CategoryScore = {
  id: "language-conventions",
  name: "Language Conventions",
  score: 4,
  maxScore: 6,
  strengths: [
    "Generally strong grammar and punctuation throughout",
    "Correct use of academic citation format",
  ],
  improvements: [
    "Several comma splice errors in the third and fourth paragraphs",
    "Inconsistent capitalization of subject-specific terms",
  ],
  justification:
    "Mechanics are mostly solid, but recurring comma splices and capitalization inconsistencies detract from the overall polish.",
  highlights: [
    hl("collaborative platforms enable peer feedback that strengthens writing skills", "language-conventions", "strength"),
    hl("Thoughtful implementation, ongoing teacher training, and a commitment to equity must guide every adoption decision", "language-conventions", "strength"),
    hl("Students without reliable internet access or personal devices fall further behind their connected peers", "language-conventions", "improvement"),
    hl("Without equitable access", "language-conventions", "improvement"),
  ],
};

export const mockGradingResult: GradingResult = {
  id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  essayText: mockEssayText,
  essayExcerpt:
    "The integration of technology into modern classrooms has fundamentally transformed how students engage with learning materials. While traditionalists argue that screens distract...",
  overallScore: 18,
  maxScore: 24,
  summary:
    "This essay presents a thoughtful analysis of technology in education with strong content and an engaging voice. The argument is well-supported by research examples, though organizational flow could be smoother and a few mechanical errors need attention. Overall, this is a solid essay that demonstrates clear analytical thinking.",
  categories: [contentAndIdeas, organization, styleAndVoice, languageConventions],
  gradedAt: "2026-03-08T14:30:00Z",
};

export const mockHistoryItems: HistoryItem[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    essayExcerpt:
      "The integration of technology into modern classrooms has fundamentally transformed how students engage with learning materials...",
    overallScore: 18,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-08T14:30:00Z",
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    essayExcerpt:
      "Growing up in a small coastal town taught me that resilience is not something you are born with, but something the ocean demands...",
    overallScore: 21,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-07T10:15:00Z",
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-012345678902",
    essayExcerpt:
      "This paper examines the correlation between sleep deprivation and academic performance among undergraduate students at three...",
    overallScore: 15,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-06T16:45:00Z",
  },
  {
    id: "d4e5f6a7-b8c9-0123-defa-123456789013",
    essayExcerpt:
      "Social media platforms have created an unprecedented shift in how young people form their political opinions and engage with civic...",
    overallScore: 20,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-05T09:20:00Z",
  },
  {
    id: "e5f6a7b8-c9d0-1234-efab-234567890124",
    essayExcerpt:
      "The debate over standardized testing in public schools has intensified in recent years, with educators and policymakers divided on...",
    overallScore: 12,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-03T11:00:00Z",
  },
  {
    id: "f6a7b8c9-d0e1-2345-fabc-345678901235",
    essayExcerpt:
      "Climate change represents the defining challenge of our generation, yet public discourse remains mired in misinformation and...",
    overallScore: 22,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-03-01T13:30:00Z",
  },
  {
    id: "a7b8c9d0-e1f2-3456-abcd-456789012346",
    essayExcerpt:
      "In examining the works of Toni Morrison, one finds a recurring meditation on memory as both burden and liberation, a theme that...",
    overallScore: 16,
    maxScore: 24,
    categoryCount: 4,
    gradedAt: "2026-02-27T15:10:00Z",
  },
];

export function getMockGradingResultById(id: string): GradingResult {
  return {
    ...mockGradingResult,
    id,
    essayExcerpt:
      mockHistoryItems.find((item) => item.id === id)?.essayExcerpt ??
      mockGradingResult.essayExcerpt,
  };
}
