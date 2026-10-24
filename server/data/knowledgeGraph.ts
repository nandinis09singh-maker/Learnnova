import { ConceptNode } from "../types"

export const initialKnowledgeGraph: ConceptNode[] = [
  {
    id: "algebra_foundations",
    name: "Linear Equations & Arithmetic",
    topic: "Algebra Foundations",
    description:
      "Simplifying algebraic expressions, linear balance, distributive property and single variable equations.",
    prerequisites: [],
    mastery: 88,
    status: "mastered",
    bloomLevel: "Remember",
    recommendedAction: "Mastered. Ready to support higher concepts.",
    weight: 15,
  },
  {
    id: "linear_graphing",
    name: "Slope & Linear Graphing",
    topic: "Algebra Foundations",
    description:
      "Slope-intercept form (y = mx + b), rate of change, x and y intercepts, and coordinate graphing.",
    prerequisites: ["algebra_foundations"],
    mastery: 82,
    status: "mastered",
    bloomLevel: "Understand",
    recommendedAction: "Solid base. Continue to function models.",
    weight: 15,
  },
  {
    id: "factoring",
    name: "Factoring Polynomials",
    topic: "Intermediate Algebra",
    description:
      "Greatest common factor (GCF), factoring trinomials x² + bx + c, difference of squares, and zero product property.",
    prerequisites: ["algebra_foundations"],
    mastery: 64,
    status: "developing",
    bloomLevel: "Apply",
    recommendedAction:
      "Needs practice with trinomial sign combinations before quadratic roots.",
    weight: 20,
  },
  {
    id: "graph_transformations",
    name: "Function Graph Transformations",
    topic: "Advanced Functions",
    description:
      "Horizontal shifts f(x - h), vertical shifts f(x) + k, vertical reflections -f(x), and dilation stretches.",
    prerequisites: ["linear_graphing"],
    mastery: 36,
    status: "gap",
    bloomLevel: "Analyze",
    recommendedAction:
      "Critical knowledge gap. Blocks vertex form understanding and parabolic modelling.",
    weight: 20,
  },
  {
    id: "quadratic_functions",
    name: "Quadratic Functions & Parabolas",
    topic: "Quadratics",
    description:
      "Standard form y = ax² + bx + c, axis of symmetry, vertex coordinates, direction of opening, and roots.",
    prerequisites: ["factoring", "graph_transformations"],
    mastery: 52,
    status: "in_progress",
    bloomLevel: "Apply",
    recommendedAction: "Current focus. Blocked on transformation rules.",
    weight: 20,
  },
  {
    id: "vertex_form",
    name: "Vertex Form & Completing Square",
    topic: "Quadratics",
    description:
      "Writing quadratics in y = a(x - h)² + k, completing the square algorithm, and identifying extrema.",
    prerequisites: ["quadratic_functions", "graph_transformations"],
    mastery: 28,
    status: "gap",
    bloomLevel: "Evaluate",
    recommendedAction:
      "Prerequisite gap detected. Complete graph transformations first.",
    weight: 25,
  },
  {
    id: "systems_equations",
    name: "Systems of Non-Linear Equations",
    topic: "Systems & Modeling",
    description:
      "Solving intersection of linear and quadratic systems algebraically and graphically.",
    prerequisites: ["quadratic_functions", "linear_graphing"],
    mastery: 15,
    status: "locked",
    bloomLevel: "Analyze",
    recommendedAction: "Locked until quadratic mastery reaches >= 75%.",
    weight: 20,
  },
  {
    id: "exponential_functions",
    name: "Exponential Growth & Decay",
    topic: "Advanced Functions",
    description:
      "Equations in form y = a(b)^x, growth factors, half-life models, and logarithmic foundations.",
    prerequisites: ["algebra_foundations", "graph_transformations"],
    mastery: 10,
    status: "locked",
    bloomLevel: "Apply",
    recommendedAction: "Locked. Requires function transformation mastery.",
    weight: 20,
  },
]
