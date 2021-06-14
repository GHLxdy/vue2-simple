let oldArrayPrototype = Array.prototype;
export let arrayMethods = Object.create(Array.prototype);

let methods = ["push", "shift", "unshift", "pop", "pop", "sort", "splice"];

methods.forEach(method => {
  // 对以上7个方法进行重写
  arrayMethods[method] = function (...args) {
    oldArrayPrototype[method].call(this, ...args);
    const ob = this.__ob__;
    let inserted;
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2);
      default:
        break;
    }
    // 如果有新增的内容需要进行继续的劫持
    if (inserted) ob.observeArray(inserted);
  };
});
