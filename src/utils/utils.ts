import { TaskAnswer } from '../components/task-answer/task-answer';
import { TaskAnswerCorrection } from '../components/task-answer-correction/task-answer-correction';

export function format(first: string, middle: string, last: string): string {
  return (first || '') + (middle ? ` ${middle}` : '') + (last ? ` ${last}` : '');
}

export function ignoreKeypress(): boolean {
  const activeEl = document.activeElement
  return activeEl.nodeName === "TEXTAREA" ||
    (activeEl.nodeName === "INPUT" && activeEl.getAttribute("type") === "text")
}

export type KeyboardShortcut = {
  label: string
  keys: string
  value?: string
}

export function gatherInputOptions(parent: HTMLElement) {
  return Array.from(parent.getElementsByTagName("task-input-option"))
    .filter(n => Array.from(parent.children).includes(n))
}

export function gatherVertices(parent: HTMLElement) {
  return Array.from(parent.getElementsByTagName("task-image-vertex"))
    .filter(n => Array.from(parent.children).includes(n))
}

export function inputOptionKeyboardShortcuts(options: HTMLTaskInputOptionElement[]): KeyboardShortcut[] {
  const shortcuts: KeyboardShortcut[] = []
  for (let option of options) {
    if (option.keyboardShortcut) {
      if (option.keyboardShortcutLabel) {
        shortcuts.push({label: option.keyboardShortcutLabel, keys: option.keyboardShortcut, value: option.value})
      } else {
        shortcuts.push({label: option.innerHTML, keys: option.keyboardShortcut, value: option.value})
      }
    }
  }
  return shortcuts
}

export function getAnswerElement(host: Element) {
  return (host.querySelector("TASK-ANSWER") as unknown) as TaskAnswer
}
export function getAnswerCorrectionElement(host: Element) {
  return (host.querySelector("TASK-ANSWER-CORRECTION") as unknown) as TaskAnswerCorrection
}

export function getActiveElement(element?: HTMLElement | null, options?: GetRootNodeOptions) {
  if (element == null) {
    return document.activeElement
  }
  const rootNode = (element.getRootNode(options) ?? document) as DocumentOrShadowRoot & Node;
  return rootNode.activeElement
}

export function isFunction(value: any): value is Function {
  return typeof value === "function"
}

export function isKeyboardClick(event: KeyboardEvent) {
  return event.key === "Enter" || event.key === " "
}

export function isArrowKey(event: KeyboardEvent) {
  return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(event.key) >= 0
}

export type CallbackFunction = (this: Window, ev: Event) => any

const MARK_NAMESPACE = "tc"

export function mark(name: string) {
  // console.log(`Logging mark: ${name}`)
  window.performance.mark(`${MARK_NAMESPACE}:${name}`)
}

export function getMarks() {
  return window.performance.getEntriesByType("mark")
    .filter(mark => mark.name.startsWith(`${MARK_NAMESPACE}:`))
}

export function debounce(callback, wait = 300) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      callback.apply(null, args)
    }, wait)
  }
}
