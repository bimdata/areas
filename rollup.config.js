import { terser } from "rollup-plugin-terser";
import vue from 'rollup-plugin-vue';
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

const isProduction = (process.env.BUILD === "production");

console.log(`ROLLUP -- Building for ${isProduction ? "PRODUCTION" : "DEVELOPMENT"}`);

const plugins = [
  vue({ needMap: false })
];

if (isProduction) {
  plugins.push(
    terser()
  );
} else {
  plugins.push(
    serve({ open: true, port: 8080, contentBase: '' }),
    livereload('dist')
  );
}

export default {
  input: "src/main.js",
  output: [{
    name: "areas",
    file: "dist/areas.js",
    format: "umd",
    sourcemap: !isProduction
  }, {
    file: "dist/areas.esm.js",
    format: "es",
    sourcemap: !isProduction
  }],
  plugins
};