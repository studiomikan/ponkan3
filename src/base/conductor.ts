import { Logger } from "./logger";
import { Resource } from "./resource";
import { AsyncCallbacks } from "./async-callbacks";
import { Script } from "./script";
import { Tag } from "./tag";

export interface IConductorEvent {
  onConductError(messages: string[]): void;
  // onLoadScript(): void;
  onLabel(labelName: string): void;
  onJs(js: string, printFlag: boolean): void;
  onTag(tag: Tag): void;
}

export class Conductor {
  protected resource: Resource;
  protected eventCallbacks: IConductorEvent;
  protected script: Script;
  protected status: "stop" | "run" | "sleep" = "stop";
  protected sleepStartTick: number = -1;
  protected sleepTime: number = -1;

  public constructor(resource: Resource, eventCallbacks: IConductorEvent) {
    this.resource = resource;
    this.eventCallbacks = eventCallbacks;
    this.script = new Script(";s");
  }

  public loadScript(filePath: string): AsyncCallbacks {
    let cb = new AsyncCallbacks();
    this.resource.loadScript(filePath).done((script: Script) => {
      this.script = script;
      cb.callDone(filePath);
    }).fail(() => {
      cb.callFail(filePath);
    });
    return cb;
  }

  public conduct(tick: number): void {
    if (this.status === "stop") { return; }

    // スリープ処理
    // スリープ中ならretur、終了していたときは後続処理へ進む
    if (this.status === "sleep") {
      const elapsed: number = tick - this.sleepStartTick;
      if (elapsed < this.sleepTime) {
        return;
      } else {
        this.start();
      }
    }

    let tag: Tag | null = this.script.getNextTag();
    if (tag == null) {
      this.stop();
      return;
    } else {
      tag = tag.clone();
    }

    this.applyJsEntity(tag.values);
    switch (tag.name) {
      case "__label__":
        this.eventCallbacks.onLabel(tag.values.__body__);
        break;
      case "__js__":
        this.eventCallbacks.onJs(tag.values.__body__, tag.values.print);
        break;
      default:
        this.eventCallbacks.onTag(tag);
        break;
    }
  }

  private applyJsEntity(values: any): void {
    for (let key in values) {
      let value: string = "" + <string> values[key];
      if (value.indexOf("&") == 0 && value.length >= 2) {
        let js: string = value.substring(1);
        values[key] = "" + this.resource.evalJs(js);
      }
    }
  }

  public start() {
    this.status = "run";
    this.sleepTime = -1;
    this.sleepStartTick = -1;
    Logger.debug("Conductor start.");
  }

  public stop() {
    this.status = "stop";
    Logger.debug("Conductor stop.");
  }

  public sleep(tick: number, sleepTime: number) {
    this.status = "sleep";
    this.sleepStartTick = tick;
    this.sleepTime = sleepTime;
    Logger.debug("Conductor sleep.", sleepTime);
  }

}
