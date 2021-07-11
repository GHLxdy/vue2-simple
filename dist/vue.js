(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
}(this, (function () { 'use strict';

  const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`; // 标签名
  const qnameCapture = `((?:${ncname}\\:)?${ncname})`; //  用来获取的标签名的 match后的索引为1的
  const startTagOpen = new RegExp(`^<${qnameCapture}`); // 匹配开始标签的
  const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配闭合标签的
  const attribute =
    /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // a=b  a="b"  a='b'
  const startTagClose = /^\s*(\/?)>/; //     />   <div/>

  //
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
    text = text.replace(/\s/g, "");
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
    console.log(root);
    return root
  }

  // 将html字符串解析成dom树
  function compileToFunction(template) {
    parseHTML(template);
  }

  function isFunction(val) {
    return typeof val === "function";
  }

  function isObject(val) {
    return typeof val === "object" && val !== null;
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
    };
  });

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
    observe(value); // 本身用户默认值是对象嵌套对象， 需进行递归处理
    Object.defineProperty(data, key, {
      get() {
        return value;
      },
      set(newV) {
        observe(newV); // 如果用户赋值一个新对象，需要将这个对象进行劫持
        value = newV;
      }
    });
  }

  function observe(data) {
    // 如果是对象才观测
    // 默认最外层的data必须是一个对象
    if (!isObject(data)) {
      return;
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
    };
  }

  function Vue(options) {
    this._init(options);
  }
  // 扩展原型
  initMixin(Vue);

  return Vue;

})));
//# sourceMappingURL=vue.js.map
