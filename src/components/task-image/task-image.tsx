import { Component, Host, h, Prop, State, Element, Listen } from '@stencil/core';
import { computeBoxLocation } from '../../utils/image';

type ZoomLocation = {
  x: number
  y: number
  boxLeft: number
  boxTop: number
  originX: number
  originY: number
  left: number
  top: number
  ratioX: number
  ratioY: number
}

@Component({
  tag: 'task-image',
  styleUrl: 'task-image.css',
  scoped: true,
})
export class TaskImage {
  @Prop() src: string
  @Prop() width: string
  @Prop() height: string
  @Prop() cropTop: number
  @Prop() cropLeft: number
  @Prop() cropWidth: number
  @Prop() cropHeight: number
  @Prop() cropCoordinates: string
  @Prop() hoverZoom: boolean = false
  @Prop() zoomSize: string = "100px"
  @Prop() zoomPercentage: number = 200
  @Element() host: HTMLElement
  @State() zBoxSize: number
  @State() image: HTMLImageElement
  @State() scalar: number = 1
  @State() calculatedWidth: number
  @State() calculatedHeight: number
  @State() boxes: HTMLTaskImageBoxElement[]
  @State() crop: number[]
  @State() mouseover: boolean = false
  @State() zoomLocation: ZoomLocation
  canvasElement!: HTMLCanvasElement
  zoomCanvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D

  componentWillLoad() {
    this.boxes = Array.from(this.host.getElementsByTagName("task-image-box"))
    this.crop = computeBoxLocation(this.cropLeft, this.cropTop, this.cropWidth, this.cropHeight, this.cropCoordinates)
    this.image = new Image()
    this.image.crossOrigin = "anonymous"
    this.image.src = this.src
    // TODO: Add error handler and/or switch to load event?
    this.image.decode().then(() => this.renderCanvas())
    // this.image.onload = () => this.renderCanvas()
  }

  getContext() {
    if (this.ctx) {
      return this.ctx
    } else {
      this.ctx = this.canvasElement.getContext("2d")
      return this.ctx
    }
  }

  renderCanvas() {
    const width = this.crop ? this.crop[2] : this.image.naturalWidth
    let height = this.crop ? this.crop[3] : this.image.naturalHeight
    if (this.image.complete) {
      // TODO: flush out the sizing logic
      if (this.width && this.width.endsWith("%")) {
        const percentage: number = parseFloat(this.width.substring(0, this.width.length - 1))
        this.calculatedWidth = this.host.offsetWidth * percentage / 100
        this.scalar = this.calculatedWidth / width
        this.calculatedHeight = height * this.scalar
      } else if (this.width && this.width.endsWith("px")) {
        this.calculatedWidth = parseFloat(this.width.substring(0, this.width.length - 1))
        this.scalar = this.calculatedWidth / width
        this.calculatedHeight = height * this.scalar
      } else {
        this.calculatedWidth = this.image.naturalWidth
        this.calculatedHeight = this.image.naturalHeight
        this.scalar = 1
      }
      this.canvasElement.width = this.calculatedWidth
      this.canvasElement.height = this.calculatedHeight
      if (this.crop) {
        this.getContext().drawImage(
          this.image,
          -this.crop[0] * this.scalar,
          -this.crop[1] * this.scalar,
          this.image.naturalWidth * this.scalar,
          this.image.naturalHeight * this.scalar)
      } else {
        this.getContext().drawImage(
          this.image, 0, 0, this.canvasElement.width, this.canvasElement.height)
      }
      for (let b of this.boxes) {
        b.drawBox(
          this.getContext(),
          this.scalar,
          this.crop ? -this.crop[0] * this.scalar : 0,
          this.crop ? -this.crop[1] * this.scalar : 0)
      }
      // compute the size of the zoom box
      if (this.hoverZoom && this.zoomSize) {
        if (this.zoomSize.endsWith("px")) {
          this.zBoxSize = parseFloat(this.zoomSize.substring(0, this.zoomSize.length - 2))
        } else if (this.zoomSize.endsWith("%")) {
          const percent = parseFloat(this.zoomSize.substring(0, this.zoomSize.length - 1))
          this.zBoxSize = Math.min(this.calculatedWidth, this.calculatedHeight) * percent / 100
        } else {
          try {
            this.zBoxSize = parseFloat(this.zoomSize)
          } catch {
            console.error("Failed to parse zoomSize")
          }
        }
      }
    }
  }

  @Listen("resize", {target: "window"})
  handleResize() {
    this.renderCanvas()
  }

  bound(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max)
  }

  @Listen("mousemove")
  handleMouseMove(event) {
    if (this.hoverZoom && this.zBoxSize) {
      const bounds = this.host.getBoundingClientRect()
      const boxOffset = this.zBoxSize / 4
      const x = event.x - bounds.left
      const y = event.y - bounds.top
      // limit the zoom origin to keep the zoom contents within the image
      const originX = this.bound(x, boxOffset, this.calculatedWidth - boxOffset)
      const originY = this.bound(y, boxOffset, this.calculatedHeight - boxOffset)
      // Get the coordinates of the zoom canvas in the page
      const boxLeft = this.bound(originX - this.zBoxSize / 2, 0, this.calculatedWidth - this.zBoxSize)
      const boxTop = this.bound(originY - this.zBoxSize / 2, 0, this.calculatedHeight - this.zBoxSize - 1)
      // Get the relative position of the zoom region (top-left) within the image
      const ratioX = (originX - boxOffset)/(this.calculatedWidth - this.zBoxSize / 2)
      const ratioY = (originY - boxOffset)/(this.calculatedHeight - this.zBoxSize / 2)
      this.zoomLocation = {
        x,
        y,
        originX,
        originY,
        boxLeft: boxLeft + window.scrollX + bounds.left,
        boxTop: boxTop + window.scrollY + bounds.top,
        left: ratioX * (this.zBoxSize - this.calculatedWidth * 2),
        top: ratioY * (this.zBoxSize - this.calculatedHeight * 2),
        ratioX,
        ratioY
      }
    }
  }

  @Listen("mouseover")
  handleMouseOver() {
    this.mouseover = true
  }

  @Listen("mouseout")
  handleMouseOut() {
    this.mouseover = false
  }

  render() {
    let zoomStyle: {display: string, left?: string, top?: string, width?: string, height?: string} = {
      display: "none"
    }
    if (
      this.zoomCanvas && this.hoverZoom && this.canvasElement &&
      this.mouseover && this.zoomLocation &&
      this.calculatedHeight && this.calculatedWidth
    ) {
      const zoomContext = this.zoomCanvas.getContext("2d")
      zoomContext.drawImage(
        this.canvasElement,
        this.zoomLocation.left,
        this.zoomLocation.top,
        this.calculatedWidth * 2,
        this.calculatedHeight * 2)
      zoomStyle = {
        display: "block",
        left: `${this.zoomLocation.boxLeft}px`,
        top: `${this.zoomLocation.boxTop}px`,
        width: `${this.zBoxSize}px`,
        height: `${this.zBoxSize}px`
      }
    }
    return (
      <Host>
        <canvas ref={el => this.canvasElement = el}/>
        <div class="zoomBox" style={zoomStyle}>
          <canvas ref={el => this.zoomCanvas = el} width={this.zBoxSize} height={this.zBoxSize}/>
        </div>
        <slot></slot>
      </Host>
    );
  }

}
