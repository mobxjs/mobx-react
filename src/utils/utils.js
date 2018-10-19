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
    methodMixins.locks = methodMixins.locks || 0
    methodMixins.methods = methodMixins.methods || []
    return methodMixins
}

function wrapFunction(realMethod, mixins) {
    const fn = function(...args) {
        // locks are used to ensure that mixins are invoked only once per invocation, even on recursive calls
        mixins.locks++

        try {
            let retVal
            if (realMethod !== undefined && realMethod !== null) {
                retVal = realMethod.apply(this, args)
            }

            return retVal
        } finally {
            mixins.locks--
            if (mixins.locks === 0) {
                mixins.methods.forEach(mx => {
                    mx.apply(this, args)
                })
            }
        }
    }
    fn[mobxMixin] = true
    return fn
}

export function patch(target, methodName, forcePatch, ...mixinMethods) {
    const mixins = getMixins(target, methodName)

    for (const mixinMethod of mixinMethods) {
        if (mixins.methods.indexOf(mixinMethod) < 0) {
            mixins.methods.push(mixinMethod)
        }
    }

    let actualValue
    const originalMethod = target[methodName]
    if (typeof originalMethod === "function" && originalMethod[mobxMixin]) {
        if (forcePatch) {
            // we can reuse the wrapper method
            actualValue = originalMethod
        } else {
            // already patched, do not repatch
            return
        }
    } else {
        actualValue = wrapFunction(originalMethod, mixins)
    }

    const newDefinition = {
        get: function() {
            return actualValue
        },
        set: function(value) {
            // when it is an instance of the prototype/a child prototype patch that particular case again separately
            if (this !== target) {
                // we don't need to pass any mixin functions since the structure is shared
                patch(this, methodName, true)
                this[methodName] = value
            } else {
                actualValue = wrapFunction(value, mixins)
            }
        },
        configurable: true
    }

    const oldDefinition = Object.getOwnPropertyDescriptor(target, methodName)
    if (oldDefinition) {
        newDefinition.enumerable = oldDefinition.enumerable
    }

    Object.defineProperty(target, methodName, newDefinition)
}
