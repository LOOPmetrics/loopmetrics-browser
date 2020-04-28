import typescript from "rollup-plugin-typescript2"
import { terser } from "rollup-plugin-terser"
import cleanup from "rollup-plugin-cleanup"

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/bundle.cjs.js",
      format: "cjs"
    },
    {
      file: "dist/bundle.es.js",
      format: "es"
    },
    {
      file: "dist/bundle.min.js",
      format: "cjs",
      plugins: [terser()]
    }
  ],
  plugins: [typescript(), cleanup()],
  external: ["tslib"]
}
