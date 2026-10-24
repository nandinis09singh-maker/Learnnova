/**
 * Intelligent Step-by-Step Math & Science Problem Solver
 * Supports Linear Equations, Quadratics, Factoring, Vertex Form, Arithmetic, and Geometry.
 */

export interface SolutionResult {
  title: string
  category: string
  problem: string
  steps: {
    stepNumber: number
    title: string
    explanation: string
    math?: string
  }[]
  finalAnswer: string
  verification?: string
  tip?: string
}

export class MathProblemSolver {
  /**
   * Main entrypoint to detect and solve problems from user prompt
   */
  public static trySolve(text: string): SolutionResult | null {
    const cleaned = text.trim()

    // If it contains '=', prioritize equation solvers
    if (cleaned.includes("=")) {
      // 1. Try Quadratic Equation
      const quadraticResult = this.solveQuadratic(cleaned)
      if (quadraticResult) return quadraticResult

      // 2. Try Linear Equation
      const linearResult = this.solveLinear(cleaned)
      if (linearResult) return linearResult
    }

    // 3. Try Vertex Form & Transformations
    const vertexResult = this.solveVertex(cleaned)
    if (vertexResult) return vertexResult

    // 4. Try Factoring
    const factorResult = this.solveFactoring(cleaned)
    if (factorResult) return factorResult

    // 5. Try Linear Equation (even without '=')
    const linearResult = this.solveLinear(cleaned)
    if (linearResult) return linearResult

    // 6. Try Slope between points
    const slopeResult = this.solveSlope(cleaned)
    if (slopeResult) return slopeResult

    // 7. Try Geometry (Area, Perimeter, Pythagoras)
    const geomResult = this.solveGeometry(cleaned)
    if (geomResult) return geomResult

    // 8. Try Arithmetic / Expression evaluation
    const arithmeticResult = this.solveArithmetic(cleaned)
    if (arithmeticResult) return arithmeticResult

    return null
  }

