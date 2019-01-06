import { Logger } from './logger';
import { Resource } from './resource'

export class Tag {
  protected _name: string;
  protected _values: object;

  public get name(): string { return this._name; }
  public get values(): object { return this._values; }

  public constructor(name: string, values: object) {
    this._name = name;
    this._values = values; 
  }

  public debugPrint(): void {
    Logger.debug("TAG: ", this.name, this.values);
  }
}

export class ScriptParser {
  private scriptText: string;
  private lines: string[] = [];
  private currentLineNum: number = 0;
  private _tags: Tag[] = [];

  public get tags(): Tag[] { return this.tags; }

  public constructor(scriptText: string) {
    this.scriptText = scriptText;
    this.currentLineNum = 0;
    this.lines = this.scriptText.split(/\n/g);
    this.parse();
  }

  public debugPrint(): void {
    this._tags.forEach((tag) => {
      tag.debugPrint();
    });
  }

  private getLine(): string | null {
    if (this.currentLineNum < this.lines.length) {
      return this.lines[this.currentLineNum++].trim();
    } else {
      return null;
    }
  }

  private getLineWithoutTrim(): string | null {
    if (this.currentLineNum < this.lines.length) {
      return this.lines[this.currentLineNum++];
    } else {
      return null;
    }
  }

  private parse(): void {
    while(true) {
      let line: string | null = this.getLine();
      if (line == null || line == "") continue;

      let ch0 = line.charAt(0);
      let body = line.substring(1).trim();
      Logger.debug("line: ", ch0, body);

      if (line == "---") {
        // JavaScript部
        let js: string = body + "\n";
        while (true) {
          let tmp: string | null = this.getLineWithoutTrim();
          if (tmp == null || tmp == "" || tmp.trim() == "---") break;
          js += body;
        }
        this.addTag("__js__", { "__body__": js });
      } else {
        // その他の一行コマンド類
        switch (ch0) {
          case '#':
            // コメント
            break;
          case ';':
            // コマンド
            this.parseCommand(body);
            break;
          case ':':
            // ラベル
            this.parseLabel(body);
            break;
          case '-':
            // JavaScript / JavaScript部
            this.parseJs(body);
            break;
          case '=':
            // JavaScript出力
            this.parseJsPrint(body);
            break;
          default:
            this.parseText(body);
            break;
        }
      }
    }
  }

  private parseCommand(body: string): void {
    let tagName: string = body.substring(0, body.indexOf("{")).trim();
    let values: any = JSON.parse(body.substring(body.indexOf("{")));
    values["__body__"] = body;
    this.addTag(tagName, values);
  }

  private parseLabel(body: string): void {
    this.addTag("__label__", { "__body__": body });
  }

  private parseJs(body: string): void {
    this.addTag("__js__", { "__body__": body, "print": false });
  }

  private parseJsPrint(body: string): void {
    this.addTag("__js__", { "__body__": body, "print": true });
  }

  private parseText(body: string): void {
    for (let i = 0; i < body.length; i++) {
      let ch = body.charAt(i);
      if (ch == "") continue;

      if (ch == "$") {
        this.addTag("br", { "__body__": body });
      } else {
        this.addTag("ch", { "__body__": ch, "text": ch});
      }
    }
  }

  private addTag(name: string, values: object) {
    this._tags.push(new Tag(name, values));
  }

}

