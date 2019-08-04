export function withConsole(fn) {
    const { warn, error, info } = global.console
    const warnings = []
    const errors = []
    const infos = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}

export async function withAsyncConsole(fn) {
    const { warn, error, info } = global.console
    const warnings = []
    const errors = []
    const infos = []
    try {
        Object.assign(global.console, {
            warn() {
                warnings.push([...arguments])
            },
            error() {
                errors.push([...arguments])
            },
            info() {
                infos.push([...arguments])
            }
        })
        await fn()
        return {
            warnings,
            errors,
            infos
        }
    } finally {
        Object.assign(global.console, { warn, error, info })
    }
}
