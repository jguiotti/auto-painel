/**
 * AutoPainel — Tailwind entry config (source of truth for CLI / tooling).
 *
 * Semantic tokens and shadcn theme live in `./src/styles/globals.css` (`@theme inline`).
 * Each app imports Tailwind, points `@config` here, then `@import "@autopainel/shared/globals.css"`.
 *
 * @see packages/shared/docs/DESIGN_SYSTEM.md
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
};
