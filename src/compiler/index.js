import { generate } from "./generate"
import { parseHTML } from "./parser"

// 看一下用户是否传入了 , 没传入可能传入的是 template, template如果也没有传递
// 将我们的html =》 词法解析  （开始标签 ， 结束标签，属性，文本）
// => ast语法树 用来描述html语法的 stack=[]

// codegen  <div>hello</div>  =>   _c('div',{},'hello')  => 让字符串执行
// 字符串如果转成代码 eval 好性能 会有作用域问题

// 模板引擎 new Function + with 来实现

// 将html字符串解析成dom树

export function compileToFunction(template) {
  let root = parseHTML(template)
  // html=> ast（只能描述语法 语法不存在的属性无法描述） => render函数 + (with + new Function) => 虚拟dom （增加额外的属性） => 生成真实dom

  // 生成代码
  let code = generate(root)

  // console.log(code)
  let render = new Function(`with(this){return ${code}}`) // code 中会用到数据 数据在vm上
  return render
}
