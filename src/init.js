import { initSate } from "./state";

// 在Vue的基础上做一次混合操作
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this;
    vm.$options = options;

    // 对数据进行初始化
    initSate(vm);
  };
}
