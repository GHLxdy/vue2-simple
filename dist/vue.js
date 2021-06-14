(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  function isFunction(val) {
    return typeof val === 'function'
  }

  function isObject(val) {
    return typeof val === 'object' && val !== null
  }

  // 检测数据的变化 
  class Observe {
    constructor(data) { // 对象中的所有属性 进行数据劫持
      this.walk(data);
    }

    walk(data) {
      Object.keys(data).forEach(key => {
        defineReactive(data,key,data[key]);
      });
    }
  }

  // vue2 会将对象进行遍历 将每个属性 用defineProperty 重新定义 =》 性能差
  function defineReactive(data, key, value) {
    observe(value); // 本身用户默认值是对象嵌套对象， 需进行递归处理
    Object.defineProperty(data, key, {
      get() {
        return value
      },
      set(newV) {
        observe(newV); // 如果用户赋值一个新对象，需要将这个对象进行劫持
        value = newV;
      }
    });
  }


  function observe(data) {
    // 如果是对象才观测
    // 默认最外层的data必须是一个对象
    if (!isObject(data)) {
      return;
    }

    return new Observe(data)
  }

  /**
   * 状态初始化
   * @param {*} vm 
   */
  function initSate(vm) {
    const opts = vm.$options;
    // if (opts.props) {
    //   initProps()
    // }
    if (opts.data) {
      initData(vm);
    }
    // if (opts.computed) {
    //   initComputed()
    // }
    // if (opts.watch) {
    //   initWatch()
    // }
  }

  function initData(vm) {
    let data = vm.$options.data;
    // vue2中会将data中所有的数据 进行数据劫持 Object.defineProperty

    data = vm._data = isFunction(data) ? data.call(vm) : data;
    
    observe(data);
  }

  // 在Vue的基础上做一次混合操作
  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      vm.$options = options;

      // 对数据进行初始化
      initSate(vm);
    };
  }

  function Vue(options) {
    this._init(options);
  }
  // 扩展原型
  initMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
