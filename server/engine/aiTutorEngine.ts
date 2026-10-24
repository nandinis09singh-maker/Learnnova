import { TutorMessage, StudentProfile } from "../types"
import { MathProblemSolver } from "./mathSolver"

// Subject-specific knowledge base for contextual responses
const subjectKnowledge: Record<string, Record<string, string>> = {
  mathematics: {
    algebra:
      "Algebra deals with symbols and rules for manipulating those symbols. Key concepts include variables, expressions, equations, and inequalities. Remember: what you do to one side of an equation, you must do to the other!",
    geometry:
      "Geometry studies shapes, sizes, and properties of space. Key theorems include Pythagoras theorem (a² + b² = c²), properties of triangles, circles, and coordinate geometry.",
    trigonometry:
      "Trigonometry relates angles to side lengths in triangles. The primary ratios are sin(θ) = opposite/hypotenuse, cos(θ) = adjacent/hypotenuse, tan(θ) = opposite/adjacent.",
    quadratic:
      "A quadratic equation has the form ax² + bx + c = 0. Solutions can be found using factoring, completing the square, or the quadratic formula: x = (-b ± √(b²-4ac)) / 2a.",
    statistics:
      "Statistics involves collecting, analyzing, and interpreting data. Key measures include mean (average), median (middle value), mode (most frequent), and standard deviation.",
    calculus:
      "Calculus studies rates of change (differentiation) and accumulation (integration). The derivative of f(x) gives the slope of the tangent line at any point.",
    probability:
      "Probability measures the likelihood of events occurring. P(A) = favorable outcomes / total outcomes. P(A and B) = P(A) × P(B) for independent events.",
    polynomial:
      "Polynomials are expressions with variables raised to non-negative integer powers. The degree of a polynomial is the highest power of the variable.",
    linear:
      "Linear equations produce straight-line graphs. The slope-intercept form is y = mx + b, where m is the slope and b is the y-intercept.",
    factoring:
      "Factoring converts a polynomial into a product of simpler expressions. For x² + bx + c, find two numbers that multiply to c and add to b.",
    vertex:
      "Vertex form of a quadratic is y = a(x - h)² + k, where (h, k) is the vertex. Converting from standard form requires completing the square.",
    transformation:
      "Function transformations include shifts (horizontal/vertical), reflections, and stretches. In y = a(x - h)² + k: h shifts horizontally, k vertically, a stretches/reflects.",
    set: "Set theory deals with collections of objects. Key operations: union (∪), intersection (∩), complement, and difference. Venn diagrams visualize set relationships.",
    number:
      "Number systems progress from natural numbers (ℕ) to integers (ℤ) to rationals (ℚ) to reals (ℝ). Each set includes all previous sets.",
    circle:
      "Circle properties: circumference = 2πr, area = πr². Theorems include tangent-radius perpendicularity, angle in semicircle = 90°, and chord properties.",
  },
  hindi: {
    vyakaran:
      "हिंदी व्याकरण में संज्ञा (noun), सर्वनाम (pronoun), क्रिया (verb), विशेषण (adjective), और अव्यय (indeclinable) प्रमुख शब्द भेद हैं।",
    sandhi:
      "संधि का अर्थ है 'जोड़ना'। दो वर्णों के मिलने से जो विकार होता है उसे संधि कहते हैं। यह तीन प्रकार की होती है: स्वर संधि, व्यंजन संधि, और विसर्ग संधि।",
    samas:
      "समास का अर्थ है 'संक्षेपण'। दो या अधिक पदों का मिलकर एक नया पद बनना समास कहलाता है। प्रमुख प्रकार: अव्ययीभाव, तत्पुरुष, द्वंद्व, बहुव्रीहि।",
    alankar:
      "अलंकार काव्य की शोभा बढ़ाते हैं। प्रमुख अलंकार: उपमा, रूपक, अनुप्रास, यमक, श्लेष, अतिशयोक्ति।",
    ras: "रस काव्य की आत्मा है। नौ रस हैं: श्रृंगार, हास्य, करुण, रौद्र, वीर, भयानक, वीभत्स, अद्भुत, और शांत।",
    grammar:
      "हिंदी व्याकरण के प्रमुख अंग हैं: वर्ण विचार, शब्द विचार, और वाक्य विचार। शुद्ध भाषा लिखने के लिए व्याकरण का ज्ञान आवश्यक है।",
    comprehension:
      "गद्यांश या पद्यांश को ध्यान से पढ़ें। मुख्य विचार, लेखक का उद्देश्य, और शब्दों के अर्थ समझें। उत्तर हमेशा गद्यांश के आधार पर दें।",
  },
  marathi: {
    vyakaran:
      "मराठी व्याकरणात नाम (संज्ञा), सर्वनाम, विशेषण, क्रियापद, आणि अव्यय हे प्रमुख शब्दभेद आहेत।",
    samas:
      "समास म्हणजे दोन किंवा अधिक शब्दांचा एकत्र होणे. प्रमुख प्रकार: अव्ययीभाव, तत्पुरुष, द्वंद्व, बहुव्रीही.",
    sandhi:
      "संधी म्हणजे दोन वर्णांच्या एकत्र येण्याने होणारा बदल. स्वरसंधी, व्यंजनसंधी, आणि विसर्गसंधी हे तीन प्रमुख प्रकार आहेत.",
    grammar:
      "मराठी भाषेचे व्याकरण शिकणे महत्त्वाचे आहे. वाक्यरचना, शब्दभेद, आणि विभक्ती यांचे ज्ञान आवश्यक आहे.",
    comprehension:
      "उतारा काळजीपूर्वक वाचा. मुख्य विचार ओळखा. प्रश्नांची उत्तरे उताऱ्यातून शोधा.",
  },
  english: {
    grammar:
      "English grammar covers parts of speech (nouns, verbs, adjectives, adverbs, etc.), tenses, active/passive voice, direct/indirect speech, and sentence structure.",
    tenses:
      "There are 12 tenses in English: 4 each for present, past, and future. Simple (I write), Continuous (I am writing), Perfect (I have written), Perfect Continuous (I have been writing).",
    vocabulary:
      "Building vocabulary requires reading widely, learning word roots, prefixes, and suffixes. Context clues help determine meaning of unknown words.",
    comprehension:
      "Reading comprehension requires identifying the main idea, supporting details, author's purpose, tone, and making inferences from the text.",
    writing:
      "Good writing has a clear thesis, logical organization, supporting evidence, and a strong conclusion. Use varied sentence structures and precise vocabulary.",
    literature:
      "Literary analysis examines themes, characters, plot, setting, symbolism, and literary devices like metaphor, simile, personification, and irony.",
    voice:
      "Active voice: Subject performs action (The cat caught the mouse). Passive voice: Subject receives action (The mouse was caught by the cat).",
    speech:
      "Direct speech quotes exact words: He said, 'I am happy.' Indirect speech reports: He said that he was happy. Note tense and pronoun changes.",
  },
  social_science: {
    history:
      "History studies past events and their impact on civilization. Key periods include ancient civilizations, medieval era, colonialism, independence movements, and modern history.",
    geography:
      "Geography studies Earth's physical features, climate, resources, and human interactions with the environment. Key concepts: landforms, climate zones, natural resources.",
    civics:
      "Civics deals with rights and duties of citizens, governance structures, democracy, constitution, fundamental rights, and directive principles of state policy.",
    economics:
      "Economics studies production, distribution, and consumption of goods and services. Key concepts: GDP, inflation, supply and demand, fiscal and monetary policy.",
    french_revolution:
      "The French Revolution (1789) overthrew the monarchy. Key causes: social inequality, financial crisis, Enlightenment ideas. Results: Declaration of Rights, republic established.",
    indian_independence:
      "India's independence movement (1857-1947) involved leaders like Gandhi, Nehru, Subhash Chandra Bose. Key events: Salt March, Quit India Movement, Partition.",
    constitution:
      "The Indian Constitution, adopted on 26 January 1950, is the longest written constitution. It guarantees fundamental rights and establishes a federal parliamentary democracy.",
  },
  science: {
    physics:
      "Physics studies matter, energy, and their interactions. Key areas: mechanics (forces, motion), electricity, magnetism, optics, and thermodynamics.",
    chemistry:
      "Chemistry studies matter's composition, structure, and reactions. Key concepts: atomic structure, periodic table, chemical bonding, acids/bases, and reactions.",
    biology:
      "Biology studies living organisms. Key areas: cell structure, genetics, evolution, ecology, human physiology, and plant biology.",
    environment:
      "Environmental science studies ecosystems, biodiversity, pollution, conservation, climate change, and sustainable development.",
    motion:
      "Newton's Laws: 1) Objects stay at rest or in motion unless acted upon. 2) F = ma (Force equals mass times acceleration). 3) Every action has an equal and opposite reaction.",
    atom: "Atoms consist of protons (positive), neutrons (neutral) in the nucleus, and electrons (negative) in orbitals. Atomic number = number of protons.",
    cell: "Cells are the basic unit of life. Plant cells have cell walls and chloroplasts. Animal cells have centrioles. Both have nucleus, mitochondria, and ribosomes.",
    light:
      "Light travels in straight lines at 3×10⁸ m/s. It exhibits reflection, refraction, diffraction, and interference. Key laws: Snell's law for refraction.",
    electricity:
      "Electric current is the flow of electrons. Ohm's Law: V = IR (Voltage = Current × Resistance). Power: P = VI.",
    acid_base:
      "Acids have pH < 7, produce H⁺ ions. Bases have pH > 7, produce OH⁻ ions. Neutralization: Acid + Base → Salt + Water.",
    periodic_table:
      "Elements are arranged by atomic number. Periods go left to right (increasing atomic number). Groups go top to bottom (similar properties).",
  },
  physics: {
    mechanics:
      "Mechanics studies motion and forces. Key equations: v = u + at, s = ut + ½at², v² = u² + 2as. Newton's laws govern all mechanical interactions.",
    waves:
      "Waves transfer energy without transferring matter. Types: transverse (light) and longitudinal (sound). Key properties: wavelength, frequency, amplitude, speed.",
    optics:
      "Optics studies light behavior. Reflection: angle of incidence = angle of reflection. Refraction: Snell's law n₁sinθ₁ = n₂sinθ₂.",
    thermodynamics:
      "Thermodynamics studies heat and energy transfer. Laws: 0th (thermal equilibrium), 1st (energy conservation), 2nd (entropy increases), 3rd (absolute zero limit).",
    electrostatics:
      "Electrostatics studies charges at rest. Coulomb's Law: F = kq₁q₂/r². Electric field E = F/q. Potential V = kq/r.",
    magnetism:
      "Moving charges create magnetic fields. Force on a charge: F = qvBsinθ. Solenoids create uniform fields. Electromagnetic induction: changing flux creates EMF.",
    modern_physics:
      "Modern physics includes quantum mechanics, relativity, and nuclear physics. E = mc², photoelectric effect (E = hf - φ), and wave-particle duality.",
    gravitation:
      "Newton's Law of Gravitation: F = Gm₁m₂/r². Gravitational acceleration g = GM/R². Orbital velocity v = √(GM/r).",
    current:
      "Electric current I = Q/t. Ohm's Law: V = IR. Kirchhoff's Laws: junction rule (ΣI = 0) and loop rule (ΣV = 0).",
    rotational:
      "Rotational motion: torque τ = rFsinθ = Iα. Moment of inertia I depends on mass distribution. Angular momentum L = Iω is conserved.",
  },
  chemistry: {
    atomic:
      "Atomic structure: Bohr model has electrons in fixed orbits. Quantum model uses orbitals (s, p, d, f). Aufbau principle, Hund's rule, and Pauli exclusion principle govern electron configuration.",
    organic:
      "Organic chemistry studies carbon compounds. Key concepts: functional groups (hydroxyl, carbonyl, carboxyl, amino), nomenclature (IUPAC), isomerism, and reaction mechanisms.",
    bonding:
      "Chemical bonds: ionic (electron transfer), covalent (electron sharing), metallic (electron sea). Bond properties: length, energy, polarity. VSEPR theory predicts molecular shapes.",
    equilibrium:
      "Chemical equilibrium: forward and reverse reaction rates are equal. Le Chatelier's principle: system shifts to counteract changes in concentration, pressure, or temperature.",
    electrochemistry:
      "Electrochemistry connects chemical reactions and electricity. Galvanic cells produce electricity. Electrolytic cells use electricity for reactions. Nernst equation gives cell potential.",
    solutions:
      "Solutions are homogeneous mixtures. Concentration units: molarity (M = mol/L), molality (m = mol/kg solvent). Raoult's law governs vapor pressure of solutions.",
    thermochemistry:
      "Enthalpy (H) measures heat at constant pressure. Exothermic: ΔH < 0 (releases heat). Endothermic: ΔH > 0 (absorbs heat). Hess's law allows calculation of ΔH.",
  },
  biology: {
    cell_biology:
      "Cell biology studies cell structure and function. Prokaryotic cells lack a nucleus. Eukaryotic cells have membrane-bound organelles. Cell division: mitosis (growth) and meiosis (reproduction).",
    genetics:
      "Genetics studies heredity. DNA carries genetic information. Mendel's laws: dominance, segregation, independent assortment. Genotype determines phenotype.",
    ecology:
      "Ecology studies organism-environment interactions. Ecosystem components: producers, consumers, decomposers. Energy flows through food chains/webs. Biogeochemical cycles recycle matter.",
    physiology:
      "Human physiology studies body systems: digestive, respiratory, circulatory, nervous, excretory, endocrine, and reproductive. Homeostasis maintains internal balance.",
    evolution:
      "Evolution explains biodiversity through natural selection. Organisms with favorable traits survive and reproduce more. Evidence: fossils, comparative anatomy, DNA sequences.",
    plant_biology:
      "Plants photosynthesize: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂. Transport: xylem (water up), phloem (food both ways). Hormones: auxin, gibberellin, cytokinin.",
    molecular:
      "Molecular biology studies DNA, RNA, and proteins. Central dogma: DNA → RNA → Protein. DNA replication, transcription, and translation are key processes.",
  },
  it: {
    programming:
      "Programming involves writing instructions for computers. Key concepts: variables, data types, loops, conditionals, functions. Python is a popular beginner language.",
    databases:
      "Databases organize and store data. SQL (Structured Query Language) is used to create, read, update, and delete data. Key commands: SELECT, INSERT, UPDATE, DELETE.",
    networking:
      "Computer networking connects devices for data sharing. Key concepts: IP addresses, protocols (TCP/IP, HTTP), LAN, WAN, routers, switches, and cybersecurity.",
    web: "Web technology includes HTML (structure), CSS (styling), and JavaScript (interactivity). Frontend handles user interface; backend handles server logic and databases.",
    python:
      "Python is a high-level, interpreted language. Key features: dynamic typing, indentation-based syntax, extensive libraries. Data structures: lists, tuples, dictionaries, sets.",
    algorithms:
      "Algorithms are step-by-step problem-solving procedures. Key types: sorting (bubble, merge, quick), searching (linear, binary), and graph algorithms (BFS, DFS).",
    cybersecurity:
      "Cybersecurity protects systems from digital attacks. Key concepts: encryption, firewalls, malware, phishing, strong passwords, and two-factor authentication.",
    data_structures:
      "Data structures organize data efficiently. Arrays (indexed), linked lists (sequential), stacks (LIFO), queues (FIFO), trees (hierarchical), graphs (networked).",
  },
}

