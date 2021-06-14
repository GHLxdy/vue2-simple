import { observe } from "./observe/index";
import { isFunction } from "./utils";

/**
 * 状态初始化
 * @param {*} vm
 */
export function initSate(vm) {
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

function proxy(vm, source, key) {
  Object.defineProperty(vm, key, {
    get() {
      return vm[source][key];
    },
    set(newValue) {
      vm[source][key] = newValue;
    }
  });
}

function initData(vm) {
  let data = vm.$options.data;
  // vue2中会将data中所有的数据 进行数据劫持 Object.defineProperty

  data = vm._data = isFunction(data) ? data.call(vm) : data;

  for (let key in data) {
    proxy(vm, "_data", key);
  }

  observe(data);
}
