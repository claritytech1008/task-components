import { Component, Host, h, Element, Prop, Listen } from '@stencil/core';
import { Context } from '../../utils/context'
import { debounce } from '../../utils/utils';


@Component({
  tag: 'task-form',
  styleUrl: 'task-form.css',
  shadow: false,
})
export class TaskForm {
  @Prop() saveLocal: boolean = false
  @Prop() localId: string
  @Element() host
  formElement: HTMLFormElement
  context: Context
  sendFormState = debounce(() => sendFormState(this.formElement, this.context))
  crowdForm: HTMLElement | null = null
  crowdApp: HTMLElement | null = null

  componentDidLoad() {
    // TODO: do something when we don't have a form...
    // TODO: Remove the event listener when unloaded
    if (this.formElement) {
      this.formElement.addEventListener("submit", e => this.onSubmit(e))
      this.formElement.focus()
    }

    this.context = new Context()
    window.parent.postMessage({type: 'requestTaskContext'}, window.origin)
    window.addEventListener('appload', () => this.inputFocus())
  }

  @Listen("inputUpdated", {target: "document"})
  onInputUpdated() {
    console.log('inputUpdated')
    this.sendFormState()
  }

  @Listen("message", {target: "window"})
  onMessage(event: MessageEvent) {
    switch (event.data.type) {
      case "taskContext":
        console.log("received taskContext", event)
        this.context.updateFromContextMessage(event.data)
        if (event.data.response) {
          console.log(`updating form response for assignment ${event.data.assignmentId}`)
          console.log(event.data.response)
          if (this.formElement) {
            for (const [key, value] of Object.entries(event.data.response)) {
              const element = this.formElement.elements[key]
              element.value = value
            }
          }
        }
        if (this.crowdForm) {
          // @ts-ignore
          this.crowdForm._submitHelperForm = crowdSubmitHandler.bind(this.crowdForm, this.context)
        }
        break
      case "taskStart":
        this.inputFocus()
        break
      default:
        console.error(`Unknown event type ${event.data.type}`)
    }
  }

  @Listen("all-crowd-elements-ready", {target: "document"})
  onCrowdElementsReady() {
    // This will be fired if the task contains `crowd-form` from Amazon's Crowd Elements
    // In that case we will want to replace the default submit handling that component uses
    this.crowdForm = document.querySelector("crowd-form")
    // @ts-ignore
    this.crowdForm._submitHelperForm = crowdSubmitHandler.bind(this.crowdForm, this.context)
    const answersBox: HTMLElement = this.crowdForm.shadowRoot.querySelector("#answers-box")
    if (answersBox) {
      answersBox.style.display = "none"
    }
    this.crowdApp = findCrowdApp(this.crowdForm)
    if (this.crowdApp) {
      console.log(this.crowdApp)
      const header = this.crowdApp.shadowRoot.querySelector(".headerContainer")
      if (header) {
        (header as HTMLElement).style.display = "none"
      }
      console.log("CER FOCUS ON CROWD APP")
      // this.crowdApp.shadowRoot.querySelector(".awsui").focus()
      console.log(document.activeElement)
    }
  }

  inputFocus() {
    if (this.crowdApp) {
      this.crowdApp.focus()
    } else {
      // TODO: Update this to find the correct input to focus on
      const input = document.querySelector("input")
      if (input) {
        input.focus()
      }
    }
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault()
    const formResponse = buildFormResponse(this.formElement)
    submitFormResponse(formResponse, this.context)
  }

  render() {
    return (
      <Host>
        <form ref={el => this.formElement = el as HTMLFormElement}>
          <slot></slot>
        </form>
      </Host>
    );
  }

}

function crowdSubmitHandler(context: Context) {
  let formData = this._serializeForm();
  console.log(JSON.parse(formData.taskAnswers)[0])
  submitFormResponse(JSON.parse(formData.taskAnswers)[0], context)
}

function buildFormResponse(form: HTMLFormElement) {
  const formData = new FormData(form)
  const response = {}
  for (let pair of formData.entries()) {
    response[pair[0]] = pair[1]
  }
  return response
}

function sendFormState(form: HTMLFormElement, context: Context) {
  const formResponse = buildFormResponse(form)
  window.parent.postMessage({
    type: "formUpdated",
    assignmentId: context.assignmentId,
    formData: formResponse,
    formState: null
  }, window.origin)
}

function findCrowdApp(crowdForm: HTMLElement) {
  const children = []
  const cfForm = crowdForm.querySelector("form")
  for (let child of cfForm.children) {
    if (child.shadowRoot) {
      children.push(child)
    }
  }
  if (children.length === 1) {
    return children[0]
  }
}

function submitFormResponse(formResponse: {}, context: Context) {
  if (context.mode === "requester-preview") {
    // TODO: Display preview response
    console.log("Submitted in preview:")
    console.log(formResponse)
  } else if (context.mode === "working" && context.site === "open-event") {
    const eventType = context.submitEventType || "submitTask"
    console.log("sending form data to parent")
    window.parent.postMessage({
      type: eventType,
      assignmentId: context.assignmentId,
      formData: formResponse,
      formState: null
    }, window.origin);
  }
}
