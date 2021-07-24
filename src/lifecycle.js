import Watcher from "./observe/watcher"
import { nextTick } from "./utils"
import { pacth } from "./vdom/patch"

export function lifecycleMixin(Vue) {
  Vue.prototype._update = function (vnode) {
    // console.log("_update", vnode)
    const vm = this
    vm.$el = pacth(vm.$el, vnode)
  }
  Vue.prototype.$nextTick = nextTick
}

// 后续每个组件渲染时都会 有一个Watcher
export function mountComponent(vm, el) {
  // 更新函数 数据变化后 会再次调用此函数
  let updateComponent = () => {
    // 调用render函数，生成虚拟dom
    vm._update(vm._render()) // 后续更新可以调用 updateComponent 方法
    // 用虚拟dom生成真实dom
  }
  // 观察者模式： 属性时”被观察者“ 刷新页面：”观察者“
  // updateComponent()
  new Watcher(
    vm,
    updateComponent,
    () => {
      console.log("更新视图")
    },
    true
  ) // 他是一个渲染watcher 后续有其他的watcher
}
