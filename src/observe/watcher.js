import { popTarget, pushTarget } from "./dep"

let id = 0
class Watcher {
  constructor(vm, exprOrFn, cb, options) {
    this.vm = vm
    this.exprOrFn = exprOrFn
    this.cb = cb
    this.options = options
    this.id = id++
    this.depsId = new Set()
    this.deps = []
    // 默认应该让 exprOrFn执行

    this.getter = exprOrFn

    this.get() // 默认初始化 要取值
  }
  get() { // 当数据更新时 可以重新调用getter方法

    // defineProperty.get，每个属性都可以收集自己的watcher
    // 一个属性可以对应多个watcher,同时一个watcher可以对应多个属性
    pushTarget(this) // Dep.target = watcher
    this.getter()
    popTarget() // Dep.target = null: 如果Dep.target有值说明这个变量在模板中使用了
  }
  update() {
    console.log('更新视图')
    this.get()
  }
  addDep(dep) {
    const id = dep.id
    if (this.depsId.has(id)) {
      this.depsId.add(dep.id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }
}

// watcher 和 Dep
// 渲染页面时，会将当前的watcher放到Dep类上
// 在vue中页面渲染 时使用 的属性，需要进行依赖收集，收集对象的渲染watcher
// 取值时，给每一个属性都加了个dep属性，用于存储这个渲染watcher (同一个watcher对应多个dep)
// 每个属性可能对应多个视图（多个视图肯定对应多个watcher）一个属性对应多个watcher
// dep.depend()=>通知dep存放watcher=>Dep.target.addDep=>通过watcher存放dep
// 双向存储
export default Watcher