// Extract topic keywords from user message
function extractTopics(text: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    algebra: [
      "algebra",
      "equation",
      "variable",
      "expression",
      "linear",
      "solve for x",
      "polynomial",
    ],
    geometry: [
      "geometry",
      "triangle",
      "circle",
      "angle",
      "area",
      "perimeter",
      "theorem",
      "pythagoras",
      "congruent",
      "similar",
    ],
    trigonometry: [
      "trigonometry",
      "sin",
      "cos",
      "tan",
      "sine",
      "cosine",
      "tangent",
      "theta",
      "angle",
    ],
    quadratic: [
      "quadratic",
      "parabola",
      "vertex",
      "discriminant",
      "roots",
      "ax²",
      "x²",
    ],
    statistics: [
      "statistics",
      "mean",
      "median",
      "mode",
      "data",
      "average",
      "standard deviation",
      "probability",
    ],
    calculus: [
      "calculus",
      "derivative",
      "integral",
      "differentiation",
      "integration",
      "limit",
    ],
    factoring: [
      "factor",
      "factoring",
      "factorise",
      "trinomial",
      "gcf",
      "common factor",
    ],
    vertex: ["vertex form", "completing the square", "vertex", "h,k"],
    transformation: [
      "transformation",
      "shift",
      "translate",
      "reflect",
      "stretch",
      "compress",
      "f(x-h)",
    ],
    mechanics: [
      "mechanics",
      "force",
      "motion",
      "velocity",
      "acceleration",
      "newton",
      "momentum",
      "inertia",
    ],
    waves: [
      "wave",
      "frequency",
      "wavelength",
      "amplitude",
      "sound",
      "vibration",
    ],
    optics: [
      "optics",
      "light",
      "mirror",
      "lens",
      "refraction",
      "reflection",
      "prism",
    ],
    thermodynamics: [
      "thermodynamics",
      "heat",
      "temperature",
      "entropy",
      "enthalpy",
      "thermal",
    ],
    electrostatics: [
      "electrostatic",
      "charge",
      "coulomb",
      "electric field",
      "potential",
    ],
    current: [
      "current",
      "circuit",
      "resistance",
      "ohm",
      "voltage",
      "capacitor",
    ],
    magnetism: [
      "magnet",
      "magnetic",
      "solenoid",
      "electromagnetic",
      "induction",
      "flux",
    ],
    atomic: [
      "atom",
      "electron",
      "proton",
      "neutron",
      "orbital",
      "shell",
      "configuration",
    ],
    organic: [
      "organic",
      "carbon",
      "hydrocarbon",
      "functional group",
      "alkane",
      "alkene",
      "alcohol",
      "ester",
    ],
    bonding: [
      "bond",
      "ionic",
      "covalent",
      "metallic",
      "electronegativity",
      "polarity",
    ],
    equilibrium: [
      "equilibrium",
      "le chatelier",
      "reversible",
      "equilibrium constant",
    ],
    cell_biology: [
      "cell",
      "mitochondria",
      "nucleus",
      "membrane",
      "organelle",
      "mitosis",
      "meiosis",
    ],
    genetics: [
      "gene",
      "dna",
      "rna",
      "heredity",
      "mendel",
      "chromosome",
      "allele",
      "genotype",
      "phenotype",
    ],
    ecology: [
      "ecology",
      "ecosystem",
      "food chain",
      "biodiversity",
      "habitat",
      "population",
    ],
    physiology: [
      "physiology",
      "digestion",
      "respiration",
      "circulation",
      "nervous system",
      "excretion",
      "hormone",
    ],
    evolution: [
      "evolution",
      "natural selection",
      "darwin",
      "adaptation",
      "fossil",
      "species",
    ],
    programming: [
      "programming",
      "code",
      "coding",
      "loop",
      "function",
      "variable",
      "algorithm",
    ],
    python: ["python", "print", "def", "import", "list", "dictionary", "tuple"],
    databases: [
      "database",
      "sql",
      "table",
      "query",
      "select",
      "insert",
      "join",
      "primary key",
    ],
    networking: [
      "network",
      "ip address",
      "protocol",
      "tcp",
      "http",
      "router",
      "server",
      "client",
    ],
    web: [
      "html",
      "css",
      "javascript",
      "website",
      "web page",
      "frontend",
      "backend",
    ],
    vyakaran: [
      "vyakaran",
      "व्याकरण",
      "grammar",
      "संज्ञा",
      "सर्वनाम",
      "क्रिया",
      "विशेषण",
    ],
    sandhi: ["sandhi", "संधि", "स्वर", "व्यंजन", "विसर्ग"],
    samas: ["samas", "समास", "compound", "तत्पुरुष", "द्वंद्व"],
    alankar: ["alankar", "अलंकार", "उपमा", "रूपक", "अनुप्रास"],
    ras: ["ras", "रस", "श्रृंगार", "करुण", "हास्य", "sentiment"],
    tenses: ["tense", "present", "past", "future", "continuous", "perfect"],
    voice: ["voice", "active", "passive", "active voice", "passive voice"],
    speech: [
      "direct speech",
      "indirect speech",
      "reported speech",
      "narration",
    ],
    history: [
      "history",
      "revolution",
      "war",
      "independence",
      "empire",
      "civilization",
      "ancient",
      "medieval",
    ],
    geography: [
      "geography",
      "climate",
      "landform",
      "river",
      "mountain",
      "continent",
      "map",
      "latitude",
      "longitude",
    ],
    civics: [
      "civics",
      "democracy",
      "constitution",
      "rights",
      "government",
      "parliament",
      "judiciary",
    ],
    economics: [
      "economics",
      "gdp",
      "inflation",
      "demand",
      "supply",
      "market",
      "trade",
      "budget",
    ],
    environment: [
      "environment",
      "pollution",
      "conservation",
      "ecosystem",
      "climate change",
      "global warming",
      "ozone",
    ],
    acid_base: ["acid", "base", "ph", "neutralization", "indicator", "litmus"],
    periodic_table: [
      "periodic",
      "element",
      "metal",
      "nonmetal",
      "group",
      "period",
    ],
    electricity: ["electricity", "current", "circuit", "battery", "resistance"],
    motion: [
      "motion",
      "speed",
      "velocity",
      "acceleration",
      "distance",
      "displacement",
    ],
    light: ["light", "ray", "mirror", "lens", "reflection", "refraction"],
    circle: [
      "circle",
      "radius",
      "diameter",
      "circumference",
      "chord",
      "tangent",
      "arc",
    ],
    number: ["number", "rational", "irrational", "real", "integer", "natural"],
    set: [
      "set",
      "union",
      "intersection",
      "venn diagram",
      "subset",
      "complement",
    ],
    probability: [
      "probability",
      "chance",
      "likelihood",
      "random",
      "event",
      "sample space",
    ],
    comprehension: [
      "comprehension",
      "passage",
      "reading",
      "understand",
      "extract",
      "summary",
    ],
    literature: [
      "literature",
      "poem",
      "poet",
      "novel",
      "story",
      "author",
      "character",
      "theme",
    ],
    writing: ["writing", "essay", "paragraph", "letter", "formal", "informal"],
    vocabulary: [
      "vocabulary",
      "word",
      "meaning",
      "synonym",
      "antonym",
      "idiom",
    ],
    plant_biology: [
      "plant",
      "photosynthesis",
      "xylem",
      "phloem",
      "chlorophyll",
      "transpiration",
    ],
    molecular: [
      "molecular",
      "dna replication",
      "transcription",
      "translation",
      "protein synthesis",
    ],
    electrochemistry: [
      "electrochemistry",
      "galvanic",
      "electrolysis",
      "electrode",
      "cell potential",
    ],
    solutions: [
      "solution",
      "solute",
      "solvent",
      "molarity",
      "concentration",
      "dilution",
    ],
    thermochemistry: [
      "enthalpy",
      "exothermic",
      "endothermic",
      "hess",
      "calorimetry",
    ],
    algorithms: [
      "algorithm",
      "sorting",
      "searching",
      "binary search",
      "bubble sort",
      "complexity",
    ],
    cybersecurity: [
      "cybersecurity",
      "security",
      "encryption",
      "firewall",
      "malware",
      "hacking",
      "password",
    ],
    data_structures: [
      "data structure",
      "array",
      "linked list",
      "stack",
      "queue",
      "tree",
      "graph",
    ],
    gravitation: [
      "gravity",
      "gravitation",
      "gravitational",
      "orbit",
      "satellite",
      "escape velocity",
    ],
    rotational: [
      "rotation",
      "torque",
      "angular",
      "moment of inertia",
      "angular momentum",
    ],
    modern_physics: [
      "quantum",
      "relativity",
      "photoelectric",
      "nuclear",
      "radioactive",
      "photon",
    ],
  }

  const lower = text.toLowerCase()
  const found: string[] = []
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const kw of keywords) {
      // Use boundary matching so short keywords like 'ph' do not match inside 'photosynthesis'
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escapeRegExp(kw)}($|[^a-zA-Z0-9_])`, "i")
      if (regex.test(lower)) {
        found.push(topic)
        break
      }
    }
  }

  return found
}

// Detect which subject category a topic belongs to
function findSubjectForTopic(topic: string): string | null {
  for (const [subject, topics] of Object.entries(subjectKnowledge)) {
    if (topic in topics) return subject
  }
  return null
}

export class AiTutorEngine {
  private conversationHistory: { role: string; content: string }[] = []

  public generateResponse(
    userText: string,
    mode: "explanation" | "analogy" | "step_by_step" | "practice_question" | "socratic",
    profile: StudentProfile,
    activeConceptId?: string,
  ): TutorMessage {
    const textLower = userText.toLowerCase()
    const detectedTopics = extractTopics(userText)
    const studentName = profile.name.split(" ")[0] || profile.name

    // Store conversation for context
    this.conversationHistory.push({ role: "user", content: userText })

    let responseText = ""
    let practiceProblem: TutorMessage["practiceProblem"] | undefined = undefined

    // 1. Try to find relevant subject knowledge based on detected topics
    let relevantKnowledge: string[] = []
    for (const topic of detectedTopics) {
      const subject = findSubjectForTopic(topic)
      if (subject && subjectKnowledge[subject]?.[topic]) {
        relevantKnowledge.push(subjectKnowledge[subject][topic])
      }
    }

    // 2. Check for greetings & pleasantries
    const isGreeting =
      /^(hi|hello|hey|namaste|namaskar|good\s*(morning|afternoon|evening)|howdy|sup|greetings)\b/i.test(
        textLower.trim(),
      ) ||
      textLower.trim() === "hi" ||
      textLower.trim() === "hello" ||
      textLower.trim() === "hey" ||
      textLower.includes("how are you") ||
      textLower.includes("who are you")

    if (isGreeting && textLower.length < 50) {
      responseText = `Hello ${studentName}! 👋 I'm Nova, your AI study coach.

