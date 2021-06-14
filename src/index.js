import { initMixin } from "./init";

export default function Vue(options) {
  this._init(options);
}
// 扩展原型
initMixin(Vue);
