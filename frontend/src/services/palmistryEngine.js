/* Palm Reading Vision & Feature Detection Analysis Engine */

export const MAJOR_LINES = [
  {
    id: "heart",
    name: "Heart Line (Mensalis)",
    color: "#F43F5E",
    description: "Governs emotional stability, romantic resonance, empathy, affective disposition, and heartful bonding.",
    traits: [
      "Deep & curved upward towards Jupiter mount: Warm-hearted, generous, emotionally expressive, loyal.",
      "Straight across palm: Pragmatic in relationships, values logic over volatile romance.",
      "Forked ending (Writer's fork / Lotus): Exceptional charisma and balanced compassion."
    ]
  },
  {
    id: "head",
    name: "Head Line (Cephalica)",
    color: "#3B82F6",
    description: "Reflects intellectual agility, cognitive processing style, psychological resilience, and creativity.",
    traits: [
      "Long and sloping towards Luna mount: Deep creative intuition, philosophical depth, vivid imagination.",
      "Straight and horizontal across palm: Masterful analytical reasoning, financial acumen, strategic problem solver.",
      "Clear branching: Dual intellectual strengths — excels equally in arts and sciences."
    ]
  },
  {
    id: "life",
    name: "Life Line (Vitalis / Ayur Rekha)",
    color: "#10B981",
    description: "Traditional Samudrika Shastra wellness themes, lifestyle rhythms, and life transitions (illustrative cultural reference, not an empirical health prediction).",
    traits: [
      "Wide curved sweep around Mount of Venus: Expansive vitality, spirited enthusiasm, and steady physical stamina.",
      "Close to the thumb: Contemplative disposition, measured physical output, and reserved energy expenditure.",
      "Ascending branches toward Jupiter: Ambitious self-made achievements and persistent overcoming of hurdles."
    ]
  },
  {
    id: "fate",
    name: "Fate Line (Saturnia / Vidhi Rekha)",
    color: "#F59E0B",
    description: "Represents destiny trajectory, career momentum, external life anchors, and vocational purpose.",
    traits: [
      "Originates at wrist and runs straight to Saturn: Self-directed career, early clarity of life vocation.",
      "Originates from Luna mount: Career accelerated by public appeal, networking, or creative foreign ventures.",
      "Deepening in mid-palm: Monumental career elevation and executive authority post age 30."
    ]
  }
];

export const PALM_MOUNTS = [
  { name: "Mount of Jupiter", position: "Under Index Finger", attributes: "Leadership, Ambition, Dignity, Vision", prominence: "Prominent", rating: 88 },
  { name: "Mount of Saturn", position: "Under Middle Finger", attributes: "Wisdom, Discipline, Destiny, Solitude", prominence: "Balanced", rating: 78 },
  { name: "Mount of Apollo (Sun)", position: "Under Ring Finger", attributes: "Artistry, Fame, Joy, Magnetism", prominence: "Well Defined", rating: 84 },
  { name: "Mount of Mercury", position: "Under Little Finger", attributes: "Commerce, Eloquence, Tech Acumen", prominence: "Prominent", rating: 86 },
  { name: "Mount of Venus", position: "Base of Thumb", attributes: "Sensuality, Vitality, Love, Passion", prominence: "Expansive", rating: 85 },
  { name: "Mount of Luna (Moon)", position: "Lower Outer Palm", attributes: "Intuition, Astral Perception, Travel", prominence: "High", rating: 80 }
];

export function analyzePalmTelemetry(handType = "right", linesConfidence = {}) {
  // Left Hand = Inborn karmic blueprint & subconscious potential
  // Right Hand = Manifested reality, choices made & conscious direction
  const handDuality = handType === "left"
    ? {
        role: "Potential & Inner Soul Blueprint (Left Hand)",
        summary: "Reveals your natal emotional patterns, inherited ancestral traits, latent gifts, and inborn psychic intuition.",
        lifeVitality: "Inherited constitutional fortitude and natural pranic balance are steady and grounded.",
        emotionalNature: "Deeply sensitive inner world; feels emotions intensely before rationalization.",
        careerDrive: "Strong innate creative gifts waiting to be fully actualized in external roles."
      }
    : {
        role: "Manifested Reality & Conscious Will (Right Hand)",
        summary: "Reflects the actual destiny shaped by conscious actions, learned discipline, career achievements, and choices.",
        lifeVitality: "Actively cultivated stamina, disciplined lifestyle rhythms, and resilient vitality.",
        emotionalNature: "Emotionally mature, diplomatic, and fiercely loyal to close inner circle.",
        careerDrive: "High vocational velocity, executive problem-solving prowess, and growing influence."
      };

  const confidenceEntries = Object.values(linesConfidence).filter(v => typeof v === "number" && !isNaN(v));
  const hasLiveTelemetry = confidenceEntries.length > 0;
  const detectedAverage = hasLiveTelemetry
    ? Math.round(confidenceEntries.reduce((a, b) => a + b, 0) / confidenceEntries.length)
    : null;

  return {
    handType,
    handDuality,
    isSimulation: !hasLiveTelemetry,
    readingMode: hasLiveTelemetry ? "telemetry_assisted" : "simulation_prototype",
    prototypeNotice: "Illustrative Archetypal Palm Simulation based on Samudrika Shastra classical benchmarks. This is an educational reference model, not a biometric diagnostic sensor.",
    confidenceScore: detectedAverage, // null when no live telemetry measurement exists
    measuredConfidence: detectedAverage,
    confidenceLabel: detectedAverage !== null ? `${detectedAverage}%` : "Not measured (Illustrative Prototype)",
    handShape: "Earth-Air Hybrid (Practical Mystic Archetype)",
    mounts: PALM_MOUNTS.map(m => ({
      ...m,
      scoreType: "illustrative_reference_score",
      illustrativeReferenceScore: m.rating,
      archetypeBasis: "Classical Samudrika Benchmark (Illustrative)"
    })),
    lines: MAJOR_LINES.map(line => ({
      ...line,
      detectedStrength: hasLiveTelemetry ? "Measured feature" : "Classical Reference Baseline",
      confidence: linesConfidence[line.id] !== undefined ? linesConfidence[line.id] : null
    }))
  };
}
