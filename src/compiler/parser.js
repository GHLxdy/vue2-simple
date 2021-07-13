const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*` // 标签名
const qnameCapture = `((?:${ncname}\\:)?${ncname})` //  用来获取的标签名的 match后的索引为1的
const startTagOpen = new RegExp(`^<${qnameCapture}`) // 匹配开始标签的
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`) // 匹配闭合标签的
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/ // a=b  a="b"  a='b'
const startTagClose = /^\s*(\/?)>/ //     />   <div/>

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

let root = null
let stack = []
function start(tagName, attributes) {
  let parent = stack[stack.length - 1]
  let element = createAstElement(tagName, attributes)
  if (!root) {
    root = element
  }
  if (parent) {
    element.parent = parent
    parent.children.push(element)
  }
  stack.push(element)
}
function end(tagName) {
  let last = stack.pop()
  if (last.tag !== tagName) {
    throw new Error("标签有误")
  }
}

function chars(text) {
  text = text.replace(/\s+/g, "")
  let parent = stack[stack.length - 1]
  if (text) {
    parent.children.push({
      type: 3,
      text
    })
  }
}

export function parseHTML(html) {
  function advance(len) {
    html = html.substring(len)
  }
  function parseStartTag() {
    const start = html.match(startTagOpen) // 匹配开始标签
    if (start) {
      const match = {
        tagName: start[1],
        attrs: []
      }
      advance(start[0].length)
      let end
      let attr
      // 如果没有遇到标签结尾就不停解析
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5]
        })
        advance(attr[0].length)
      }
      if (end) {
        advance(end[0].length)
      }
      return match
    }
    return false
  }
  while (html) {
    // 如果解析的内容存在，就不停的解析
    let textEnd = html.indexOf("<") // 解析当前开头
    if (textEnd === 0) {
      const startTagMatch = parseStartTag() // 解析开始标签

      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs)
        continue
      }
      const endTagMatch = html.match(endTag)
      if (endTagMatch) {
        end(endTagMatch[1])
        advance(endTagMatch[0].length)
        continue
      }
    }
    let text // 123</div>
    if (textEnd > 0) {
      text = html.substring(0, textEnd)
    }
    if (text) {
      chars(text)
      advance(text.length)
    }
  }
  return root
}
