export function isStateless(component) {
    // `function() {}` has prototype, but `() => {}` doesn't
    // `() => {}` via Babel has prototype too.
    return !(component.prototype && component.prototype.render)
}

export function newSymbol(name) {
    return typeof Symbol === "function" ? Symbol(name) : "__$mobx" + name
}

const mobxMixins = newSymbol("Mixins")
const mobxMixin = newSymbol("Mixin")

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

    function getFunction(...args) {
        const mixins = getMixins(this, methodName)

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
