import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prototipo standalone sin bundler: sus componentes son globales de window
    // (React/Nav/GAMES…) cargados por <script>. No es código de la app y el
    // spec 01 lo declara fuente de verdad intocable.
    "references/**",
  ]),
]);

export default eslintConfig;
