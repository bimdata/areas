module.exports = {
  rootDir: "unitTest",
  moduleFileExtensions: [
    "js",
    "vue"
  ],
  transform: {
    "^.+\\.js$": "<rootDir>/../node_modules/babel-jest",
    ".*\\.(vue)$": "<rootDir>/../node_modules/vue-jest"
  }
}