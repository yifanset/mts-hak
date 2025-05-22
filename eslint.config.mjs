import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Global rules that apply to all files
    rules: {
      // Disable TypeScript strict typing rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      
      // Disable React Hook rules
      "react-hooks/exhaustive-deps": "off",
      
      // Disable NextJS specific rules if needed
      "@next/next/no-img-element": "warn"
    }
  }
];

export default eslintConfig;
