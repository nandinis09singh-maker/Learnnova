import { AssessmentQuestion } from "../types"

export const diagnosticQuestions: AssessmentQuestion[] = [
  {
    id: "diag_1",
    conceptId: "algebra_foundations",
    conceptName: "Linear Equations & Arithmetic",
    topic: "Algebra Foundations",
    difficulty: "Foundation",
    difficultyScore: 1,
    prompt: "Which expression is equivalent to simplifying 3(x + 4) − 2x?",
    answers: ["x + 12", "x + 4", "5x + 12", "x + 10"],
    correct: 0,
    explanation:
      "Distribute the 3 to get 3x + 12. Then combine like terms: 3x - 2x + 12 = x + 12.",
    prerequisiteHint:
      "Remember that the distributive property applies multiplication across each term inside parentheses.",
  },
  {
    id: "diag_2",
    conceptId: "linear_graphing",
    conceptName: "Slope & Linear Graphing",
    topic: "Algebra Foundations",
    difficulty: "Developing",
    difficultyScore: 2,
    prompt:
      "What is the y-intercept and slope of the line described by 2y − 6x = 8?",
    answers: [
      "Slope = 3, y-intercept = 4",
      "Slope = 6, y-intercept = 8",
      "Slope = -3, y-intercept = 4",
      "Slope = 2, y-intercept = 6",
    ],
    correct: 0,
    explanation:
      "Rearrange into slope-intercept form (y = mx + b): 2y = 6x + 8 => y = 3x + 4. Slope m = 3, y-intercept b = 4.",
    prerequisiteHint:
      "Isolate y completely to read slope m and y-intercept b directly.",
  },
  {
    id: "diag_3",
    conceptId: "factoring",
    conceptName: "Factoring Polynomials",
    topic: "Intermediate Algebra",
    difficulty: "Proficient",
    difficultyScore: 3,
    prompt: "What are the factors of the quadratic trinomial x² + 5x + 6?",
    answers: [
      "(x + 1)(x + 6)",
      "(x + 2)(x + 3)",
      "(x − 2)(x − 3)",
      "(x + 5)(x + 1)",
    ],
    correct: 1,
    explanation:
      "Find two integers whose product is 6 and sum is 5. 2 × 3 = 6 and 2 + 3 = 5, giving (x + 2)(x + 3).",
    prerequisiteHint:
      "Look for two numbers that multiply to c and add up to b.",
  },
  {
    id: "diag_4",
    conceptId: "graph_transformations",
    conceptName: "Function Graph Transformations",
    topic: "Advanced Functions",
    difficulty: "Advanced",
    difficultyScore: 4,
    prompt:
      "How does the graph of y = (x − 4)² + 3 compare to the parent function y = x²?",
    answers: [
      "Shifted 4 units left and 3 units down",
      "Shifted 4 units right and 3 units up",
      "Shifted 4 units right and 3 units down",
      "Shifted 4 units left and 3 units up",
    ],
    correct: 1,
    explanation:
      "Replacing x with (x - h) shifts the graph right by h (here h = 4). Adding k outside shifts up by k (here k = 3).",
    prerequisiteHint:
      "Inside the parentheses operates counter-intuitively: (x - 4) shifts in the positive x direction (right).",
  },
  {
    id: "diag_5",
    conceptId: "quadratic_functions",
    conceptName: "Quadratic Functions & Parabolas",
    topic: "Quadratics",
    difficulty: "Advanced",
    difficultyScore: 4,
    prompt:
      "What are the coordinates of the vertex of the parabola f(x) = −2(x + 1)² + 8?",
    answers: ["(−1, 8)", "(1, 8)", "(−1, −8)", "(−2, 8)"],
    correct: 0,
    explanation:
      "In vertex form y = a(x - h)² + k, the vertex is (h, k). Since we have (x + 1), h = -1, and k = 8.",
    prerequisiteHint:
      "The term (x + 1) means (x - (-1)), so the x-coordinate of the vertex is -1.",
  },
  {
    id: "diag_6",
    conceptId: "vertex_form",
    conceptName: "Vertex Form & Completing Square",
    topic: "Quadratics",
    difficulty: "Mastery",
    difficultyScore: 5,
    prompt:
      "What constant must be added to x² − 8x to complete the square into a perfect square trinomial?",
    answers: ["16", "64", "8", "−16"],
    correct: 0,
    explanation:
      "To complete the square for x² + bx, take (b / 2)² = (-8 / 2)² = (-4)² = 16. This yields (x - 4)²",
    prerequisiteHint:
      "Divide the linear coefficient by 2 and square the result.",
  },
]

