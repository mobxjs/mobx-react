export function isStateless(component) {
  return !component.prototype.render;
}
