module.exports = {
    extends: ["eslint:recommended", "plugin:prettier/recommended", "plugin:react/recommended"],
    parser: "babel-eslint",
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        browser: true,
        es6: true
    },
    globals: {
        process: "readonly"
    },
    plugins: ["react"],
    settings: {
        react: {
            version: "detect"
        }
    }
}
