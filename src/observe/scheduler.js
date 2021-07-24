import { nextTick } from "../utils"

let queue = []
let has = {} // 做列表维护 存放了那些watcher

function flushScheduleQueue() {
  for (let i = 0;i < queue.length;i++) {
    queue[i].run()
  }
  queue = []
  has = {}
  pending = false
}

let pending = false
export function queuewatcher(watcher) {
  const id = watcher.id
  if (has[id] == null) {
    has[id] = id
    queue.push(watcher)
    // 开启一次更新 批处理（防抖）
    if (!pending) {
      nextTick(flushScheduleQueue)
      pending = true
    }
  }
}