import { parseHTML } from "./parser"

// 将html字符串解析成dom树
export function compileToFunction(template) {
  parseHTML(template)
}
