import mockConsole from "jest-mock-console"

export default function withConsole(settings, fn) {
    if (typeof settings === "function") {
        fn = settings
        settings = undefined
    }
    const restoreConsole = mockConsole(settings)
    fn()
    restoreConsole()
}
