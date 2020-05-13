import { terser } from "rollup-plugin-terser";
import vue from 'rollup-plugin-vue';

const isProduction = (process.env.BUILD === "production");

console.log(`ROLLUP -- Building for ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);

export default {
  input: "src/main.js",
  output: [{
    sourcemap: !isProduction,
    name: "areas",
    file: "dist/areas.js",
    format: "umd"
  }, {
    sourcemap: !isProduction,
    file: "dist/areas.esm.js",
    format: "es"
  }],
  plugins: [
    vue(),
    isProduction ? terser() : null
  ]
};