import {defineConfig, globalIgnores} from "eslint/config";
import next from "@next/eslint-plugin-next";
import parser from "@typescript-eslint/parser";
export default defineConfig([globalIgnores([".next/**","node_modules/**","data/**","backups/**","materials/**","next-env.d.ts"]),{files:["**/*.{ts,tsx,mjs}"],languageOptions:{parser,parserOptions:{ecmaVersion:"latest",sourceType:"module"}},plugins:{"@next/next":next},rules:{...next.configs.recommended.rules}}]);
