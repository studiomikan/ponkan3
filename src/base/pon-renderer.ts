import * as PIXI from "pixi.js";

export class PonRenderer {
  private width: number;
  private height: number;
  private parentElm: HTMLElement;
  private renderer: PIXI.WebGLRenderer | PIXI.CanvasRenderer;
  private _container: PIXI.Container;

  public get canvasElm(): HTMLCanvasElement { return this.renderer.view; }
  public get container(): PIXI.Container { return this._container; }

  public constructor(parentElm: HTMLElement, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.parentElm = parentElm;

    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, { backgroundColor: 0xFF000011 });
    parentElm.appendChild(this.renderer.view);

    this._container = new PIXI.Container();
  }

  public destroy() {
    this.container.destroy();
    this.parentElm.removeChild(this.renderer.view);
    this.renderer.destroy();
  }

  public draw(tick: number) {
    if (this.renderer == null || this._container == null) { return; }
    this.renderer.render(this._container);
  }

  public addContainer(child: PIXI.Container) {
    this._container.addChild(child);
  }

  public removeContainer(child: PIXI.Container) {
    this._container.removeChild(child);
  }
}
