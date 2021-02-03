module.exports = () => ({
  files: [`serverDate.js`],
  tests: [`test.js`],
  env: {
    type: `node`,
    params: {
      runner: `-r ${require.resolve(`esm`)}`,
    },
  },
});
