import { compileToFunction } from "./compiler/index"
import { mountComponent } from "./lifecycle"
import { initSate } from "./state"

// 在Vue的基础上做一次混合操作
export function initMixin(Vue) {
  Vue.prototype._init = function (options) {
    const vm = this
    vm.$options = options

    // 对数据进行初始化
    initSate(vm)

    if (vm.$options.el) {
      // 将数据挂载到这个模板上
      vm.$mount(vm.$options.el)
    }
  }

  Vue.prototype.$mount = function (el) {
    const vm = this
    const options = vm.$options
    el = document.querySelector(el)
    vm.$el = el
    // 模板=>渲染函数=>虚拟dom vnode => diff算法 => 更新虚拟dom  => 产生真是节点，更新
    if (!options.render) {
      // 没有render用template
      let template = options.template
      // 没有template,就取el的内容为模板
      if (!template && el) {
        template = el.outerHTML
        let render = compileToFunction(template)
        options.render = render
      }
    }

    mountComponent(vm, el)
  }
}