  /**
   * Solve Factoring: e.g. "factor x^2 + 7x + 12", "x² - 5x + 6", "x^2 - 49"
   */
  public static solveFactoring(text: string): SolutionResult | null {
    const isFactorRequest = /factor|factoring|factorise|factorize/i.test(text)
    const normalized = text
      .replace(
        /factor|factoring|factorise|factorize|the|expression|polynomial/gi,
        "",
      )
      .trim()

    // 1. Try monic trinomial first: x^2 + bx + c or x² + bx + c
    const trinomialMatch = normalized.match(
      /([a-zA-Z])(?:\^2|²)\s*([+-])\s*(\d*)\s*\1\s*([+-])\s*(\d+)/i,
    )
    if (trinomialMatch && (isFactorRequest || !normalized.includes("="))) {
      const variable = trinomialMatch[1]
      const bSign = trinomialMatch[2] === "-" ? -1 : 1
      const bRaw = trinomialMatch[3] ? parseInt(trinomialMatch[3]) : 1
      const b = bSign * bRaw
      const cSign = trinomialMatch[4] === "-" ? -1 : 1
      const c = cSign * parseInt(trinomialMatch[5])

      // Find p, q such that p * q = c and p + q = b
      let foundP: number | null = null
      let foundQ: number | null = null
      const limit = Math.abs(c)
      for (let p = -limit; p <= limit; p++) {
        if (p !== 0 && c % p === 0) {
          const q = c / p
          if (p + q === b) {
            foundP = p
            foundQ = q
            break
          }
        }
      }

      if (foundP !== null && foundQ !== null) {
        const pStr = foundP >= 0 ? `+ ${foundP}` : `− ${Math.abs(foundP)}`
        const qStr = foundQ >= 0 ? `+ ${foundQ}` : `− ${Math.abs(foundQ)}`
        const factored = `(${variable} ${pStr})(${variable} ${qStr})`

        return {
          title: "Factoring: Quadratic Trinomial",
          category: "Factoring",
          problem: `Factor ${variable}² ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          }${variable} ${c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`}`,
          steps: [
            {
              stepNumber: 1,
              title: "Analyze Coefficients",
              explanation: `For the trinomial ${variable}² + bx + c, identify: b = ${b}, c = ${c}`,
              math: `Sum (b) = ${b}, Product (c) = ${c}`,
            },
            {
              stepNumber: 2,
              title: "Find the Two Factor Numbers",
              explanation: `Find two numbers (p and q) that multiply to ${c} and add up to ${b}:`,
              math: `${foundP} × ${foundQ} = ${c}  and  ${foundP} + (${foundQ}) = ${b}`,
            },
            {
              stepNumber: 3,
              title: "Write in Factored Form",
              explanation: `Substitute p = ${foundP} and q = ${foundQ} into (${variable} + p)(${variable} + q):`,
              math: factored,
            },
            {
              stepNumber: 4,
              title: "Verification by FOIL",
              explanation: `Multiply out: (${variable} ${pStr})(${variable} ${qStr}) = ${variable}² ${qStr}${variable} ${pStr}${variable} + (${foundP}×${foundQ}) = ${variable}² ${
                b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
              }${variable} ${
                c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`
              }. Matches original!`,
            },
          ],
          finalAnswer: factored,
          tip: "If c is positive, both factors have the same sign as b. If c is negative, factors have opposite signs.",
        }
      }
    }

    // Match x^2 - a^2 (Difference of squares)
    const diffSquaresMatch = normalized.match(
      /([a-zA-Z])(?:\^2|²)\s*-\s*(\d+)/i,
    )
    if (diffSquaresMatch) {
      const variable = diffSquaresMatch[1]
      const constVal = parseInt(diffSquaresMatch[2])
      const root = Math.sqrt(constVal)
      if (Number.isInteger(root)) {
        return {
          title: "Factoring: Difference of Two Squares",
          category: "Factoring",
          problem: `Factor ${variable}² − ${constVal}`,
          steps: [
            {
              stepNumber: 1,
              title: "Identify the Pattern",
              explanation:
                "This expression matches the Difference of Squares formula: a² − b² = (a − b)(a + b)",
              math: `${variable}² − ${constVal} = (${variable})² − (${root})²`,
            },
            {
              stepNumber: 2,
              title: "Apply the Difference of Squares Rule",
              explanation: `Here, a = ${variable} and b = ${root}. Set up the conjugate binomials:`,
              math: `(${variable} − ${root})(${variable} + ${root})`,
            },
            {
              stepNumber: 3,
              title: "Verify by FOIL Expansion",
              explanation: `Multiply out: (${variable} − ${root})(${variable} + ${root}) = ${variable}² + ${root}${variable} − ${root}${variable} − ${constVal} = ${variable}² − ${constVal}. Verified!`,
            },
          ],
          finalAnswer: `(${variable} − ${root})(${variable} + ${root})`,
          tip: "Whenever an expression has two terms with a minus sign and both are perfect squares, always use (a - b)(a + b).",
        }
      }
    }

    // Match GCF: e.g. 3x^2 + 12x or 2x² - 8x
    const gcfMatch = normalized.match(
      /(\d*)\s*([a-zA-Z])(?:\^2|²)\s*([+-])\s*(\d+)\s*\2/i,
    )
    if (gcfMatch) {
      const aVal = gcfMatch[1] ? parseInt(gcfMatch[1]) : 1
      const variable = gcfMatch[2]
      const sign = gcfMatch[3]
      const bVal = parseInt(gcfMatch[4])
      const gcd = (x: number, y: number): number => (!y ? x : gcd(y, x % y))
      const commonCoeff = gcd(aVal, bVal)
      const remA = aVal / commonCoeff
      const remB = bVal / commonCoeff
      const inner = `${remA === 1 ? "" : remA}${variable} ${sign} ${remB}`
      const factored = `${
        commonCoeff === 1 ? "" : commonCoeff
      }${variable}(${inner})`

      return {
        title: "Factoring: Greatest Common Factor (GCF)",
        category: "Factoring",
        problem: `Factor ${
          aVal === 1 ? "" : aVal
        }${variable}² ${sign} ${bVal}${variable}`,
        steps: [
          {
            stepNumber: 1,
            title: "Identify Common Factors",
            explanation: `Find the greatest common numerical factor between ${aVal} and ${bVal} (GCF = ${commonCoeff}) and variable factor ${variable}.`,
            math: `GCF = ${commonCoeff === 1 ? "" : commonCoeff}${variable}`,
          },
          {
            stepNumber: 2,
            title: "Factor out the GCF",
            explanation: `Divide each term by ${
              commonCoeff === 1 ? "" : commonCoeff
            }${variable} to determine the remaining factor:`,
            math: `${
              commonCoeff === 1 ? "" : commonCoeff
            }${variable} · (${inner})`,
          },
        ],
        finalAnswer: factored,
        tip: "Always check for a Greatest Common Factor (GCF) before attempting trinomial factoring.",
      }
    }

    return null
  }

  /**
   * 2. Solve Quadratic Equation: e.g. "x^2 + 5x + 6 = 0", "2x^2 + 5x - 3 = 0", "x^2 - 16 = 0"
   */
  public static solveQuadratic(text: string): SolutionResult | null {
    // Check if contains quadratic term and equals sign
    if (!/(?:\^2|²)/i.test(text) || !text.includes("=")) return null

    const normalized = text.replace(/solve|for x|equation/gi, "").trim()

    // Match ax^2 + bx + c = 0
    const match = normalized.match(
      /([+-]?\s*\d*)\s*([a-zA-Z])(?:\^2|²)\s*([+-]\s*\d*)\s*\2\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/i,
    )
    if (match) {
      const aStr = match[1].replace(/\s+/g, "")
      const a =
        aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseInt(aStr)
      const variable = match[2]
      const bStr = match[3].replace(/\s+/g, "")
      const b =
        bStr === "" || bStr === "+" ? 1 : bStr === "-" ? -1 : parseInt(bStr)
      const cStr = match[4].replace(/\s+/g, "")
      const cLeft = parseInt(cStr)
      const dRight = parseInt(match[5].replace(/\s+/g, ""))
      const c = cLeft - dRight

      const discriminant = b * b - 4 * a * c

      const steps: SolutionResult["steps"] = [
        {
          stepNumber: 1,
          title: "Standard Form & Identify Coefficients",
          explanation: `Write the quadratic in standard form ax² + bx + c = 0:`,
          math: `${a !== 1 ? a : ""}${variable}² ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          }${variable} ${
            c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`
          } = 0  →  a = ${a}, b = ${b}, c = ${c}`,
        },
        {
          stepNumber: 2,
          title: "Compute the Discriminant (Δ)",
          explanation: `The discriminant determines the nature and number of solutions: Δ = b² − 4ac`,
          math: `Δ = (${b})² − 4(${a})(${c}) = ${b * b} − (${4 * a * c}) = ${discriminant}`,
        },
      ]

      if (discriminant > 0) {
        const sqrtD = Math.sqrt(discriminant)
        const isPerfectSquare = Number.isInteger(sqrtD)
        const root1 = (-b + sqrtD) / (2 * a)
        const root2 = (-b - sqrtD) / (2 * a)

        steps.push({
          stepNumber: 3,
          title: "Apply the Quadratic Formula",
          explanation: `Since Δ = ${discriminant} > 0, there are two distinct real solutions:`,
          math: `${variable} = [−b ± √Δ] / 2a = [−(${b}) ± √${discriminant}] / 2(${a})`,
        })

        steps.push({
          stepNumber: 4,
          title: "Calculate Both Roots",
          explanation: isPerfectSquare
            ? `Since √${discriminant} = ${sqrtD}:`
            : `Evaluating to 2 decimal places:`,
          math: `${variable}₁ = (${-b} + ${
            isPerfectSquare ? sqrtD : sqrtD.toFixed(2)
          }) / ${2 * a} = ${
            Number.isInteger(root1) ? root1 : root1.toFixed(2)
          }\n${variable}₂ = (${-b} − ${
            isPerfectSquare ? sqrtD : sqrtD.toFixed(2)
          }) / ${2 * a} = ${
            Number.isInteger(root2) ? root2 : root2.toFixed(2)
          }`,
        })

        const ans1 = Number.isInteger(root1) ? `${root1}` : root1.toFixed(2)
        const ans2 = Number.isInteger(root2) ? `${root2}` : root2.toFixed(2)

        return {
          title: "Solving Quadratic Equation: Two Real Roots",
          category: "Quadratic Equation",
          problem: `${a !== 1 ? a : ""}${variable}² ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          }${variable} ${c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`} = 0`,
          steps,
          finalAnswer: `${variable} = ${ans1}  or  ${variable} = ${ans2}`,
          verification: `Check: For ${variable} = ${ans1}, ${a}(${ans1})² + (${b})(${ans1}) + (${c}) ≈ 0. Verified!`,
          tip: "When Δ > 0 is a perfect square, factoring is often faster than the quadratic formula.",
        }
      } else if (discriminant === 0) {
        const root = -b / (2 * a)
        steps.push({
          stepNumber: 3,
          title: "Calculate the Single Double Root",
          explanation: `Since Δ = 0, the parabola touches the x-axis at exactly one point (tangent):`,
          math: `${variable} = −b / 2a = −(${b}) / 2(${a}) = ${root}`,
        })

        return {
          title: "Solving Quadratic Equation: One Real Double Root",
          category: "Quadratic Equation",
          problem: `${a !== 1 ? a : ""}${variable}² ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          }${variable} ${c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`} = 0`,
          steps,
          finalAnswer: `${variable} = ${root}`,
          tip: "A discriminant of zero means the quadratic is a perfect square trinomial.",
        }
      } else {
        steps.push({
          stepNumber: 3,
          title: "Complex Conjugate Roots",
          explanation: `Since Δ = ${discriminant} < 0, there are no real roots. The solutions are complex conjugates:`,
          math: `${variable} = [−(${b}) ± i√${Math.abs(discriminant)}] / ${2 * a}`,
        })

        return {
          title: "Solving Quadratic Equation: Complex Roots",
          category: "Quadratic Equation",
          problem: `${a !== 1 ? a : ""}${variable}² ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          }${variable} ${c >= 0 ? `+ ${c}` : `− ${Math.abs(c)}`} = 0`,
          steps,
          finalAnswer: `No real solutions (${variable} = [${-b} ± i√${Math.abs(discriminant)}] / ${2 * a})`,
          tip: "Graphically, Δ < 0 means the parabola sits entirely above or below the x-axis without intersecting it.",
        }
      }
    }

    // Match x^2 = c or x² - c = 0
    const simpleQuadMatch = normalized.match(/([a-zA-Z])(?:\^2|²)\s*=\s*(\d+)/i)
    if (simpleQuadMatch) {
      const variable = simpleQuadMatch[1]
      const val = parseInt(simpleQuadMatch[2])
      const root = Math.sqrt(val)
      const isInteger = Number.isInteger(root)

      return {
        title: "Solving Pure Quadratic Equation",
        category: "Quadratic Equation",
        problem: `${variable}² = ${val}`,
        steps: [
          {
            stepNumber: 1,
            title: "Take the Square Root of Both Sides",
            explanation: `Apply the square root property. Remember to include both positive and negative roots (±):`,
            math: `${variable} = ±√${val}`,
          },
          {
            stepNumber: 2,
            title: "Simplify the Radical",
            explanation: isInteger
              ? `Since ${val} is a perfect square (${root}² = ${val}):`
              : `Evaluating to 2 decimal places:`,
            math: `${variable} = +${
              isInteger ? root : root.toFixed(2)
            }  or  ${variable} = −${isInteger ? root : root.toFixed(2)}`,
          },
        ],
        finalAnswer: `${variable} = ±${isInteger ? root : root.toFixed(2)}`,
        tip: "Always remember the ± sign when taking square roots on both sides of an equation.",
      }
    }

    return null
  }

  /**
   * 3. Solve Vertex Form & Function Transformations:
   * e.g. "vertex of y = 2(x - 3)^2 + 4", "transformations of y = -(x+1)² - 5"
   */
  public static solveVertex(text: string): SolutionResult | null {
    if (!/vertex|transformation|parabola/i.test(text)) return null

    // Match y = a(x - h)^2 + k or y = a(x + h)² - k
    const vertexFormMatch = text.match(
      /([+-]?\s*\d*)\s*\(\s*([a-zA-Z])\s*([+-])\s*(\d+)\s*\)(?:\^2|²)\s*([+-]\s*\d+)?/i,
    )
    if (vertexFormMatch) {
      const aStr = vertexFormMatch[1].replace(/\s+/g, "")
      const a =
        aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseInt(aStr)
      const variable = vertexFormMatch[2]
      const hSign = vertexFormMatch[3]
      const hVal = parseInt(vertexFormMatch[4])
      // Inside (x - h): if (x - 3), h = 3; if (x + 3), h = -3
      const h = hSign === "-" ? hVal : -hVal
      const kStr = vertexFormMatch[5]
        ? vertexFormMatch[5].replace(/\s+/g, "")
        : "0"
      const k = parseInt(kStr)

      const opens =
        a > 0 ? "upward (minimum point)" : "downward (maximum point)"
      const stretchDesc =
        Math.abs(a) > 1
          ? `Vertically stretched by a factor of ${Math.abs(a)} (narrower)`
          : Math.abs(a) < 1
            ? `Vertically compressed by a factor of ${Math.abs(a)} (wider)`
            : "Standard width (no vertical stretch)"
      const horizontalShiftDesc =
        h > 0
          ? `Shifted ${h} units to the RIGHT`
          : h < 0
            ? `Shifted ${Math.abs(h)} units to the LEFT`
            : "No horizontal shift"
      const verticalShiftDesc =
        k > 0
          ? `Shifted ${k} units UP`
          : k < 0
            ? `Shifted ${Math.abs(k)} units DOWN`
            : "No vertical shift"

      return {
        title: "Vertex Form & Parabola Transformations",
        category: "Functions & Quadratics",
        problem: `Find vertex and transformations of: y = ${
          a !== 1 ? (a === -1 ? "−" : a) : ""
        }(${variable} ${hSign} ${hVal})² ${
          k >= 0 ? `+ ${k}` : `− ${Math.abs(k)}`
        }`,
        steps: [
          {
            stepNumber: 1,
            title: "Compare with Vertex Form Template",
            explanation: `The vertex form of a parabola is y = a(${variable} − h)² + k, where the vertex is located at (h, k).`,
            math: `a = ${a},  h = ${h},  k = ${k}`,
          },
          {
            stepNumber: 2,
            title: "Determine the Vertex Coordinates",
            explanation: `Reading (h, k) directly from the equation:`,
            math: `Vertex = (${h}, ${k})`,
          },
          {
            stepNumber: 3,
            title: "Determine Axis of Symmetry & Direction",
            explanation: `The axis of symmetry is the vertical line passing through the vertex x = h:`,
            math: `Axis of Symmetry: ${variable} = ${h}\nDirection: Opens ${opens}`,
          },
          {
            stepNumber: 4,
            title: "Full Transformation Breakdown from y = x²",
            explanation: `List all changes applied to the parent function y = x²:
• ${horizontalShiftDesc}
• ${verticalShiftDesc}
• ${
              a < 0
                ? "Reflected across the x-axis (inverted upside-down)"
                : "No reflection"
            }
• ${stretchDesc}`,
          },
        ],
        finalAnswer: `Vertex: (${h}, ${k}) | Axis of Symmetry: ${variable} = ${h} | Opens: ${
          a > 0 ? "Upward (Min)" : "Downward (Max)"
        }`,
        tip: "Remember that the horizontal shift is opposite to the sign inside parentheses: (x - 3) means h = +3 (moves right).",
      }
    }

    return null
  }

  /**
   * 4. Solve Linear Equation:
   * e.g. "2x + 5 = 15", "4x - 8 = 12", "5x + 3 = 2x + 18", "3(x - 4) = 18"
   */
  public static solveLinear(text: string): SolutionResult | null {
    if (!text.includes("=")) return null

    const normalized = text
      .replace(/solve|for\s+[a-zA-Z]|equation|find\s+[a-zA-Z]/gi, "")
      .trim()

    // Pattern A: Parentheses: a(x + b) = c or a(x - b) = c
    const parenMatch = normalized.match(
      /([+-]?\s*\d+)\s*\(\s*([a-zA-Z])\s*([+-])\s*(\d+)\s*\)\s*=\s*([+-]?\s*\d+)/i,
    )
    if (parenMatch) {
      const a = parseInt(parenMatch[1].replace(/\s+/g, ""))
      const variable = parenMatch[2]
      const sign = parenMatch[3]
      const b = parseInt(parenMatch[4]) * (sign === "-" ? -1 : 1)
      const c = parseInt(parenMatch[5].replace(/\s+/g, ""))

      // a(x + b) = c => ax + a*b = c => ax = c - a*b => x = (c - a*b) / a
      const ab = a * b
      const cMinusAb = c - ab
      const x = cMinusAb / a

      return {
        title: "Solving Linear Equation with Parentheses",
        category: "Linear Equations",
        problem: `${a}(${variable} ${sign} ${Math.abs(b)}) = ${c}`,
        steps: [
          {
            stepNumber: 1,
            title: "Distribute the Coefficient",
            explanation: `Distribute ${a} across the terms inside the parentheses: ${a} × ${variable} and ${a} × (${b})`,
            math: `${a}${variable} ${
              ab >= 0 ? `+ ${ab}` : `− ${Math.abs(ab)}`
            } = ${c}`,
          },
          {
            stepNumber: 2,
            title: "Isolate the Variable Term",
            explanation: `${
              ab >= 0 ? `Subtract ${ab}` : `Add ${Math.abs(ab)}`
            } on both sides:`,
            math: `${a}${variable} = ${c} ${
              ab >= 0 ? `− ${ab}` : `+ ${Math.abs(ab)}`
            }  →  ${a}${variable} = ${cMinusAb}`,
          },
          {
            stepNumber: 3,
            title: "Solve for the Variable",
            explanation: `Divide both sides by ${a}:`,
            math: `${variable} = ${cMinusAb} / ${a} = ${
              Number.isInteger(x) ? x : x.toFixed(2)
            }`,
          },
          {
            stepNumber: 4,
            title: "Verification",
            explanation: `Substitute ${variable} = ${x} into original equation: ${a}((${x}) ${sign} ${Math.abs(b)}) = ${a}(${x + b}) = ${c}. Left side = Right side!`,
          },
        ],
        finalAnswer: `${variable} = ${Number.isInteger(x) ? x : x.toFixed(2)}`,
        tip: "You can also solve by dividing both sides by the outer coefficient first if it divides evenly!",
      }
    }

    // Pattern B: Variables on both sides: ax + b = cx + d
    const bothSidesMatch = normalized.match(
      /([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d*)\s*\2\s*([+-]\s*\d+)/i,
    )
    if (bothSidesMatch) {
      const aStr = bothSidesMatch[1].replace(/\s+/g, "")
      const a =
        aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseInt(aStr)
      const variable = bothSidesMatch[2]
      const b = parseInt(bothSidesMatch[3].replace(/\s+/g, ""))
      const cStr = bothSidesMatch[4].replace(/\s+/g, "")
      const c =
        cStr === "" || cStr === "+" ? 1 : cStr === "-" ? -1 : parseInt(cStr)
      const d = parseInt(bothSidesMatch[5].replace(/\s+/g, ""))

      if (a !== c) {
        const netA = a - c
        const netD = d - b
        const x = netD / netA

        return {
          title: "Solving Linear Equation: Variables on Both Sides",
          category: "Linear Equations",
          problem: `${a !== 1 ? a : ""}${variable} ${
            b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
          } = ${c !== 1 ? c : ""}${variable} ${
            d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`
          }`,
          steps: [
            {
              stepNumber: 1,
              title: "Collect Variable Terms on Left Side",
              explanation: `Subtract ${c}${variable} from both sides:`,
              math: `(${a} − ${c})${variable} ${
                b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
              } = ${d}  →  ${netA}${variable} ${
                b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
              } = ${d}`,
            },
            {
              stepNumber: 2,
              title: "Collect Constant Terms on Right Side",
              explanation: `${
                b >= 0 ? `Subtract ${b}` : `Add ${Math.abs(b)}`
              } on both sides:`,
              math: `${netA}${variable} = ${d} ${
                b >= 0 ? `− ${b}` : `+ ${Math.abs(b)}`
              }  →  ${netA}${variable} = ${netD}`,
            },
            {
              stepNumber: 3,
              title: "Divide by the Coefficient",
              explanation: `Divide both sides by ${netA}:`,
              math: `${variable} = ${netD} / ${netA} = ${
                Number.isInteger(x) ? x : x.toFixed(2)
              }`,
            },
            {
              stepNumber: 4,
              title: "Check Solution",
              explanation: `LHS: ${a}(${x}) ${
                b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
              } = ${a * x + b}. RHS: ${c}(${x}) ${
                d >= 0 ? `+ ${d}` : `− ${Math.abs(d)}`
              } = ${c * x + d}. Both sides match!`,
            },
          ],
          finalAnswer: `${variable} = ${
            Number.isInteger(x) ? x : x.toFixed(2)
          }`,
          tip: "Keep variable terms on whichever side gives a positive coefficient to minimize sign errors.",
        }
      }
    }

    // Pattern C: Standard two-step: ax + b = c or ax - b = c
    const twoStepMatch = normalized.match(
      /([+-]?\s*\d*)\s*([a-zA-Z])\s*([+-]\s*\d+)\s*=\s*([+-]?\s*\d+)/i,
    )
    if (twoStepMatch) {
      const aStr = twoStepMatch[1].replace(/\s+/g, "")
      const a =
        aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseInt(aStr)
      const variable = twoStepMatch[2]
      const b = parseInt(twoStepMatch[3].replace(/\s+/g, ""))
      const c = parseInt(twoStepMatch[4].replace(/\s+/g, ""))

      const cMinusB = c - b
      const x = cMinusB / a

      return {
        title: "Solving Two-Step Linear Equation",
        category: "Linear Equations",
        problem: `${a !== 1 ? (a === -1 ? "−" : a) : ""}${variable} ${
          b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
        } = ${c}`,
        steps: [
          {
            stepNumber: 1,
            title: "Isolate the Variable Term",
            explanation: `${
              b >= 0 ? `Subtract ${b}` : `Add ${Math.abs(b)}`
            } from both sides to undo the constant:`,
            math: `${a !== 1 ? a : ""}${variable} = ${c} ${
              b >= 0 ? `− ${b}` : `+ ${Math.abs(b)}`
            }  →  ${a !== 1 ? a : ""}${variable} = ${cMinusB}`,
          },
          {
            stepNumber: 2,
            title: "Divide by the Coefficient",
            explanation: `Divide both sides by ${a} to isolate ${variable}:`,
            math: `${variable} = ${cMinusB} / ${a} = ${
              Number.isInteger(x) ? x : x.toFixed(2)
            }`,
          },
          {
            stepNumber: 3,
            title: "Verification",
            explanation: `Substitute ${variable} = ${x} back into original equation:\n${a}(${x}) ${
              b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
            } = ${a * x} ${
              b >= 0 ? `+ ${b}` : `− ${Math.abs(b)}`
            } = ${c}. Confirmed!`,
          },
        ],
        finalAnswer: `${variable} = ${Number.isInteger(x) ? x : x.toFixed(2)}`,
        tip: "Use inverse operations: addition undoes subtraction, and division undoes multiplication.",
      }
    }

    // Pattern D: One-step: ax = c
    const oneStepMatch = normalized.match(
      /([+-]?\s*\d+)\s*([a-zA-Z])\s*=\s*([+-]?\s*\d+)/i,
    )
    if (oneStepMatch) {
      const a = parseInt(oneStepMatch[1].replace(/\s+/g, ""))
      const variable = oneStepMatch[2]
      const c = parseInt(oneStepMatch[3].replace(/\s+/g, ""))
      const x = c / a

      return {
        title: "Solving One-Step Linear Equation",
        category: "Linear Equations",
        problem: `${a}${variable} = ${c}`,
        steps: [
          {
            stepNumber: 1,
            title: "Divide by the Coefficient",
            explanation: `Divide both sides by ${a}:`,
            math: `${variable} = ${c} / ${a} = ${
              Number.isInteger(x) ? x : x.toFixed(2)
            }`,
          },
          {
            stepNumber: 2,
            title: "Verification",
            explanation: `${a} × (${x}) = ${a * x} = ${c}. Correct!`,
          },
        ],
        finalAnswer: `${variable} = ${Number.isInteger(x) ? x : x.toFixed(2)}`,
      }
    }

    return null
  }

  /**
   * 5. Solve Slope between two points: e.g. "slope between (1, 2) and (4, 8)"
   */
  public static solveSlope(text: string): SolutionResult | null {
    const match = text.match(
      /\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?\s*(?:and|to)\s*\(?\s*(-?\d+)\s*,\s*(-?\d+)\s*\)?/i,
    )
    if (match && /slope|gradient|rate of change/i.test(text)) {
      const x1 = parseInt(match[1])
      const y1 = parseInt(match[2])
      const x2 = parseInt(match[3])
      const y2 = parseInt(match[4])

      const deltaY = y2 - y1
      const deltaX = x2 - x1

      if (deltaX === 0) {
        return {
          title: "Slope Calculation: Vertical Line",
          category: "Coordinate Geometry",
          problem: `Find slope between (${x1}, ${y1}) and (${x2}, ${y2})`,
          steps: [
            {
              stepNumber: 1,
              title: "Apply the Slope Formula",
              explanation: "m = (y₂ − y₁) / (x₂ − x₁)",
              math: `m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${deltaY} / 0`,
            },
            {
              stepNumber: 2,
              title: "Analyze Zero Denominator",
              explanation:
                "Division by zero is undefined. The line is vertical.",
            },
          ],
          finalAnswer: "m is Undefined (Vertical Line x = " + x1 + ")",
        }
      }

      const m = deltaY / deltaX

      return {
        title: "Slope Between Two Points",
        category: "Coordinate Geometry",
        problem: `Find slope between (${x1}, ${y1}) and (${x2}, ${y2})`,
        steps: [
          {
            stepNumber: 1,
            title: "Apply the Slope Formula",
            explanation: "m = (y₂ − y₁) / (x₂ − x₁)",
            math: `m = (${y2} − ${y1}) / (${x2} − ${x1}) = ${deltaY} / ${deltaX}`,
          },
          {
            stepNumber: 2,
            title: "Simplify the Ratio",
            explanation: `Divide the change in y (rise) by change in x (run):`,
            math: `m = ${
              Number.isInteger(m) ? m : `${deltaY}/${deltaX} ≈ ${m.toFixed(2)}`
            }`,
          },
        ],
        finalAnswer: `Slope m = ${
          Number.isInteger(m) ? m : `${deltaY}/${deltaX} (≈ ${m.toFixed(2)})`
        }`,
        tip: "Positive slope means the line rises from left to right; negative slope falls from left to right.",
      }
    }
    return null
  }

  /**
   * 6. Solve Geometry: Area of circle, triangle, Pythagorean theorem
   */
  public static solveGeometry(text: string): SolutionResult | null {
    // Circle Area: "area of circle radius 7"
    const circleMatch =
      text.match(/circle.*(?:radius|r)\s*(?:is|=|of)?\s*(\d+)/i) ||
      text.match(/(?:radius|r)\s*(?:is|=|of)?\s*(\d+).*circle/i)
    if (circleMatch && /area/i.test(text)) {
      const r = parseInt(circleMatch[1])
      const area = Math.PI * r * r
      return {
        title: "Area of a Circle",
        category: "Geometry",
        problem: `Find the area of a circle with radius r = ${r}`,
        steps: [
          {
            stepNumber: 1,
            title: "Formula Selection",
            explanation: "The area of a circle is given by A = πr²",
            math: `A = π · (${r})²`,
          },
          {
            stepNumber: 2,
            title: "Calculate Square of Radius",
            explanation: `${r}² = ${r * r}`,
            math: `A = ${r * r}π`,
          },
          {
            stepNumber: 3,
            title: "Decimal Approximation",
            explanation: `Using π ≈ 3.14159:`,
            math: `A ≈ ${area.toFixed(2)} sq units`,
          },
        ],
        finalAnswer: `Area = ${r * r}π ≈ ${area.toFixed(2)} square units`,
      }
    }

    // Triangle Area: "area of triangle base 8 height 6"
    const triMatch = text.match(
      /triangle.*(?:base|b)\s*(?:is|=|of)?\s*(\d+).*(?:height|h)\s*(?:is|=|of)?\s*(\d+)/i,
    )
    if (triMatch && /area/i.test(text)) {
      const b = parseInt(triMatch[1])
      const h = parseInt(triMatch[2])
      const area = 0.5 * b * h
      return {
        title: "Area of a Triangle",
        category: "Geometry",
        problem: `Find the area of a triangle with base = ${b} and height = ${h}`,
        steps: [
          {
            stepNumber: 1,
            title: "Apply Triangle Area Formula",
            explanation: "Area = ½ × base × height",
            math: `A = ½ · ${b} · ${h}`,
          },
          {
            stepNumber: 2,
            title: "Perform Multiplication",
            explanation: `½ · ${b * h} = ${area}`,
            math: `A = ${area}`,
          },
        ],
        finalAnswer: `Area = ${area} square units`,
      }
    }

    // Pythagorean theorem: "hypotenuse legs 3 and 4" or "pythagoras a=3 b=4"
    const pythMatch = text.match(
      /(?:pythagor|hypotenuse|right triangle).*(?:sides?|legs?|a\s*=)?\s*(\d+)\s*(?:and|,)\s*(?:b\s*=)?\s*(\d+)/i,
    )
    if (pythMatch) {
      const a = parseInt(pythMatch[1])
      const b = parseInt(pythMatch[2])
      const cSq = a * a + b * b
      const c = Math.sqrt(cSq)
      const isInt = Number.isInteger(c)

      return {
        title: "Pythagorean Theorem: Hypotenuse Calculation",
        category: "Geometry",
        problem: `Find hypotenuse c given legs a = ${a}, b = ${b}`,
        steps: [
          {
            stepNumber: 1,
            title: "State Pythagorean Theorem",
            explanation: "In any right-angled triangle, a² + b² = c²",
            math: `c² = (${a})² + (${b})²`,
          },
          {
            stepNumber: 2,
            title: "Square the Legs and Add",
            explanation: `${a}² = ${a * a},  ${b}² = ${b * b}`,
            math: `c² = ${a * a} + ${b * b} = ${cSq}`,
          },
          {
            stepNumber: 3,
            title: "Take the Square Root",
            explanation: `c = √${cSq}`,
            math: `c = ${isInt ? c : `√${cSq} ≈ ${c.toFixed(2)}`}`,
          },
        ],
        finalAnswer: `Hypotenuse c = ${isInt ? c : c.toFixed(2)}`,
      }
    }

    return null
  }

  /**
   * 7. Solve Arithmetic: e.g. "what is 45 * 12", "calculate 150 / 5", "2^8", "sqrt(144)"
   */
  public static solveArithmetic(text: string): SolutionResult | null {
    // Square root
    const sqrtMatch = text.match(/(?:sqrt|square root of)\s*(\d+)/i)
    if (sqrtMatch) {
      const val = parseInt(sqrtMatch[1])
      const root = Math.sqrt(val)
      const isInt = Number.isInteger(root)
      return {
        title: "Square Root Calculation",
        category: "Arithmetic",
        problem: `√${val}`,
        steps: [
          {
            stepNumber: 1,
            title: "Evaluate Square Root",
            explanation: isInt
              ? `Since ${root} × ${root} = ${val}:`
              : `Approximating radical √${val}:`,
            math: `√${val} = ${isInt ? root : root.toFixed(4)}`,
          },
        ],
        finalAnswer: `${isInt ? root : root.toFixed(4)}`,
      }
    }

    // Exponents: e.g. "3^4" or "2^8"
    const expMatch = text.match(/(\d+)\s*\^\s*(\d+)/)
    if (expMatch) {
      const base = parseInt(expMatch[1])
      const exp = parseInt(expMatch[2])
      if (exp <= 20) {
        const val = Math.pow(base, exp)
        return {
          title: "Exponentiation Calculation",
          category: "Arithmetic",
          problem: `${base}^${exp}`,
          steps: [
            {
              stepNumber: 1,
              title: "Definition of Exponent",
              explanation: `Multiply the base ${base} by itself ${exp} times:`,
              math: `${Array(exp).fill(base).join(" × ")} = ${val}`,
            },
          ],
          finalAnswer: `${val}`,
        }
      }
    }

    // Percentage: "25% of 80"
    const pctMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s*of\s*(\d+(?:\.\d+)?)/i)
    if (pctMatch) {
      const pct = parseFloat(pctMatch[1])
      const val = parseFloat(pctMatch[2])
      const result = (pct / 100) * val
      return {
        title: "Percentage Calculation",
        category: "Arithmetic",
        problem: `${pct}% of ${val}`,
        steps: [
          {
            stepNumber: 1,
            title: "Convert Percentage to Decimal / Fraction",
            explanation: `${pct}% = ${pct} / 100 = ${(pct / 100).toFixed(4).replace(/\.?0+$/, "")}`,
            math: `${pct} / 100 = ${pct / 100}`,
          },
          {
            stepNumber: 2,
            title: "Multiply by the Total",
            explanation: `(${pct / 100}) × ${val} = ${result}`,
            math: `${result}`,
          },
        ],
        finalAnswer: `${result}`,
      }
    }

    // Two-term arithmetic: e.g. "45 * 12", "125 + 380", "500 - 185", "144 / 12"
    const arithMatch = text.match(
      /(?:what is|calculate|evaluate)?\s*(-?\d+(?:\.\d+)?)\s*([+\-*x/÷])\s*(-?\d+(?:\.\d+)?)/i,
    )
    if (arithMatch && !text.includes("=")) {
      const num1 = parseFloat(arithMatch[1])
      const op =
        arithMatch[2] === "x"
          ? "*"
          : arithMatch[2] === "÷"
            ? "/"
            : arithMatch[2]
      const num2 = parseFloat(arithMatch[3])

      let res = 0
      let opName = ""
      if (op === "+") {
        res = num1 + num2
        opName = "Addition"
      } else if (op === "-") {
        res = num1 - num2
        opName = "Subtraction"
      } else if (op === "*") {
        res = num1 * num2
        opName = "Multiplication"
      } else if (op === "/") {
        if (num2 === 0) return null
        res = num1 / num2
        opName = "Division"
      }

      return {
        title: `${opName} Calculation`,
        category: "Arithmetic",
        problem: `${num1} ${op} ${num2}`,
        steps: [
          {
            stepNumber: 1,
            title: `Execute ${opName}`,
            explanation: `Compute ${num1} ${op} ${num2}:`,
            math: `${num1} ${op} ${num2} = ${
              Number.isInteger(res) ? res : res.toFixed(4)
            }`,
          },
        ],
        finalAnswer: `${Number.isInteger(res) ? res : res.toFixed(4)}`,
      }
    }

    return null
  }

  /**
   * Format SolutionResult into a beautifully readable Markdown response
   */
  public static formatSolution(
    solution: SolutionResult,
    studentName: string,
  ): string {
    let md = `Here is the step-by-step solution, ${studentName}! 🧮\n\n`
    md += `### 📌 **Problem:** \`${solution.problem}\`\n`
    md += `*Topic:* ${solution.title} (${solution.category})\n\n`
    md += `---\n\n`

    for (const step of solution.steps) {
      md += `#### **Step ${step.stepNumber}: ${step.title}**\n`
      md += `${step.explanation}\n`
      if (step.math) {
        md += `> **\`${step.math}\`**\n`
      }
      md += `\n`
    }

    md += `---\n`
    md += `### 🎯 **Final Answer:**\n`
    md += `**\`${solution.finalAnswer}\`**\n\n`

    if (solution.verification) {
      md += `🔍 *Verification:* ${solution.verification}\n\n`
    }

    if (solution.tip) {
      md += `💡 *Pro-Tip:* ${solution.tip}\n\n`
    }

    md += `Would you like me to give you a similar practice question to test your skill, or explain any step further? 🚀`
    return md
  }
}
