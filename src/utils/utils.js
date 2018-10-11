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

function getCreateMixins(target, methodName) {
    const mixins = (target[mobxMixins] = target[mobxMixins] || {})
    const methodMixins = (mixins[methodName] = mixins[methodName] || {})
    methodMixins.pre = methodMixins.pre || []
    methodMixins.post = methodMixins.post || []
    return methodMixins
}

function getMixins(target, methodName) {
    return target[mobxMixins][methodName]
}

const cachedDefinitions = {}

function createOrGetCachedDefinition(methodName, enumerable) {
    const cacheKey = `${methodName}+${enumerable}`
    const cached = cachedDefinitions[cacheKey]
    if (cached) {
        return cached
    }

    const getFunction = function getFunction(...args) {
        const mixins = getMixins(this, methodName)
        const realMethod = mixins.real

        mixins.pre.forEach(pre => {
            pre.apply(this, args)
        })

        if (realMethod !== undefined && realMethod !== null) {
            realMethod.apply(this, args)
        }

        mixins.post.forEach(post => {
            post.apply(this, args)
        })
    }
    getFunction[mobxMixin] = true

    const setFunction = function setFunction(value) {
        const mixins = getMixins(this, methodName)
        mixins.real = value
    }

    const newDefinition = {
        get: () => getFunction,
        set: setFunction,
        configurable: true,
        enumerable: enumerable
    }

    cachedDefinitions[cacheKey] = newDefinition

    return newDefinition
}

export function patch(target, methodName, mixinMethod, runMixinFirst = false) {
    const mixins = getCreateMixins(target, methodName)

    if (runMixinFirst) {
        mixins.pre.unshift(mixinMethod)
    } else {
        mixins.post.push(mixinMethod)
    }

    const realMethod = target[methodName]
    if (typeof realMethod === "function" && realMethod[mobxMixin]) {
        // already patched, do not repatch
        return
    }

    mixins.real = realMethod

    const oldDefinition = Object.getOwnPropertyDescriptor(target, methodName)
    const newDefinition = createOrGetCachedDefinition(
        methodName,
        oldDefinition ? oldDefinition.enumerable : undefined
    )

    Object.defineProperty(target, methodName, newDefinition)
}