I'm here to help you master your subjects and solve any problem step-by-step! Here's how you can use me:
• 🧮 **Solve Equations**: Give me any equation, like \`2x + 5 = 15\` or \`x² - 7x + 10 = 0\`
• 🧩 **Factor Polynomials**: Try \`Factor x² + 7x + 12\` or \`Factor x² - 49\`
• 📐 **Analyze Functions**: Try \`Vertex of y = 2(x - 3)² + 4\` or \`Area of circle radius 7\`
• 💡 **Explain Concepts**: Ask me to explain quadratic functions, graph shifts, or cell division
• 🎯 **Practice**: Ask for a practice problem to test your knowledge

What would you like to work on right now?`
      return this.createMessage(responseText, mode, practiceProblem)
    }

    // 3. STEP-BY-STEP MATH & SCIENCE PROBLEM SOLVER
    const mathSolution = MathProblemSolver.trySolve(userText)
    if (mathSolution) {
      responseText = MathProblemSolver.formatSolution(mathSolution, studentName)
      return this.createMessage(responseText, "step_by_step", practiceProblem)
    }

    // 4. Check for "what can you do" / help queries
    if (
      textLower.includes("what can you do") ||
      textLower.includes("help me") ||
      textLower.includes("how to use") ||
      textLower.includes("what are you")
    ) {
      responseText = `I'm Nova, your adaptive AI study coach! Here's what I can do for you, ${studentName}:

🧮 **Step-by-Step Problem Solving:**
• Send me any linear equation (e.g. \`2x + 5 = 15\`, \`3(x - 4) = 18\`, \`5x + 3 = 2x + 18\`)
• Send me any quadratic equation (e.g. \`x² + 5x + 6 = 0\`, \`2x² + 5x - 3 = 0\`)
• Ask me to factor expressions (e.g. \`Factor x² + 7x + 12\`, \`Factor x² - 25\`)
• Ask for vertex form & transformations (e.g. \`Vertex of y = 2(x - 3)² + 4\`)
• Arithmetic, percentages, geometry (e.g. \`Area of circle radius 7\`, \`Slope between (1, 2) and (4, 8)\`)

📚 **Subject Concept Coverage:**
• Mathematics (Algebra, Geometry, Trigonometry, Quadratics, Calculus)
• Physics (Mechanics, Optics, Thermodynamics, Electricity)
• Chemistry (Atomic structure, Organic chemistry, Bonding)
• Biology (Cell structure, Genetics, Ecology)
• Languages (English, Hindi grammar, Marathi vyakaran)

🎯 **How You Can Interact:**
• Type any problem directly to see the step-by-step solution
• Ask for a visual explanation or real-world analogy
• Request practice questions to test your skills

Just type your question or equation below! 🚀`
      return this.createMessage(responseText, mode, practiceProblem)
    }

    // 4. Mode-based response with detected topic context
    if (
      mode === "practice_question" ||
      textLower.includes("practice") ||
      textLower.includes("quiz me") ||
      textLower.includes("test me") ||
      textLower.includes("give me a question") ||
      textLower.includes("try one")
    ) {
      const practiceData = this.generatePracticeForTopics(
        detectedTopics,
        textLower,
        studentName,
      )
      responseText = practiceData.text
      practiceProblem = practiceData.problem
    } else if (
      mode === "analogy" ||
      textLower.includes("analogy") ||
      textLower.includes("real-world") ||
      textLower.includes("real life") ||
      textLower.includes("example from life")
    ) {
      responseText = this.generateAnalogyResponse(
        detectedTopics,
        relevantKnowledge,
        textLower,
        studentName,
      )
    } else if (
      mode === "step_by_step" ||
      textLower.includes("step by step") ||
      textLower.includes("how to") ||
      textLower.includes("procedure") ||
      textLower.includes("algorithm") ||
      textLower.includes("method")
    ) {
      responseText = this.generateStepByStepResponse(
        detectedTopics,
        relevantKnowledge,
        textLower,
        studentName,
      )
    } else if (
      mode === "socratic" ||
      textLower.includes("why") ||
      textLower.includes("hint") ||
      textLower.includes("clue") ||
      textLower.includes("guide me")
    ) {
      responseText = this.generateSocraticResponse(
        detectedTopics,
        relevantKnowledge,
        textLower,
        studentName,
      )
    } else {
      // Default: explanation mode — use detected topic knowledge
      responseText = this.generateExplanationResponse(
        detectedTopics,
        relevantKnowledge,
        textLower,
        studentName,
        profile,
      )
    }

    // Fallback if nothing was generated
    if (!responseText.trim()) {
      responseText = `That's an interesting question, ${studentName}! Let me help you with that.

I'd be happy to explain this topic. Could you tell me a bit more about what specifically you'd like to know? For example:
• Which subject is this related to?
• What grade level are you studying?
• Is there a specific concept or formula you're stuck on?

The more details you give me, the better I can tailor my explanation to your needs! 🎯`
    }

    this.conversationHistory.push({ role: "assistant", content: responseText })

    return this.createMessage(responseText, mode, practiceProblem)
  }

  private createMessage(
    text: string,
    mode: string,
    practiceProblem?: TutorMessage["practiceProblem"],
  ): TutorMessage {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      from: "ai",
      text,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      mode: mode as any,
      practiceProblem,
    }
  }

  private generateExplanationResponse(
    topics: string[],
    knowledge: string[],
    text: string,
    name: string,
    profile: StudentProfile,
  ): string {
    if (knowledge.length > 0) {
      const topicName = topics[0].replace(/_/g, " ")
      return `Great question, ${name}! Let me explain **${topicName}** for you:

${knowledge[0]}

${knowledge.length > 1 ? `\n**Related concept:** ${knowledge[1]}\n` : ""}
💡 **Key Takeaway:** Understanding ${topicName} is fundamental. Would you like me to:
• Give you a **real-world analogy** to make this click?
• Walk through a **step-by-step example**?
• Test your understanding with a **practice problem**?

Just ask! I'm here to help you master this concept. 🚀`
    }

    // Try to generate a contextual response based on the raw text
    return this.generateContextualFallback(text, name, profile)
  }

  private generateContextualFallback(
    text: string,
    name: string,
    profile: StudentProfile,
  ): string {
    const lower = text.toLowerCase()

    // Check for specific question patterns
    if (
      lower.includes("what is") ||
      lower.includes("define") ||
      lower.includes("explain")
    ) {
      const subject = lower
        .replace(/what is|define|explain|the|a|an|please|can you|me/gi, "")
        .trim()
      return `Let me explain **${subject}** for you, ${name}!

This is an important concept. ${subject.charAt(0).toUpperCase() + subject.slice(1)} refers to a fundamental idea in your studies. Here's what you need to know:

1. **Definition**: Understanding the core meaning helps build a strong foundation
2. **Application**: This concept appears in various forms across your curriculum
3. **Connection**: It connects to other topics you're learning

Would you like me to go deeper into any specific aspect? I can provide:
• A detailed breakdown with examples
• A real-world analogy
• Practice problems to test your understanding

Just let me know! 📖`
    }

    if (
      lower.includes("solve") ||
      lower.includes("calculate") ||
      lower.includes("find the value")
    ) {
      return `Let me help you solve this, ${name}! 🧮

To approach this problem systematically:
1. **Identify** what's given and what we need to find
2. **Choose** the right formula or method
3. **Substitute** the known values
4. **Calculate** step by step
5. **Verify** your answer makes sense

Could you share the specific problem or equation? I'll walk through it with you step by step! 📝`
    }

    if (lower.includes("difference between") || lower.includes("compare")) {
      const match = lower.match(
        /(?:difference between|compare)\s+(.+?)(?:\s+and\s+)(.+?)(?:\?|$|\.)/i,
      )
      if (match) {
        return `Great comparative question, ${name}! Let me break down the differences between **${match[1].trim()}** and **${match[2].trim()}**:

| Aspect | ${match[1].trim()} | ${match[2].trim()} |
|--------|----------|----------|
| Definition | Core characteristic A | Core characteristic B |
| Usage | Applied in context A | Applied in context B |
| Key Feature | Distinguishing trait A | Distinguishing trait B |

Would you like me to elaborate on any specific aspect of this comparison? I can also give you practice questions to reinforce your understanding! 🎯`
      }
    }

    // Generic but personalized response
    const activeGap = profile.gaps[0]?.conceptName || "your current topic"
    return `That's a great question, ${name}! 🌟

Based on your learning profile, I see you're working on **${activeGap}**. Let me help you with your specific question.

I can explain this concept in multiple ways:
• **Visual explanation** — with diagrams and examples
• **Real-world analogy** — connecting to everyday life
• **Step-by-step** — systematic walkthrough
• **Practice problem** — test your understanding

Could you be a bit more specific about what you'd like to know? The more details you share, the more targeted my help will be! 💪`
  }

  private generateAnalogyResponse(
    topics: string[],
    knowledge: string[],
    text: string,
    name: string,
  ): string {
    const analogies: Record<string, string> = {
      quadratic: `Imagine throwing a basketball toward the hoop, ${name}! 🏀 The path it traces is a parabola — a quadratic curve! The highest point (vertex) is like the apex of the arc. The equation y = a(x - h)² + k describes this arc: h is where you shoot from, k is the peak height, and a controls how steep the arc is.`,
      factoring: `Think of factoring like reverse cooking, ${name}! 🍳 If multiplication is combining ingredients (flour + eggs + sugar = cake), then factoring is looking at the cake and figuring out what ingredients went into it. For x² + 5x + 6, we're asking: "What two ingredients (binomials) multiply to give this?"`,
      mechanics: `Think of Newton's laws like bumper cars, ${name}! 🎢 First law: a parked bumper car stays still until someone pushes it. Second law: the harder you push (more force), the faster it goes (more acceleration). Third law: when two cars collide, both feel the impact equally!`,
      cell_biology: `A cell is like a city, ${name}! 🏙️ The nucleus is city hall (control center), mitochondria are power plants (energy), ribosomes are factories (making proteins), the cell membrane is the city wall (protection), and the cytoplasm is the roads and parks connecting everything!`,
      genetics: `DNA is like a recipe book, ${name}! 📖 Each gene is a recipe (instructions for making a protein). Chromosomes are chapters. When cells divide, they photocopy the entire book. Sometimes typos (mutations) happen, which can change the recipe slightly.`,
      programming: `Programming is like giving directions to a very literal friend, ${name}! 🗺️ You can't say "go to the store" — you need to say "walk 100 steps north, turn right, walk 50 steps, enter the building with the red door." Computers follow instructions exactly, step by step!`,
      electricity: `Electricity is like water flowing through pipes, ${name}! 🚰 Voltage is like water pressure (pushes current). Current is how much water flows. Resistance is how narrow the pipe is. A battery is the pump creating pressure. Ohm's Law (V = IR) connects them all!`,
      periodic_table: `The periodic table is like a seating chart for elements, ${name}! 🎭 Elements in the same column (group) have similar personalities (chemical properties). Elements in the same row (period) have increasing energy levels. Just like students in a classroom, their position tells you a lot about them!`,
      ecology: `An ecosystem is like a neighborhood, ${name}! 🏘️ Plants are the grocery stores (producers), herbivores are the customers, carnivores are the security guards. Decomposers are the recycling center. Energy flows from stores → customers → guards, and the recycling center keeps everything clean!`,
      acid_base: `Acids and bases are like two rival sports teams, ${name}! ⚽ Acids donate H⁺ ions (they're generous givers), bases accept H⁺ ions (they're collectors). When they meet in neutralization, it's like a draw — they create salt and water, and everyone's calm (pH = 7)!`,
    }

    for (const topic of topics) {
      if (analogies[topic]) return analogies[topic]
    }

    if (knowledge.length > 0) {
      return `Here's a way to think about this in real-world terms, ${name}! 🌍

${knowledge[0]}

Think of it like this: just as you learn to ride a bicycle by starting with training wheels and gradually removing them, concepts build on each other. Master the basics first, and the advanced ideas become much easier!

Would you like another analogy or a different way to look at this? 🎯`
    }

    return `Great idea to use analogies, ${name}! 🧠 Could you tell me which specific concept you'd like me to compare to a real-world example? I can create analogies for any topic — math, science, languages, or social studies!`
  }

  private generateStepByStepResponse(
    topics: string[],
    knowledge: string[],
    text: string,
    name: string,
  ): string {
    const stepGuides: Record<string, string> = {
      quadratic: `Here's the step-by-step algorithm for solving quadratic equations, ${name}:

**Method 1: Factoring**
1. Write the equation in standard form: ax² + bx + c = 0
2. Find two numbers that multiply to ac and add to b
3. Split the middle term using these numbers
4. Factor by grouping
5. Set each factor equal to zero
6. Solve for x

**Method 2: Quadratic Formula**
1. Identify a, b, and c from ax² + bx + c = 0
2. Calculate discriminant: Δ = b² - 4ac
3. Apply formula: x = (-b ± √Δ) / 2a
4. Simplify to get your solutions

💡 **Pro tip:** If Δ > 0: two real roots. If Δ = 0: one repeated root. If Δ < 0: no real roots!`,
      factoring: `Here's how to factor any trinomial step by step, ${name}:

1. **Check for GCF** — Factor out the greatest common factor first
2. **Identify the pattern** — Is it x² + bx + c? Or ax² + bx + c (where a ≠ 1)?
3. **For x² + bx + c:** Find two numbers that multiply to c and add to b
4. **Write the factors:** (x + p)(x + q) where p and q are your numbers
5. **Verify by expanding** — multiply back to check your work

Example: x² + 7x + 12
- Need: p × q = 12 AND p + q = 7
- Answer: p = 3, q = 4
- Result: (x + 3)(x + 4) ✅`,
      transformation: `Step-by-step guide to graphing transformations, ${name}:

1. **Start with parent function** — f(x) = x² has vertex at (0, 0)
2. **Check inside (x - h)** — This is the HORIZONTAL shift
   • (x - 3) → shift RIGHT 3 (opposite sign!)
   • (x + 2) → shift LEFT 2
3. **Check the multiplier a** — This controls stretch and direction
   • |a| > 1 → narrower/steeper
   • |a| < 1 → wider/flatter
   • a < 0 → flip upside down (reflection)
4. **Check outside + k** — This is the VERTICAL shift
   • +3 → shift UP 3
   • −5 → shift DOWN 5
5. **Plot the new vertex** at (h, k) and sketch!

Example: y = -2(x + 1)² + 4 → Vertex at (-1, 4), opens DOWN, narrow ⬇️`,
    }

    for (const topic of topics) {
      if (stepGuides[topic]) return stepGuides[topic]
    }

    if (knowledge.length > 0) {
      return `Here's a systematic approach, ${name}! 📋

${knowledge[0]}

**General Problem-Solving Steps:**
1. **Read** the problem carefully and identify what's given
2. **Identify** the relevant concept or formula
3. **Plan** your approach before calculating
4. **Execute** the steps one by one
5. **Check** your answer — does it make sense?

Would you like me to walk through a specific example? 🎯`
    }

    return `I'd love to give you a step-by-step walkthrough, ${name}! 📝 Could you specify which concept or problem type you'd like me to break down? I can create detailed guides for any topic!`
  }

  private generateSocraticResponse(
    topics: string[],
    knowledge: string[],
    text: string,
    name: string,
  ): string {
    if (topics.length > 0) {
      const socraticQuestions: Record<string, string> = {
        quadratic: `Let's think about this together, ${name}! 🤔

Consider the equation x² - 5x + 6 = 0. Instead of jumping to the formula, ask yourself:
• What two numbers multiply to give 6?
• Of those pairs, which pair also adds up to -5?
• Once you find those numbers, how would you write the factored form?

Try working through it, and tell me what you get! I'll guide you from there. 💪`,
        transformation: `Let's discover this together, ${name}! 🔍

Look at f(x) = (x - 3)². When x = 3, what does (3 - 3)² equal? 
Now think: why does the lowest point (vertex) move to x = 3?

Here's the key insight: you need to input x = 3 just to get back to zero inside the parentheses. The shift works "opposite" because of this offset.

Does this help you see WHY the horizontal shift reverses sign? What happens if we use (x + 2)²? 🎯`,
        factoring: `Let's explore this step by step, ${name}! 🧩

If I tell you that (x + a)(x + b) = x² + (a+b)x + ab, can you see why factoring is just "reverse multiplication"?

For x² + 7x + 12:
• What is the product (ab)? It's 12.
• What is the sum (a+b)? It's 7.
• Can you find two numbers that satisfy BOTH conditions?

Try listing factor pairs of 12: (1,12), (2,6), (3,4)... which pair sums to 7? 🎯`,
        genetics: `Let's think about inheritance, ${name}! 🧬

If a tall plant (TT) crosses with a short plant (tt):
• What alleles can the tall parent pass on?
• What alleles can the short parent pass on?
• What will the offspring's genotype be?
• Will the offspring be tall or short? Why?

Draw a Punnett square and tell me what you find! 📝`,
      }

      for (const topic of topics) {
        if (socraticQuestions[topic]) return socraticQuestions[topic]
      }
    }

    return `Let's work through this together, ${name}! 🤔

Before I give you the answer, let me ask:
1. What do you already know about this topic?
2. What part specifically confuses you?
3. Can you think of a simpler version of this problem?

Sometimes the best way to learn is to identify exactly where you get stuck. Share your thinking with me, and I'll help guide you to the answer! 💡`
  }

  private generatePracticeForTopics(
    topics: string[],
    text: string,
    name: string,
  ): { text: string; problem?: TutorMessage["practiceProblem"] } {
    const practiceBank: Record<string, {
      prompt: string
      hint: string
      solution: string
    }[]> = {
      quadratic: [
        {
          prompt: "Solve x² - 7x + 10 = 0 using factoring.",
          hint: "Find two numbers that multiply to 10 and add to -7.",
          solution: "x² - 7x + 10 = (x - 2)(x - 5) = 0, so x = 2 or x = 5",
        },
        {
          prompt: "Find the vertex of y = 2(x - 3)² + 1.",
          hint: "In vertex form y = a(x - h)² + k, the vertex is (h, k).",
          solution: "Vertex = (3, 1), parabola opens upward (a = 2 > 0)",
        },
        {
          prompt:
            "What is the discriminant of 3x² + 2x - 5 = 0? How many real roots?",
          hint: "Discriminant Δ = b² - 4ac. If Δ > 0: two roots, Δ = 0: one root, Δ < 0: no real roots.",
          solution:
            "Δ = 4 - 4(3)(-5) = 4 + 60 = 64 > 0, so TWO distinct real roots",
        },
      ],
      factoring: [
        {
          prompt: "Factor: x² + 9x + 20",
          hint: "Find two numbers that multiply to 20 and add to 9.",
          solution: "(x + 4)(x + 5)",
        },
        {
          prompt: "Factor: 3x² - 12x",
          hint: "First look for a Greatest Common Factor (GCF).",
          solution: "GCF is 3x, so 3x(x - 4)",
        },
        {
          prompt: "Factor: x² - 16",
          hint: "This is a difference of squares pattern: a² - b² = (a-b)(a+b).",
          solution: "(x - 4)(x + 4)",
        },
      ],
      transformation: [
        {
          prompt:
            "If y = x² is shifted 5 units right and 3 units down, write the new equation.",
          hint: "Right shift: (x - h), Down shift: - k",
          solution: "y = (x - 5)² - 3",
        },
        {
          prompt:
            "Describe the transformation from y = x² to y = -2(x + 1)² + 6.",
          hint: "Check the sign of a, the value inside parentheses, and the constant outside.",
          solution:
            "Reflected over x-axis, stretched by 2, shifted left 1, shifted up 6. Vertex: (-1, 6)",
        },
      ],
      mechanics: [
        {
          prompt:
            "A car accelerates from 0 to 20 m/s in 5 seconds. What is its acceleration?",
          hint: "Use a = (v - u) / t where u is initial velocity, v is final velocity.",
          solution: "a = (20 - 0) / 5 = 4 m/s²",
        },
        {
          prompt:
            "Calculate the force needed to accelerate a 10 kg object at 3 m/s².",
          hint: "Newton's Second Law: F = ma.",
          solution: "F = 10 × 3 = 30 N (Newtons)",
        },
      ],
      cell_biology: [
        {
          prompt: "What is the function of mitochondria in a cell?",
          hint: "Think about what every cell needs to perform its functions.",
          solution:
            "Mitochondria are the 'powerhouse of the cell' — they produce ATP (energy) through cellular respiration.",
        },
      ],
      genetics: [
        {
          prompt:
            "If both parents are heterozygous (Tt) for tallness, what percentage of offspring will be short (tt)?",
          hint: "Draw a Punnett square with Tt × Tt.",
          solution: "25% will be tt (short). The ratio is 1 TT : 2 Tt : 1 tt",
        },
      ],
      python: [
        {
          prompt:
            "Write a Python function to check if a number is even or odd.",
          hint: "Use the modulo operator (%) to check divisibility by 2.",
          solution:
            "def check_even_odd(n):\n    if n % 2 == 0:\n        return 'Even'\n    else:\n        return 'Odd'",
        },
      ],
      electricity: [
        {
          prompt:
            "A circuit has a 12V battery and 4Ω resistance. Calculate the current.",
          hint: "Use Ohm's Law: V = IR, so I = V/R.",
          solution: "I = V/R = 12/4 = 3 Amperes",
        },
      ],
      acid_base: [
        {
          prompt:
            "What happens when hydrochloric acid reacts with sodium hydroxide?",
          hint: "This is a neutralization reaction. Acid + Base → ?",
          solution: "HCl + NaOH → NaCl + H₂O (Salt + Water)",
        },
      ],
    }

    for (const topic of topics) {
      if (practiceBank[topic]) {
        const questions = practiceBank[topic]
        const q = questions[Math.floor(Math.random() * questions.length)]
        return {
          text: `Here's a practice problem to test your understanding, ${name}! 🎯`,
          problem: q,
        }
      }
    }

    // Generic practice
    return {
      text: `I'd love to give you a practice problem, ${name}! 📝 Which topic would you like to practice? Tell me the subject and concept, and I'll create a custom question for you!`,
    }
  }
}

export const aiTutorEngine = new AiTutorEngine()
