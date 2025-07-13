import { Component, Host, h, Prop } from '@stencil/core';

@Component({
  tag: 'task-image-vertex',
  styleUrl: 'task-image-vertex.css',
  scoped: true,
})
export class TaskImageVertex {
  @Prop() x: string
  @Prop() y: string

  render() {
    return (<Host></Host>)
  }
}
