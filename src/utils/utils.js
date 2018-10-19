export function isStateless(component) {
    // `function() {}` has prototype, but `() => {}` doesn't
    // `() => {}` via Babel has prototype too.
    return !(component.prototype && component.prototype.render)
}

let symbolId = 0
export function newSymbol(name) {
    if (typeof Symbol === "function") {
        return Symbol(name)
    }
    const symbol = `__$mobx-react ${name} (${symbolId})`
    symbolId++
    return symbol
}

const mobxMixins = newSymbol("patchMixins")
const mobxMixin = newSymbol("patchMixin")

function getMixins(target, methodName) {
    const mixins = (target[mobxMixins] = target[mobxMixins] || {})
    const methodMixins = (mixins[methodName] = mixins[methodName] || {})
    methodMixins.pre = methodMixins.pre || []
    methodMixins.post = methodMixins.post || []
    return methodMixins
}

export function patch(target, methodName, mixinMethod, runMixinFirst = false) {
    const mixins = getMixins(target, methodName)

    if (runMixinFirst) {
        mixins.pre.unshift(mixinMethod)
    } else {
        mixins.post.push(mixinMethod)
    }

    let realMethod = target[methodName]
    if (typeof realMethod === "function" && realMethod[mobxMixin]) {
        // already patched, do not repatch
        return
    }

    let realRunning = false

    function getFunction(...args) {
        // avoid recursive calls
        if (realRunning) {
            return
        }

        realRunning = true

        let retVal

        try {
            mixins.pre.forEach(pre => {
                pre.apply(this, args)
            })

            if (realMethod !== undefined && realMethod !== null) {
                retVal = realMethod.apply(this, args)
            }

            mixins.post.forEach(post => {
                post.apply(this, args)
            })

            return retVal
        } finally {
            realRunning = false
        }
    }
    getFunction[mobxMixin] = true

    const newDefinition = {
        get: () => getFunction,
        set: value => {
            realMethod = value
        },
        configurable: true
    }

    const oldDefinition = Object.getOwnPropertyDescriptor(target, methodName)
    if (oldDefinition) {
        newDefinition.enumerable = oldDefinition.enumerable
    }

    Object.defineProperty(target, methodName, newDefinition)
}
