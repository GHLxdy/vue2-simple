import { isObject } from "../utils";
import { arrayMethods } from "./array";
import Dep from "./dep";

// 检测数据的变化
class Observe {
  constructor(data) {
    data.__ob__ = this;
    Object.defineProperty(data, "__ob__", {
      value: this,
      enumerable: false // 不可枚举
    });
    if (Array.isArray(data)) {
      // 数组劫持
      // 对数组中的方法进行 重写（使用高阶函数/切片）
      data.__proto__ = arrayMethods;
      this.observeArray(data);
    } else {
      this.walk(data); // 对象数据劫持
    }
  }
  // 对数组中的数组 和数组中的对象 进行劫持
  observeArray(data) {
    data.forEach(item => {
      observe(item);
    });
  }
  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data, key, data[key]);
    });
  }
}

// vue2 会将对象进行遍历 将每个属性 用defineProperty 重新定义 =》 性能差
function defineReactive(data, key, value) {
  observe(value) // 本身用户默认值是对象嵌套对象， 需进行递归处理
  let dep = new Dep() // 每个属性都一个dep属性
  Object.defineProperty(data, key, {
    get() {
      // 取值时watcher和Depd对应起来
      if (Dep.target) { // 此值是在模板中使用了
        dep.depend() // 让dep记住watcher
      }
      return value
    },
    set(newV) {
      // 
      if (newV !== value) {
        observe(newV) // 如果用户赋值一个新对象，需要将这个对象进行劫持
        value = newV
        dep.notify() // 告诉当前属性存放的watcher执行
      }
    }
  });
}

export function observe(data) {
  // 如果是对象才观测
  // 默认最外层的data必须是一个对象
  if (!isObject(data)) {
    return;
  }

  return new Observe(data);
}
