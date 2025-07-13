import { Component, Host, h, Prop, State, Element, Method } from '@stencil/core';
import { gatherVertices } from '../../utils/utils';

@Component({
  tag: 'task-image-polygon',
  styleUrl: 'task-image-polygon.css',
  scoped: true,
})
export class TaskImagePolygon {
  @Prop() lineWidth: number = 5
  @Prop() color: string = "green"
  @State() location: number[]
  vertexArray: Array<any> = [];

  vertices: Element[];
  @Element() host: HTMLElement

  componentWillLoad() {
    this.vertices = gatherVertices(this.host)
    this.vertices.map(vertex => {
      if(vertex.tagName === "TASK-IMAGE-VERTEX") {
        this.vertexArray.push([vertex.getAttribute("x"), vertex.getAttribute("y")])        
      }
    })
  }

  @Method()
  async drawBox(context: CanvasRenderingContext2D) {
    if (this.vertexArray) {
      context.beginPath()
      context.lineWidth = this.lineWidth
      context.strokeStyle = this.color
      context.lineJoin = 'round'; 
      context.moveTo(this.vertexArray[0][0], this.vertexArray[0][1])

      for(let i=1;i<this.vertexArray.length;i++){
        context.lineTo(this.vertexArray[i][0], this.vertexArray[i][1])
      }

      context.closePath()
      context.stroke()
    }
  }

  render() {
    return (
      <Host>
        <slot></slot>
      </Host>
    );
  }

}
