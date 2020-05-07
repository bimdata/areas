import { terser } from "rollup-plugin-terser";
import vue from 'rollup-plugin-vue';

const isProduction = (process.env.BUILD === "production");

export default {
  input: "src/main.js",
  output: [{
    name: "windowmanager",
    file: "dist/windowmanager.js",
    format: "umd"
  }, {
    file: "dist/windowmanager.esm.js",
    format: "es"
  }],
  plugins: [
    vue(),
    isProduction ? terser() : null
  ]
};