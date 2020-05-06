module.exports = {
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "react"],
    extends: ["eslint:recommended", "plugin:react/recommended"],
    env: {
        browser: true,
        es6: true,
        node: true
    },
    globals: {
        process: "readonly",
        __DEV__: "readonly"
    },
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module"
    },
    settings: {
        react: {
            version: "detect"
        }
    },
    overrides: [
        {
            files: ["**/*.ts", "**/*.tsx"],
            rules: {
                // Things that don't play nicely with TS:
                "react/display-name": "off",
                "require-yield": "off",
                "no-unused-vars": "off",
                "no-extra-semi": "off"
            }
        }
    ]
}
