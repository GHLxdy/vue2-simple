import { initMixin } from "./init"
import { lifecycleMixin } from "./lifecycle"
import { renderMixin } from "./render"

export default function Vue(options) {
  this._init(options)
}
// 扩展原型
initMixin(Vue)
renderMixin(Vue) // 扩展 _render 方法
lifecycleMixin(Vue) // 控制 _update 方法
