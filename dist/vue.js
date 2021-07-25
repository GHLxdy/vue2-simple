(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaa}}

  function genProps(attrs) {
    // [{name:'xxx',value:'xxx'},{name:'xxx',value:'xxx'}]}
    let str = "";
    for (let i = 0; i < attrs.length; i++) {
      let attr = attrs[i];
      if (attr.name === "style") {
        let styleObj = {};
        attr.value.replace(/([^;:]+)\:([^;:]+)/g, function () {
          styleObj[arguments[1]] = arguments[2];
        });
        attr.value = styleObj;
      }

      str += `${attr.name}:${JSON.stringify(attr.value)},`;
    }
    return `{${str.slice(0, -1)}}`
  }

  function gen(el) {
    if (el.type == 1) {
      // 如果是元素，则递归
      return generate(el)
    } else {
      let text = el.text;
      if (!defaultTagRE.test(text)) {
        return `_v("${text}")`
      } else {
        // hello {{ name }} world => 'hello' + arr + 'world'
        let tokens = [];
        let match;
        let lastIndex = 0;
        defaultTagRE.lastIndex = 0; // 和css-loader原理一样
        while ((match = defaultTagRE.exec(text))) {
          let index = match.index;
          if (index > lastIndex) {
            tokens.push(JSON.stringify(text.slice(lastIndex, index)));
          }
          tokens.push(`_s(${match[1].trim()})`); // JSON.stringify()
          lastIndex = index + match[0].length;
        }
        if (lastIndex < text.length) {
          tokens.push(JSON.stringify(text.slice(lastIndex)));
        }
        return `_v(${tokens.join("+")})`
      }
    }
  }

  function genChildren(el) {
    let children = el.children; // 获取儿子
    if (children) {
      return children.map(c => gen(c)).join(",")
    }
    return false
  }

  function generate(el) {
    // _c('div',{id:'app',a:1},_c('span',{},'world'),_v())

    // 遍历树 将树拼接成字符串
    let children = genChildren(el);
    let code = `_c('${el.tag}',${
    el.attrs.length ? genProps(el.attrs) : "undefined"
  }${children ? `,${children}` : ""})`;
    return code
  }

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
  const attribute =
    /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
  const startTagClose = /^\s*(\/?)>/; //     />   <div/>

  // html字符串解析成 对应的脚本来触发 tokens  <div id="app"> {{name}}</div>
  // 将解析后的结果 组装成一个树结构  栈
  function createAstElement(tagName, attrs) {
    return {
      tag: tagName,
      type: 1,
      children: [],
      attrs
    }
  }

  let root = null;
  let stack = [];
  function start(tagName, attributes) {
    let parent = stack[stack.length - 1];
    let element = createAstElement(tagName, attributes);
    if (!root) {
      root = element;
    }
    if (parent) {
      element.parent = parent;
      parent.children.push(element);
    }
    stack.push(element);
  }
  function end(tagName) {
    let last = stack.pop();
    if (last.tag !== tagName) {
      throw new Error("标签有误")
    }
  }

  function chars(text) {
    text = text.replace(/\s+/g, "");
    let parent = stack[stack.length - 1];
    if (text) {
      parent.children.push({
        type: 3,
        text
      });
    }
  }

  function parseHTML(html) {
    function advance(len) {
      html = html.substring(len);
    }
    function parseStartTag() {
      const start = html.match(startTagOpen); // 匹配开始标签
      if (start) {
        const match = {
          tagName: start[1],
          attrs: []
        };
        advance(start[0].length);
        let end;
        let attr;
        // 如果没有遇到标签结尾就不停解析
        while (
          !(end = html.match(startTagClose)) &&
          (attr = html.match(attribute))
        ) {
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
          advance(attr[0].length);
        }
        if (end) {
          advance(end[0].length);
        }
        return match
      }
      return false
    }
    while (html) {
      // 如果解析的内容存在，就不停的解析
      let textEnd = html.indexOf("<"); // 解析当前开头
      if (textEnd === 0) {
        const startTagMatch = parseStartTag(); // 解析开始标签

        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          continue
        }
        const endTagMatch = html.match(endTag);
        if (endTagMatch) {
          end(endTagMatch[1]);
          advance(endTagMatch[0].length);
          continue
        }
      }
      let text; // 123</div>
      if (textEnd > 0) {
        text = html.substring(0, textEnd);
      }
      if (text) {
        chars(text);
        advance(text.length);
      }
    }
    return root
  }

  // 看一下用户是否传入了 , 没传入可能传入的是 template, template如果也没有传递
  // 将我们的html =》 词法解析  （开始标签 ， 结束标签，属性，文本）
  // => ast语法树 用来描述html语法的 stack=[]

  // codegen  <div>hello</div>  =>   _c('div',{},'hello')  => 让字符串执行
  // 字符串如果转成代码 eval 好性能 会有作用域问题

  // 模板引擎 new Function + with 来实现

  // 将html字符串解析成dom树

  function compileToFunction(template) {
    let root = parseHTML(template);
    // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom

    // 生成代码
    let code = generate(root);

    // console.log(code)
    let render = new Function(`with(this){return ${code}}`); // code 中会用到数据 数据在vm上
    return render
  }

  let id$1 = 0;
  class Dep { // 每个属性分配一个dep,dep可以存放watcher,watcher中还要存放这个dep
    constructor() {
      this.id = id$1++;
      this.subs = [];
    }
    depend() {
      // Dep.target dep里要存放这个watcher
      // watcher 要存放dep 多对多的关系
      if (Dep.target) {
        Dep.target.addDep(this);
      }
    }
    addSub(watcher) {
      this.subs.push(watcher);
    }
    notify() {
      this.subs.forEach(watcher => watcher.update());
    }
  }
  Dep.target = null;
  function pushTarget(watcher) {
    Dep.target = watcher;
  }
  function popTarget() {
    Dep.target = null;
  }

  function isFunction(val) {
    return typeof val === "function";
  }

  function isObject(val) {
    return typeof val === "object" && val !== null;
  }

  const callbacks = [];
  function flushCallback() {
    callbacks.forEach(cb => cb());
    waiting = false;
  }
  let waiting = false;
  function timer(flushCallbacks) {
    let timerFn = () => { };
    if (Promise) {
      timerFn = () => {
        Promise.resolve().then(flushCallbacks);
      };
    } else if (MutationObserver) {
      let textNode = document.createTextNode(1);
      let observe = new MutationObserver(flushCallbacks);
      observe.observe(textNode, {
        characterData: true
      });
      timerFn = () => {
        textNode.textContent = 3;
      };
      // 微任务
    } else if (setImmediate) {
      timerFn = () => {
        setImmediate(flushCallbacks);
      };
    } else {
      timerFn = () => {
        setTimeout(flushCallbacks);
      };
    }
    timerFn();
  }
  // 微任务是在页面渲染前执行 我取的是内存中的dom，不关心你渲染完毕没有
  function nextTick(cb) {
    callbacks.push(cb);
    if (!waiting) {
      // vue2 中考虑了兼容问题 vue3不在考虑兼容问题，所以vue直接使用Promise.resolve()
      timer(flushCallback);
      waiting = true;
    }
  }

  let queue = [];
  let has = {}; // 做列表维护 存放了那些watcher

  function flushScheduleQueue() {
    for (let i = 0;i < queue.length;i++) {
      queue[i].run();
    }
    queue = [];
    has = {};
    pending = false;
  }

  let pending = false;
  function queuewatcher(watcher) {
    const id = watcher.id;
    if (has[id] == null) {
      has[id] = id;
      queue.push(watcher);
      // 开启一次更新 批处理（防抖）
      if (!pending) {
        nextTick(flushScheduleQueue);
        pending = true;
      }
    }
  }

  let id = 0;
  class Watcher {
    constructor(vm, exprOrFn, cb, options) {
      this.vm = vm;
      this.exprOrFn = exprOrFn;
      this.cb = cb;
      this.options = options;
      this.id = id++;
      this.depsId = new Set();
      this.deps = [];
      // 默认应该让 exprOrFn执行

      this.getter = exprOrFn;

      this.get(); // 默认初始化 要取值
    }
    get() { // 当数据更新时 可以重新调用getter方法

      // defineProperty.get，每个属性都可以收集自己的watcher
      // 一个属性可以对应多个watcher,同时一个watcher可以对应多个属性
      pushTarget(this); // Dep.target = watcher
      this.getter();
      popTarget(); // Dep.target = null: 如果Dep.target有值说明这个变量在模板中使用了
    }
    update() {
      // 每次更新时 this
      // 多次调用update 先将watcher缓存 等一会一起执行
      queuewatcher(this);
    }
    run() {
      console.log('更新');
      this.get();
    }
    addDep(dep) {
      const id = dep.id;
      if (!this.depsId.has(id)) {
        this.depsId.add(dep.id);
        this.deps.push(dep);
        dep.addSub(this);
      }
    }
  }

  function pacth(oldVnode, vnode) {
    if (oldVnode.nodeType == 1) {
      // 用vnode 来生成真实dom 替换原本的dom元素
      const parentElm = oldVnode.parentNode;
      let elm = createElm(vnode); // 根据虚拟节点 创建元素
      parentElm.insertBefore(elm, oldVnode.nextSibing);

      parentElm.removeChild(oldVnode);
      return elm
    }
  }

  function createElm(vnode) {
    const { tag, data, children, text, vm } = vnode;
    if (typeof vnode.tag === "string") {
      vnode.el = document.createElement(tag); // 虚拟节点会有一个el属性 对应真实节点
      children.forEach(child => {
        vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }
    return vnode.el
  }

  function lifecycleMixin(Vue) {
    Vue.prototype._update = function (vnode) {
      // console.log("_update", vnode)
      const vm = this;
      vm.$el = pacth(vm.$el, vnode);
    };
    Vue.prototype.$nextTick = nextTick;
  }

  // 后续每个组件渲染时都会 有一个Watcher
  function mountComponent(vm, el) {
    // 更新函数 数据变化后 会再次调用此函数
    let updateComponent = () => {
      // 调用render函数，生成虚拟dom
      vm._update(vm._render()); // 后续更新可以调用 updateComponent 方法
      // 用虚拟dom生成真实dom
    };
    // 观察者模式： 属性时”被观察者“ 刷新页面：”观察者“
    // updateComponent()
    new Watcher(
      vm,
      updateComponent,
      () => {
        console.log("更新视图");
      },
      true
    ); // 他是一个渲染watcher 后续有其他的watcher
  }

  let oldArrayPrototype = Array.prototype;
  let arrayMethods = Object.create(Array.prototype);

  let methods = ["push", "shift", "unshift", "pop", "pop", "sort", "splice"];

  methods.forEach(method => {
    // 对以上7个方法进行重写
    arrayMethods[method] = function (...args) {
      oldArrayPrototype[method].call(this, ...args);
      const ob = this.__ob__;
      let inserted;
      switch (method) {
        case "push":
        case "unshift":
          inserted = args;
          break;
        case "splice":
          inserted = args.slice(2);
      }
      // 如果有新增的内容需要进行继续的劫持
      if (inserted) ob.observeArray(inserted);

      // 数组的observer.dep 属性
      ob.dep.notify();
    };
  });

  // 检测数据变化 类有类型 ， 对象无类型

  // 如果给对象新增一个属性不会触发视图更新  (给对象本身也增加一个dep，dep中存watcher，如果增加一个属性后，我就手动的触发watcher的更新)
  class Observe {
    constructor(data) {

      this.dep = new Dep();

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

  function dependArray(value) {
    for (let i = 0;i < value.length;i++) {
      const current = value[i];
      current.__ob__ && current.__ob__.dep.depend();
      if (Array.isArray(current)) {
        dependArray(current);
      }
    }
  }

  // vue2 会将对象进行遍历 将每个属性 用defineProperty 重新定义 =》 性能差
  function defineReactive(data, key, value) {
    let childOb = observe(value); // 本身用户默认值是对象嵌套对象， 需进行递归处理
    let dep = new Dep(); // 每个属性都一个dep属性
    Object.defineProperty(data, key, {
      get() {
        // 取值时watcher和Depd对应起来
        if (Dep.target) { // 此值是在模板中使用了
          dep.depend(); // 让dep记住watcher
          if (childOb) { // 可能是数组 可能是对象，对象也要收集依赖，后续写$set方法时需要触发他自己的更新操作
            childOb.dep.depend(); // 就是让数组和对象也记录watcher

            if (Array.isArray(value)) { //取外层数组要将数组里面的也进行依赖收集
              dependArray(value);
            }

          }
        }
        return value
      },
      set(newV) {
        if (newV !== value) {
          observe(newV); // 如果用户赋值一个新对象，需要将这个对象进行劫持
          value = newV;
          dep.notify(); // 告诉当前属性存放的watcher执行
        }
      }
    });
  }

  function observe(data) {
    // 如果是对象才观测
    // 默认最外层的data必须是一个对象
    if (!isObject(data)) {
      return;
    }
    if (data.__ob__) {
      return data.__ob__;
    }
    return new Observe(data);
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

  // 在Vue的基础上做一次混合操作
  function initMixin(Vue) {
    Vue.prototype._init = function (options) {
      const vm = this;
      vm.$options = options;

      // 对数据进行初始化
      initSate(vm);

      if (vm.$options.el) {
        // 将数据挂载到这个模板上
        vm.$mount(vm.$options.el);
      }
    };

    Vue.prototype.$mount = function (el) {
      const vm = this;
      const options = vm.$options;
      el = document.querySelector(el);
      vm.$el = el;
      // 模板=>渲染函数=>虚拟dom vnode => diff算法 => 更新虚拟dom  => 产生真是节点，更新
      if (!options.render) {
        // 没有render用template
        let template = options.template;
        // 没有template,就取el的内容为模板
        if (!template && el) {
          template = el.outerHTML;
          let render = compileToFunction(template);
          options.render = render;
        }
      }

      mountComponent(vm);
    };
  }

  function createElement(vm, tag, data = {}, ...children) {
    return vnode(vm, tag, data, data.key, children, undefined)
  }

  function createTextElement(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text)
  }

  function vnode(vm, tag, data, key, children, text) {
    return {
      vm,
      tag,
      data,
      key,
      children,
      text
      // .....
    }
  }

  function renderMixin(Vue) {
    // createElement
    Vue.prototype._c = function () {
      return createElement(this, ...arguments)
    };
    // createTextElement
    Vue.prototype._v = function (text) {
      return createTextElement(this, text)
    };
    Vue.prototype._s = function (val) {
      if (typeof val === "object") return JSON.stringify(val)
      return val
    };
    Vue.prototype._render = function () {
      const vm = this;
      let render = vm.$options.render;
      let vnode = render.call(vm);
      return vnode
    };
  }

  function Vue(options) {
    this._init(options);
  }
  // 扩展原型
  initMixin(Vue);
  renderMixin(Vue); // 扩展 _render 方法
  lifecycleMixin(Vue); // 控制 _update 方法

  return Vue;

})));
//# sourceMappingURL=vue.js.map
