import { AsyncTask } from "../base/async-task";
import { BaseLayer } from "../base/base-layer";
import { Logger } from "../base/logger";
import { PonMouseEvent } from "../base/pon-mouse-event";
import { Resource } from "../base/resource";
import { Ponkan3 } from "../ponkan3";
import { Button } from "./button";
import { FrameAnimLayer } from "./frame-anim-layer";

/**
 * テキストと背景色を指定できるボタン
 */
export class TextButton extends Button {
  private txtBtnText: string = "";
  private txtBtnNormalBackgroundColor: number = 0x000000;
  private txtBtnOverBackgroundColor: number = 0x000000;
  private txtBtnOnBackgroundColor: number = 0x000000;
  private txtBtnNormalBackgroundAlpha: number = 1.0;
  private txtBtnOverBackgroundAlpha: number = 1.0;
  private txtBtnOnBackgroundAlpha: number = 1.0;

  public initTextButton(
    jump: boolean = true,
    call: boolean = false,
    filePath: string | null = null,
    label: string | null = null,
    countPage: boolean = true,
    isSystemButton: boolean = false,
    exp: string | null = null,
    text: string,
    normalBackgroundColor: number,
    overBackgroundColor: number,
    onBackgroundColor: number,
    normalBackgroundAlpha: number,
    overBackgroundAlpha: number,
    onBackgroundAlpha: number,
  ): void {
    this.resetButton();
    this.freeImage();
    this.clearText();

    this.initButton(jump, call, filePath, label, countPage, isSystemButton, exp);

    this.txtBtnText = text;
    this.txtBtnNormalBackgroundColor = normalBackgroundColor;
    this.txtBtnOverBackgroundColor = overBackgroundColor;
    this.txtBtnOnBackgroundColor = onBackgroundColor;
    this.txtBtnNormalBackgroundAlpha = normalBackgroundAlpha;
    this.txtBtnOverBackgroundAlpha = overBackgroundAlpha;
    this.txtBtnOnBackgroundAlpha = onBackgroundAlpha;

    this.setBackgroundColor(normalBackgroundColor, normalBackgroundAlpha);
    this.addText(text);
    this.setButtonStatus("disabled");
  }

  public resetButton(): void {
    super.resetButton();

    this.txtBtnText = "";
    this.txtBtnNormalBackgroundColor = 0x000000;
    this.txtBtnOverBackgroundColor = 0x000000;
    this.txtBtnOnBackgroundColor = 0x000000;
    this.txtBtnNormalBackgroundAlpha = 1.0;
    this.txtBtnOverBackgroundAlpha = 1.0;
    this.txtBtnOnBackgroundAlpha = 1.0;
  }

  public setButtonStatus(status: "normal" | "over" | "on" | "disabled"): void {
    super.setButtonStatus(status);

    let color: number | null = null;
    let alpha: number | null = null;
    switch (status) {
      case "normal":
      case "disabled":
        color = this.txtBtnNormalBackgroundColor;
        alpha = this.txtBtnNormalBackgroundAlpha;
        break;
      case "over":
        color = this.txtBtnOverBackgroundColor;
        alpha = this.txtBtnOverBackgroundAlpha;
        break;
      case "on":
        color = this.txtBtnOnBackgroundColor;
        alpha = this.txtBtnOnBackgroundAlpha;
        break;
    }
    if (color == null) { color = this.txtBtnNormalBackgroundColor; }
    if (alpha == null) { alpha = this.txtBtnNormalBackgroundAlpha; }
    this.setBackgroundColor(color, alpha);
  }

  protected static textButtonStoreParams: string[] = [
    "txtBtnText",
    "txtBtnNormalBackgroundColor",
    "txtBtnOverBackgroundColor",
    "txtBtnOnBackgroundColor",
    "txtBtnNormalBackgroundAlpha",
    "txtBtnOverBackgroundAlpha",
    "txtBtnOnBackgroundAlpha",
  ];

  public store(tick: number): any {
    const data: any = super.store(tick);
    const me: any = this as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      data[param] = me[param];
    });
    return data;
  }

  // public restore(asyncTask: AsyncTask, data: any, tick: number, clear: boolean): void {
  //   super.restore(asyncTask, data, tick, clear);
  // }

  public restoreAfterLoadImage(data: any, tick: number): void {
    super.restoreAfterLoadImage(data, tick);
    const me: any = this as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      me[param] = data[param];
    });

    this.clearText();
    this.addText(data.txtBtnText);
  }

  public copyTo(dest: TextButton): void {
    super.copyTo(dest);

    const me: any = this as any;
    const you: any = dest as any;
    TextButton.textButtonStoreParams.forEach((param: string) => {
      you[param] = me[param];
    });
  }
}

