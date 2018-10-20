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
const mobxPatchedDefinition = newSymbol("patchedDefinition")
const mobxRealMethod = newSymbol("patchRealMethod")

function getMixins(target, methodName) {
    const mixins = (target[mobxMixins] = target[mobxMixins] || {})
    const methodMixins = (mixins[methodName] = mixins[methodName] || {})
    methodMixins.locks = methodMixins.locks || 0
    methodMixins.methods = methodMixins.methods || []
    return methodMixins
}

function wrapper(realMethod, mixins, ...args) {
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

function wrapFunction(mixins) {
    const fn = function(...args) {
        wrapper.call(this, fn[mobxRealMethod], mixins, ...args)
    }
    return fn
}

export function patch(target, methodName, forcePatch, ...mixinMethods) {
    const mixins = getMixins(target, methodName)

    for (const mixinMethod of mixinMethods) {
        if (mixins.methods.indexOf(mixinMethod) < 0) {
            mixins.methods.push(mixinMethod)
        }
    }

    const oldDefinition = Object.getOwnPropertyDescriptor(target, methodName)
    if (!forcePatch && oldDefinition && oldDefinition[mobxPatchedDefinition]) {
        // already patched definition, do not repatch
        return
    }

    const newDefinition = createDefinition(target, methodName, oldDefinition, mixins)

    Object.defineProperty(target, methodName, newDefinition)
}

function createDefinition(target, methodName, oldDefinition, mixins) {
    const originalMethod = target[methodName]
    const wrappedFunc = wrapFunction(mixins)
    wrappedFunc[mobxRealMethod] = originalMethod

    return {
        [mobxPatchedDefinition]: true,
        get: function() {
            return wrappedFunc
        },
        set: function(value) {
            if (this === target) {
                wrappedFunc[mobxRealMethod] = value
            } else {
                // when it is an instance of the prototype/a child prototype patch that particular case again separately
                // we don't need to pass any mixin functions since the structure is shared
                patch(this, methodName, true)
                this[methodName] = value
            }
        },
        configurable: true,
        enumerable: oldDefinition ? oldDefinition.enumerable : undefined
    }
}
