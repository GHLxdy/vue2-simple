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
    initData(vm)
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