import { Howl, Howler } from "howler";
import { Logger } from "./logger";
import { Macro } from "./macro";
import { PonGame } from "./pon-game";
import { Script } from "./script";
import * as PIXI from "pixi.js";
import * as Util from "./util";

export class Resource {
  public gameVersion: string = "";
  public enableResourceCache: boolean = true;
  private ponGame: PonGame;
  private basePath: string;
  public tmpVar: any = {};
  public gameVar: any = {};
  public systemVar: any = { saveDataInfo: [] };

  public enabledScriptCache: boolean = true;
  private scriptCache: any = {};

  public cursor: any = {
    disabled: "auto",
    normal: "auto",
    over: "pointer",
    on: "pointer",
  };

  public readonly macroInfo: any = {};
  public macroParams: any | null = null;

  private bufferCanvas: HTMLCanvasElement;
  private bufferCanvasContext: CanvasRenderingContext2D;

  public commandShortcut: any = {};

  public constructor(ponGame: PonGame, basePath = "./gamedata", gameVersion = "0.0.0") {
    this.ponGame = ponGame;
    this.basePath = this.fixPath(basePath);
    this.gameVersion = gameVersion;

    Howler.usingWebAudio = true;

    this.bufferCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.bufferCanvas.width = ponGame.width;
    this.bufferCanvas.height = ponGame.height;

    const context: CanvasRenderingContext2D | null = this.bufferCanvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvasの初期化に失敗しました。");
    }
    this.bufferCanvasContext = context;
  }

  public getCanvasElm(): HTMLCanvasElement {
    return this.ponGame.renderer.canvasElm;
  }

  public saveSystemData(saveDataPrefix: string): void {
    try {
      Logger.debug("==SYSTEM SAVE======================================");
      Logger.debug(this.systemVar);
      Logger.debug("===================================================");
      this.storeToLocalStorage(`${saveDataPrefix}_sys`, JSON.stringify(this.systemVar));
    } catch (e) {
      Logger.error(e);
      throw new Error("セーブデータの保存に失敗しました。JSON文字列に変換できません");
    }
  }

  public loadSystemData(saveDataPrefix: string): void {
    try {
      const str: string = this.restoreFromLocalStorage(`${saveDataPrefix}_sys`);
      if (str != null) {
        Util.objExtend(this.systemVar, JSON.parse(str));
      }
      Logger.debug("==SYSTEM LOAD======================================");
      Logger.debug(this.systemVar);
      Logger.debug("===================================================");
    } catch (e) {
      Logger.error(e);
      throw new Error("システムデータのロードに失敗しました");
    }
  }

  public existSystemData(saveDataPrefix: string): boolean {
    try {
      return this.restoreFromLocalStorage(`${saveDataPrefix}_sys`) != null;
    } catch (e) {
      return false;
    }
  }

  public debugClearSystemData(): void {
    Object.keys(this.systemVar).forEach((key) => {
      delete this.systemVar[key];
    });
  }

  public evalJs(js: string): any {
    /* eslint-disable */
    const ponkan = this.ponGame;
    const tv = this.tmpVar;
    const gv = this.gameVar;
    const sv = this.systemVar;
    const mp = this.macroParams;
    /* eslint-enable */
    return (function (): any {
      return eval(js);
    })();
  }

  public setMacroParams(params: any): void {
    this.macroParams = params;
  }

  public clearMacroParams(): void {
    this.macroParams = null;
  }

  public clearMacroInfo(): void {
    Object.keys(this.macroInfo).forEach((key) => delete this.macroInfo[key]);
  }

  /**
   * パスの末尾からスラッシュを取り除いて返す
   */
  private fixPath(path: string): string {
    return path[path.length - 1] === "/" ? path.substring(0, path.length - 1) : path;
  }

  /**
   * リソースのパスを取得する。
   * @param filePath ファイルパス（basePathからの相対パス）
   * @return 補完後のパス
   */
  public getPath(filePath: string): string {
    if (filePath.match(/^http:\/\/|^https:\/\//)) {
      return filePath;
    }
    let path = `${this.basePath}/${filePath}`;
    if (this.enableResourceCache) {
      path += `?v=${this.gameVersion}`;
    } else {
      path += `?x=${Math.random().toString(36).slice(-8)}`;
    }
    return path;
  }

  public hasMacro(name: string): boolean {
    return this.macroInfo[name] != null;
  }

  public getMacro(name: string): Macro {
    return this.macroInfo[name];
  }

  /**
   * テキストを読み込む
   * @param filePath ファイルパス（basePathからの相対パス）
   * @return コールバックオブジェクト
   */
  public async loadText(filePath: string): Promise<string> {
    return new Promise<string>((resolve, reject): void => {
      const xhr = new XMLHttpRequest();
      xhr.onload = (): void => {
        if (200 <= xhr.status && xhr.status < 300) {
          Logger.debug("AJAX SUCCESS: ", xhr);
          resolve(xhr.responseText);
        } else {
          Logger.debug("AJAX FAILED: ", xhr);
          reject(xhr.statusText);
        }
      };
      xhr.open("GET", this.getPath(filePath), true);
      xhr.overrideMimeType("text/plain; charset=UTF-8");
      xhr.send();
    });
  }

  /**
   * スクリプトファイルを読み込む
   * @param filePath ファイルパス（basePathからの相対パス）
   * @return コールバックオブジェクト
   */
  public async loadScript(filePath: string): Promise<Script> {
    if (this.enableResourceCache && this.enabledScriptCache && this.scriptCache[filePath] != null) {
      // キャッシュから
      return this.scriptCache[filePath].clone();
    } else {
      // 新規読み込み
      try {
        const text: string = await this.loadText(filePath);
        const script: Script = new Script(this, filePath, text);
        if (this.enabledScriptCache) {
          this.scriptCache[filePath] = script;
          return script.clone();
        } else {
          return script;
        }
      } catch (e) {
        Logger.error(e);
        if (typeof e === "string") {
          throw new Error(e);
        } else {
          throw e;
        }
      }
    }
  }

  /**
   * 画像を読み込む
   * @param filePath ファイルパス（basePathからの相対パス）
   * @return コールバックオブジェクト
   */
  public async loadImage(filePath: string): Promise<HTMLImageElement> {
    return new Promise<HTMLImageElement>((resolve, reject): void => {
      const path: string = this.getPath(filePath);
      const image: HTMLImageElement = new Image();
      let loaded = false;

      image.onload = (): void => {
        loaded = true;
        resolve(image);
      };
      image.onerror = (): void => {
        // 画像がキャッシュされているとき、サーバが302を返すことがある。
        // その時は、onloadとonerrorの両方が呼ばれてしまうので、
        // すでにonloadが呼ばれて読み込み済みだとわかっている場合はエラーを無視する。
        if (!loaded) {
          reject(image);
        }
      };
      if (filePath.indexOf("data:image/") === 0) {
        image.src = filePath;
      } else {
        image.src = path;
      }
    });
  }

  public loadSoundHowler(filePath: string): Promise<Howl> {
    return new Promise<Howl>((resolve, reject): void => {
      const h: Howl = new Howl({
        src: [this.getPath(filePath)],
        loop: true,
        volume: 1,
        autoplay: false,
        onload: (): void => {
          resolve(h);
        },
        onloaderror: (): void => {
          reject(h);
        },
      });
    });
  }

  public loadVideoTexture(filePath: string, autoPlay: boolean): PIXI.Texture {
    const path: string = this.getPath(filePath);
    const texture: PIXI.Texture = PIXI.Texture.from(path, {
      scaleMode: PIXI.SCALE_MODES.NEAREST,
    });
    (texture.baseTexture.resource as PIXI.resources.VideoResource).autoPlay = autoPlay;
    return texture;
  }

  public cloneVideoTexture(src: PIXI.Texture): PIXI.Texture {
    // return src.clone();
    const source = (src.baseTexture.resource as PIXI.resources.VideoResource).source as HTMLVideoElement;
    const texture: PIXI.Texture = PIXI.Texture.from(source);
    return texture;
  }

  public isEnabledLocalStorage(): boolean {
    return window.localStorage != null;
  }

  public storeToLocalStorage(name: string, data: string): void {
    try {
      window.localStorage.setItem(name, data);
    } catch (e) {
      // ストレージが満杯だったときに発生
      throw new Error("ストレージが満杯のため保存できませんでした");
    }
  }

  public restoreFromLocalStorage(name: string): string {
    const data: string | null = window.localStorage.getItem(name);
    if (data != null) {
      return data;
    } else {
      throw new Error(`ストレージ${name}にはデータがありません`);
    }
  }

  public copyLocalStorage(srcName: string, destName: string): boolean {
    try {
      const srcData: string = this.restoreFromLocalStorage(srcName);
      this.storeToLocalStorage(destName, srcData);
      return true;
    } catch (e) {
      return false;
    }
  }

  // /**
  //  * ローカルストレージが使用できるかどうかを返す
  //  * @return {boolean} 使用できるかどうか
  //  */
  // static isEnabledLocalStorage () {
  //   return window.localStorage != null
  // }
  //
  // /**
  //  * オブジェクトを保存する
  //  * @param {string} name データ名
  //  * @param {string} data 保存するオブジェクト
  //  */
  // static store (name, data) {
  //   let dataStr = data
  //   if (data != null) {
  //     dataStr = JSON.stringify(data)
  //   }
  //   window.localStorage.setItem(name, dataStr)
  // }
  //
  // /**
  //  * オブジェクトを復元する
  //  * @param {string} name データ名
  //  * @return {object} 復元したオブジェクト
  //  */
  // static restore (name) {
  //   let dataStr = window.localStorage.getItem(name)
  //   return JSON.parse(dataStr)
  // }
  //
}