/**
 * テキストボタンを配置できるレイヤー
 */
export class TextButtonLayer extends FrameAnimLayer {

  protected textButtons: TextButton[] = [];

  public addTextButton(
    jump: boolean = true,
    call: boolean = false,
    filePath: string | null = null,
    label: string | null = null,
    countPage: boolean = true,
    exp: string | null = null,
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    backgroundColors: number[],
    backgroundAlphas: number[],
    isSystemButton: boolean,
    textMarginTop: number = 0,
    textMarginRight: number = 0,
    textMarginBottom: number = 0,
    textMarginLeft: number = 0,
    textAlign: "left" | "center" | "right" = "center",
  ): void {

    const name = `TextButton ${this.textButtons.length}`;
    const btn = new TextButton(name, this.resource, this.owner);
    this.addChild(btn);
    this.textButtons.push(btn);

    const normal: number = +backgroundColors[0];
    const over: number = backgroundColors[1] != null ? +backgroundColors[1] : normal;
    const on: number = backgroundColors[2] != null ? +backgroundColors[2] : normal;
    const normalAlpha: number = +backgroundAlphas[0];
    const overAlpha: number = backgroundAlphas[1] != null ? +backgroundAlphas[1] : normalAlpha;
    const onAlpha: number = backgroundAlphas[2] != null ? +backgroundAlphas[2] : normalAlpha;

    this.copyTextParams(btn);
    btn.x = x;
    btn.y = y;
    btn.width = width;
    btn.height = height;
    btn.textMarginTop = textMarginTop;
    btn.textMarginRight = textMarginRight;
    btn.textMarginBottom = textMarginBottom;
    btn.textMarginLeft = textMarginLeft;
    btn.textAlign = textAlign;
    btn.initTextButton(
      jump,
      call,
      filePath,
      label,
      countPage,
      isSystemButton,
      exp,
      text,
      normal,
      over,
      on,
      normalAlpha,
      overAlpha,
      onAlpha,
    );
  }

  public copyTextParams(destLayer: BaseLayer): void {
    const dest: any = destLayer as any;
    const me: any = this as any;
    [
      "textFontFamily",
      "textFontSize",
      "textFontWeight",
      "textColor",
      "textShadowVisible",
      "textShadowAlpha",
      "textShadowAngle",
      "textShadowBlur",
      "textShadowColor",
      "textShadowDistance",
      "textEdgeColor",
      "textEdgeWidth",
      "textMarginTop",
      "textMarginRight",
      "textMarginBottom",
      "textMarginLeft",
      "textX",
      "textY",
      "textLineHeight",
      "textLinePitch",
      "textAutoReturn",
      // "textLocatePoint",
      // "textIndentPoint",
      "textAlign",
    ].forEach((param) => {
      dest[param] = me[param];
    });
  }

  public clearTextButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.resetButton();
      textButton.destroy();
      this.deleteChildLayer(textButton);
    });
    this.textButtons = [];
  }

  public lockButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.setButtonStatus("disabled");
    });
  }

  public unlockButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.setButtonStatus("normal");
    });
  }

  public lockSystemButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.lockSystemButton();
    });
  }

  public unlockSystemButtons(): void {
    this.textButtons.forEach((textButton) => {
      textButton.unlockSystemButton();
    });
  }

  public store(tick: number): any {
    const data: any = super.store(tick);
    const me: any = this as any;

    data.textButtons = this.textButtons.map((textButton) => textButton.store(tick));

    return data;
  }

  public restore(asyncTask: AsyncTask, data: any, tick: number, clear: boolean): void {
    this.clearTextButtons();
    if (data.textButtons != null && data.textButtons.length > 0) {
      data.textButtons.forEach((textButtonData: any) => {
        const btn = new TextButton(textButtonData.name, this.resource, this.owner);
        this.addChild(btn);
        this.textButtons.push(btn);
        btn.restore(asyncTask, textButtonData, tick, clear);
      });
    }
    super.restore(asyncTask, data, tick, clear);
  }

  protected restoreAfterLoadImage(data: any, tick: number): void {
    super.restoreAfterLoadImage(data, tick);
    if (data.textButtons != null && data.textButtons.length > 0) {
      for (let i = 0; i < data.textButtons.length; i++) {
        this.textButtons[i].restoreAfterLoadImage(data.textButtons[i], tick);
      }
    }
  }

  public copyTo(dest: TextButtonLayer): void {
    super.copyTo(dest);

    dest.clearTextButtons();
    this.textButtons.forEach((srcBtn) => {
      const destBtn = new TextButton(name, dest.resource, dest.owner);
      dest.addChild(destBtn);
      dest.textButtons.push(destBtn);
      srcBtn.copyTo(destBtn);
    });
  }

}
