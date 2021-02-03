module.exports = {
  env: {
    browser: true,
    es2021: true,
    mocha: true,
    node: true,
  },
  extends: `eslint:recommended`,
  parserOptions: {
    sourceType: `module`,
  },
  rules: {
    quotes: [`error`, `backtick`],
    "no-undef": `error`,
    "no-unused-vars": `warn`,
  },
};
