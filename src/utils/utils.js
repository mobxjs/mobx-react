export function isStateless(component) {
    // `function() {}` has prototype, but `() => {}` doesn't
    // `() => {}` via Babel has prototype too.
    return !(component.prototype && component.prototype.render)
}

function getMixins(target, methodName) {
    const mixins = (target["__$mobxMixins"] = target["__$mobxMixins"] || {})
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
    if (typeof realMethod === "function" && realMethod["__$mobxMixin"]) {
        // already patched, do not repatch
        return
    }

    function getFunction(...args) {
        const mixins = getMixins(this, methodName)

        for (const pre of mixins.pre) {
            pre.apply(this, args)
        }

        if (realMethod !== undefined && realMethod !== null) {
            realMethod.apply(this, args)
        }

        for (const post of mixins.post) {
            post.apply(this, args)
        }
    }
    getFunction["__$mobxMixin"] = true

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
