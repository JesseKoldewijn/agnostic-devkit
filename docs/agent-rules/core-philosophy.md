# Core Philosophy

## Concise & Targeted Code

- Write **small, single-purpose functions** that do one thing well.
- Prefer multiple smaller functions over large multi-functional ones, unless consolidation significantly reduces complexity (e.g., reusing import logic across multiple import sources).
- Every function should be **well-tested** with clear inputs and outputs.
- Avoid premature abstraction—extract patterns only when reuse is proven.

## Complexity Management

- **ESLint rules are the source of truth** for code complexity.
- **Warnings** should be minimized and addressed when practical.
- **Errors** (especially complexity-related) are **strictly blocking**—code must not be merged with ESLint errors.
