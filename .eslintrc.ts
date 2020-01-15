module.exports = {
    env: {
        browser: true,
        es6: true
    },
    extends: "eslint:recommended",
    globals: {
        process: "readonly"
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module"
    },
    plugins: ["react", "prettier/recommended", "react/recommended", "@typescript-eslint"],
    settings: {
        react: {
            version: "detect"
        }
    },
    overrides: {
        files: ["**/*.ts"],
        rules: {
            // Things that don't play nicely with TS:
            "require-yield": "off",
            "no-unused-vars": "off",
            "no-extra-semi": "off"
        }
    }
}
