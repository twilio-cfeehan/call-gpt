module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: "eslint:recommended",
  overrides: [
    {
      env: {
        node: true,
      },
      files: [".eslintrc.{js,cjs}"],
      parserOptions: {
        sourceType: "script",
      },
    },
  ],
  globals: {
    expect: "writeable",
    test: "writeable",
    process: "readable",
  },
  parserOptions: {
    ecmaVersion: "latest",
  },
  rules: {
    indent: "off", // Turns off indent enforcement
    "linebreak-style": "off", // Turns off linebreak enforcement
    quotes: "off", // Turns off quote enforcement
    semi: "off", // Turns off semicolon enforcement
  },
};