export const adaptiveQuestionPool: AssessmentQuestion[] = [
  // Difficulty 1: Foundation
  {
    id: "q_found_1",
    conceptId: "algebra_foundations",
    conceptName: "Linear Equations & Arithmetic",
    topic: "Algebra Foundations",
    difficulty: "Foundation",
    difficultyScore: 1,
    prompt: "Solve for x: 4x − 8 = 12.",
    answers: ["x = 5", "x = 1", "x = 4", "x = 8"],
    correct: 0,
    explanation:
      "Add 8 to both sides: 4x = 20. Then divide both sides by 4: x = 5.",
    prerequisiteHint:
      "Use inverse operations: addition undoes subtraction, and division undoes multiplication.",
  },
  {
    id: "q_found_2",
    conceptId: "linear_graphing",
    conceptName: "Slope & Linear Graphing",
    topic: "Algebra Foundations",
    difficulty: "Foundation",
    difficultyScore: 1,
    prompt: "What is the slope of a horizontal line?",
    answers: ["0", "1", "Undefined", "Infinity"],
    correct: 0,
    explanation:
      "Horizontal lines have zero vertical change (rise = 0) as run increases, so the slope is 0 / run = 0.",
    prerequisiteHint:
      "Slope = rise / run. When a line is flat, the rise is zero.",
  },

  // Difficulty 2: Developing
  {
    id: "q_dev_1",
    conceptId: "factoring",
    conceptName: "Factoring Polynomials",
    topic: "Intermediate Algebra",
    difficulty: "Developing",
    difficultyScore: 2,
    prompt: "Factor completely: 2x² + 8x.",
    answers: ["2x(x + 4)", "2(x² + 4x)", "x(2x + 8)", "(2x + 4)(x + 2)"],
    correct: 0,
    explanation:
      "Find the greatest common factor (GCF) between 2x² and 8x, which is 2x. Factoring 2x gives 2x(x + 4).",
    prerequisiteHint:
      "Extract both the numerical GCF and variable GCF to fully factor.",
  },
  {
    id: "q_dev_2",
    conceptId: "graph_transformations",
    conceptName: "Function Graph Transformations",
    topic: "Advanced Functions",
    difficulty: "Developing",
    difficultyScore: 2,
    prompt:
      "The function g(x) = x² − 7 is created by modifying f(x) = x². Which shift occurred?",
    answers: [
      "Shifted 7 units down",
      "Shifted 7 units up",
      "Shifted 7 units left",
      "Shifted 7 units right",
    ],
    correct: 0,
    explanation:
      "Subtracting a constant from outside the squared term lowers every y-value by 7, shifting the graph down.",
    prerequisiteHint:
      "Vertical shifts occur outside the function argument: f(x) - c moves down.",
  },

  // Difficulty 3: Proficient
  {
    id: "q_prof_1",
    conceptId: "factoring",
    conceptName: "Factoring Polynomials",
    topic: "Intermediate Algebra",
    difficulty: "Proficient",
    difficultyScore: 3,
    prompt:
      "Which expression is the factored form of the difference of squares x² − 49?",
    answers: ["(x − 7)(x + 7)", "(x − 7)²", "(x + 7)²", "(x − 49)(x + 1)"],
    correct: 0,
    explanation:
      "The difference of two squares follows the pattern a² - b² = (a - b)(a + b). Here a = x and b = 7.",
    prerequisiteHint:
      "Whenever middle term bx is 0 and c is negative square, use conjugate pairs.",
  },
  {
    id: "q_prof_2",
    conceptId: "graph_transformations",
    conceptName: "Function Graph Transformations",
    topic: "Advanced Functions",
    difficulty: "Proficient",
    difficultyScore: 3,
    prompt:
      "If f(x) = x², what is the equation for the graph reflected across the x-axis and shifted left 3 units?",
    answers: ["y = −(x + 3)²", "y = (−x − 3)²", "y = −(x − 3)²", "y = −x² + 3"],
    correct: 0,
    explanation:
      "Reflecting over the x-axis places a negative in front: -f(...). Shifting left 3 replaces x with (x + 3), yielding y = -(x + 3)²",
    prerequisiteHint:
      "Remember: left shifts require (x + h), and x-axis reflection requires a negative multiplier in front.",
  },
  {
    id: "q_prof_3",
    conceptId: "quadratic_functions",
    conceptName: "Quadratic Functions & Parabolas",
    topic: "Quadratics",
    difficulty: "Proficient",
    difficultyScore: 3,
    prompt:
      "For the quadratic function f(x) = x² − 6x + 8, what are the roots (x-intercepts)?",
    answers: [
      "x = 2 and x = 4",
      "x = −2 and x = −4",
      "x = 1 and x = 8",
      "x = −1 and x = −8",
    ],
    correct: 0,
    explanation:
      "Factor the equation: x² - 6x + 8 = (x - 2)(x - 4) = 0. By the zero product property, x = 2 or x = 4.",
    prerequisiteHint: "Set f(x) = 0 and factor to find roots.",
  },

  // Difficulty 4: Advanced
  {
    id: "q_adv_1",
    conceptId: "quadratic_functions",
    conceptName: "Quadratic Functions & Parabolas",
    topic: "Quadratics",
    difficulty: "Advanced",
    difficultyScore: 4,
    prompt:
      "A projectile follows the height curve h(t) = −5t² + 20t + 25. At what time t does it reach maximum height?",
    answers: [
      "t = 2 seconds",
      "t = 4 seconds",
      "t = 5 seconds",
      "t = 2.5 seconds",
    ],
    correct: 0,
    explanation:
      "The maximum of a parabola opening downward occurs at the vertex t = -b / (2a). Here t = -20 / (2 × -5) = -20 / -10 = 2 seconds.",
    prerequisiteHint: "The axis of symmetry formula is t = -b / (2a).",
  },
  {
    id: "q_adv_2",
    conceptId: "vertex_form",
    conceptName: "Vertex Form & Completing Square",
    topic: "Quadratics",
    difficulty: "Advanced",
    difficultyScore: 4,
    prompt:
      "Convert y = x² + 6x + 2 into vertex form by completing the square.",
    answers: [
      "y = (x + 3)² − 7",
      "y = (x + 3)² + 2",
      "y = (x − 3)² − 7",
      "y = (x + 6)² − 34",
    ],
    correct: 0,
    explanation:
      "Group the x terms: (x² + 6x + 9) - 9 + 2 = (x + 3)² - 7. The vertex is (-3, -7).",
    prerequisiteHint: "Add and subtract (b/2)² to balance the equation.",
  },

  // Difficulty 5: Mastery
  {
    id: "q_mas_1",
    conceptId: "vertex_form",
    conceptName: "Vertex Form & Completing Square",
    topic: "Quadratics",
    difficulty: "Mastery",
    difficultyScore: 5,
    prompt:
      "Which equation represents a parabola with vertex at (4, −3), passing through (2, 5)?",
    answers: [
      "y = 2(x − 4)² − 3",
      "y = (x − 4)² − 3",
      "y = −2(x − 4)² − 3",
      "y = 2(x + 4)² − 3",
    ],
    correct: 0,
    explanation:
      "Start with vertex form: y = a(x - 4)² - 3. Substitute (2, 5): 5 = a(2 - 4)² - 3 => 5 = a(-2)² - 3 => 8 = 4a => a = 2. Thus y = 2(x - 4)² - 3.",
    prerequisiteHint:
      "Substitute the vertex (h, k) first, then plug in the known point to solve for stretch factor a.",
  },
  {
    id: "q_mas_2",
    conceptId: "systems_equations",
    conceptName: "Systems of Non-Linear Equations",
    topic: "Systems & Modeling",
    difficulty: "Mastery",
    difficultyScore: 5,
    prompt:
      "Find the number of real intersection points between the line y = 2x − 5 and the parabola y = x² − 4x + 4.",
    answers: [
      "1 intersection point (tangent)",
      "2 distinct intersection points",
      "0 intersection points",
      "Infinitely many",
    ],
    correct: 0,
    explanation:
      "Equate: x² - 4x + 4 = 2x - 5 => x² - 6x + 9 = 0 => (x - 3)² = 0. Discriminant Δ = (-6)² - 4(1)(9) = 36 - 36 = 0, so there is exactly 1 intersection point at x = 3.",
    prerequisiteHint:
      "Set equations equal and calculate the discriminant b² - 4ac. When Δ = 0, the line is tangent with 1 solution.",
  },
]
