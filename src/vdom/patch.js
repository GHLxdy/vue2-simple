export function pacth(oldVnode, vnode) {
  if (oldVnode.nodeType == 1) {
    // 用vnode 来生成真实dom 替换原本的dom元素
    const parentElm = oldVnode.parentNode
    let elm = createElm(vnode) // 根据虚拟节点 创建元素
    parentElm.insertBefore(elm, oldVnode.nextSibing)

    parentElm.removeChild(oldVnode)
    return elm
  }
}

function createElm(vnode) {
  const { tag, data, children, text, vm } = vnode
  if (typeof vnode.tag === "string") {
    vnode.el = document.createElement(tag) // 虚拟节点会有一个el属性 对应真实节点
    children.forEach(child => {
      vnode.el.appendChild(createElm(child))
    })
  } else {
    vnode.el = document.createTextNode(text)
  }
  return vnode.el
}
