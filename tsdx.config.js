module.exports = {
    rollup(config, options) {
        return {
            ...config,
            output: {
                ...config.output,
                globals: {
                    react: "React",
                    mobx: "mobx",
                    "react-dom": "ReactDOM",
                    "mobx-react-lite": "mobxReactLite"
                }
            }
        }
    }
}
