import { isObject } from "../utils";

// 检测数据的变化 
class Observe {
  constructor(data) { // 对象中的所有属性 进行数据劫持
    this.walk(data)
  }

  walk(data) {
    Object.keys(data).forEach(key => {
      defineReactive(data,key,data[key])
    })
  }
}

// vue2 会将对象进行遍历 将每个属性 用defineProperty 重新定义 =》 性能差
function defineReactive(data, key, value) {
  observe(value) // 本身用户默认值是对象嵌套对象， 需进行递归处理
  Object.defineProperty(data, key, {
    get() {
      return value
    },
    set(newV) {
      observe(newV) // 如果用户赋值一个新对象，需要将这个对象进行劫持
      value = newV
    }
  })
}


export function observe(data) {
  // 如果是对象才观测
  // 默认最外层的data必须是一个对象
  if (!isObject(data)) {
    return;
  }

  return new Observe(data)
}