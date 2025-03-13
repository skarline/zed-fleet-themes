declare namespace Zed {
  type ThemeFamily = {
    $schema: string;
    name: string;
    author: string;
    themes: Theme[];
  };

  type Theme = {
    name: string;
    appearance: "light" | "dark";
    style: ThemeStyle;
  };

  type ThemeStyle = {
    [key: string]: string | PlayerColor[] | Record<string, HighlightStyle>;
  };

  type PlayerColor = {
    cursor: string;
    background: string;
    selection: string;
  };

  type HighlightStyle = {
    color: string;
    font_style: "normal" | "italic" | "oblique" | null;
    font_weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | null;
  };
}

declare namespace Fleet {
  type ThemeMeta = {
    "theme.name": string;
    "theme.kind": "Dark" | "Light";
    "theme.version": number;
  };

  type Theme = {
    meta: ThemeMeta;
    colors: Record<string, string>;
    textAttributes: Record<string, TextAttribute>;
    palette: Record<string, string>;
  };

  type TextAttribute = {
    foregroundColor?: string;
    backgroundColor?: string;
    fontStyle?: "ITALIC";
    fontWeight?: "BOLD" | "SEMI_BOLD";
    textDecoration?: TextDecorationStyle;
    scrollbarMarkColor?: string;
    border?: {
      color: string;
    };
  };

  type TextDecorationStyle = {
    color?: string;
    thickness?: number;
    type?: "LINE_THROUGH";
    style?: "DASHED";
  };
}

function importFleetTheme({ meta, colors, textAttributes, palette }: Fleet.Theme): Zed.Theme {
  const name = meta["theme.name"];
  const appearance = meta["theme.kind"] === "Dark" ? "dark" : "light";

  console.log(`Converting theme ${name}`);

  function mix(c1: string, c2: string, alpha: number): string {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);

    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);

    const r = Math.round(r1 * alpha + r2 * (1 - alpha));
    const g = Math.round(g1 * alpha + g2 * (1 - alpha));
    const b = Math.round(b1 * alpha + b2 * (1 - alpha));

    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  }

  function blendWithBg(fg: string): string {
    const bg = getColor("island.background");
    const alpha = parseInt(fg.slice(7, 9), 16) / 255;
    if (isNaN(alpha)) return fg;
    return mix(fg, bg, alpha);
  }

  function getColor(c: string): string {
    if (c.startsWith("#")) return c;
    if (palette[c]) return getColor(palette[c]);
    if (colors[c]) return getColor(colors[c]);
    if (textAttributes[c]?.foregroundColor) return getColor(textAttributes[c].foregroundColor);
    if (textAttributes[c]?.backgroundColor) return getColor(textAttributes[c].backgroundColor);

    throw new Error(`Cannot get color "${c}" for theme "${name}".`);
  }

  function getHighlight(k: string): Zed.HighlightStyle {
    const attributes = textAttributes[k] || { foregroundColor: getColor(k) };
    const { foregroundColor = "text.primary", fontStyle, fontWeight } = attributes;

    const fontStyleMap = {
      ITALIC: "italic",
    } as const;

    const fontWeightMap = {
      BOLD: 700,
      SEMI_BOLD: 600,
    } as const;

    return {
      color: blendWithBg(getColor(foregroundColor)),
      font_style: fontStyle ? fontStyleMap[fontStyle] : null,
      font_weight: fontWeight ? fontWeightMap[fontWeight] : null,
    };
  }

  function buildStatus(name: string, base: string) {
    return {
      [name]: getColor(base),
      [name + ".background"]: mix(getColor(base), getColor("island.background"), 0.2),
      [name + ".border"]: mix(getColor(base), getColor("island.background"), 0.4),
    };
  }

  function buildPlayer(base: string) {
    return {
      cursor: getColor(base),
      background: getColor(base),
      selection: mix(getColor(base), getColor("island.background"), 0.4),
    };
  }

  const style: Zed.ThemeStyle = {
    "border": getColor("border"),
    "border.variant": getColor("border"),
    "border.focused": getColor("border.focused"),
    "border.selected": getColor("border.focused"),
    "border.transparent": getColor("Transparent"),
    "border.disabled": getColor("button.primary.border.disabled"),

    "elevated_surface.background": getColor("popup.goto.background"),
    "surface.background": getColor("popup.background"),
    "background": getColor("island.background"),

    "element.background": getColor("notification.moreButton.background.default"),
    "element.hover": getColor("notification.moreButton.background.hovered"),
    "element.active": getColor("notification.moreButton.background.pressed"),
    "element.selected": getColor("listItem.background.selected"),
    "element.disabled": getColor("listItem.background.default"),

    "drop_target.background": getColor("dragAndDrop.background"),

    "ghost_element.background": getColor("ghostButton.off.background.default"),
    "ghost_element.hover": getColor("ghostButton.off.background.hovered"),
    "ghost_element.active": getColor("ghostButton.off.background.pressed"),
    "ghost_element.selected": getColor("ghostButton.on.background.default"),
    "ghost_element.disabled": getColor("ghostButton.off.background.disabled"),

    "text": getColor("text.primary"),
    "text.muted": getColor("text.secondary"),
    "text.placeholder": getColor("inputField.hint.default"),
    "text.disabled": getColor("text.disabled"),
    "text.accent": getColor("link.text.default"),

    "icon": getColor("text.primary"),
    "icon.muted": getColor("text.secondary"),
    "icon.disabled": getColor("text.disabled"),
    "icon.placeholder": getColor("text.tertiary"),
    "icon.accent": getColor("text.bright"),

    "status_bar.background": getColor("background.primary"),
    "title_bar.background": getColor("background.primary"),
    "title_bar.inactive_background": getColor("background.secondary"),
    "toolbar.background": getColor("island.background"),
    "tab_bar.background": getColor("background.primary"),
    "tab.inactive_background": getColor("background.primary"),
    "tab.active_background": getColor("island.background"),
    "search.match_background": getColor("search.match.background"),
    "panel.background": getColor("island.background"),
    "panel.focused_border": getColor("border.focused"),
    "pane.focused_border": getColor("border.focused"),

    "scrollbar.thumb.background": getColor("scrollbar.thumb.default"),
    "scrollbar.thumb.hover_background": getColor("scrollbar.thumb.hovered"),
    "scrollbar.thumb.border": getColor("Transparent"),
    "scrollbar.track.background": getColor("scrollbar.track.default"),
    "scrollbar.track.border": getColor("Transparent"),

    "editor.foreground": getColor("text.primary"),
    "editor.background": getColor("island.background"),
    "editor.gutter.background": getColor("island.background"),
    "editor.subheader.background": getColor("notification.moreButton.background.default"),
    "editor.active_line.background": getColor("editor.currentLine.background.focused"),
    "editor.highlighted_line.background": getColor("editor.currentLine.background.focused"),
    "editor.line_number": getColor("editor.lineNumber.default"),
    "editor.active_line_number": getColor("editor.lineNumber.current"),
    "editor.hover_line_number": getColor("editor.lineNumber.current"),
    "editor.invisible": getColor("editor.whitespaceIndicator"),
    "editor.wrap_guide": getColor("editor.indentGuide"),
    "editor.active_wrap_guide": getColor("editor.indentGuide.current"),
    "editor.document_highlight.read_background": getColor("editor.currentLine.background.focused"),
    "editor.document_highlight.write_background": getColor("editor.currentLine.background.focused"),

    "terminal.background": getColor("island.background"),
    "terminal.foreground": getColor("text.primary"),
    "terminal.bright_foreground": getColor("text.bright"),
    "terminal.dim_foreground": getColor("text.tertiary"),
    "terminal.ansi.black": mix(getColor("terminal.ansiColors.foreground.ansiWhite"), getColor("text.primary"), 0.75),
    "terminal.ansi.bright_black": mix(getColor("terminal.ansiColors.foreground.ansiBrightWhite"), getColor("text.primary"), 0.75),
    "terminal.ansi.dim_black": mix(getColor("terminal.ansiColors.background.ansiWhite"), getColor("text.primary"), 0.75),
    "terminal.ansi.red": getColor("terminal.ansiColors.foreground.ansiRed"),
    "terminal.ansi.bright_red": getColor("terminal.ansiColors.foreground.ansiBrightRed"),
    "terminal.ansi.dim_red": getColor("terminal.ansiColors.background.ansiRed"),
    "terminal.ansi.green": getColor("terminal.ansiColors.foreground.ansiGreen"),
    "terminal.ansi.bright_green": getColor("terminal.ansiColors.foreground.ansiBrightGreen"),
    "terminal.ansi.dim_green": getColor("terminal.ansiColors.background.ansiGreen"),
    "terminal.ansi.yellow": getColor("terminal.ansiColors.foreground.ansiYellow"),
    "terminal.ansi.bright_yellow": getColor("terminal.ansiColors.foreground.ansiBrightYellow"),
    "terminal.ansi.dim_yellow": getColor("terminal.ansiColors.background.ansiYellow"),
    "terminal.ansi.blue": getColor("terminal.ansiColors.foreground.ansiBlue"),
    "terminal.ansi.bright_blue": getColor("terminal.ansiColors.foreground.ansiBrightBlue"),
    "terminal.ansi.dim_blue": getColor("terminal.ansiColors.background.ansiBlue"),
    "terminal.ansi.magenta": getColor("terminal.ansiColors.foreground.ansiMagenta"),
    "terminal.ansi.bright_magenta": getColor("terminal.ansiColors.foreground.ansiBrightMagenta"),
    "terminal.ansi.dim_magenta": getColor("terminal.ansiColors.background.ansiMagenta"),
    "terminal.ansi.cyan": getColor("terminal.ansiColors.foreground.ansiCyan"),
    "terminal.ansi.bright_cyan": getColor("terminal.ansiColors.foreground.ansiBrightCyan"),
    "terminal.ansi.dim_cyan": getColor("terminal.ansiColors.background.ansiCyan"),
    "terminal.ansi.white": getColor("terminal.ansiColors.foreground.ansiBlack"),
    "terminal.ansi.bright_white": mix(getColor("terminal.ansiColors.foreground.ansiBrightBlack"), getColor("text.primary"), 0.5),
    "terminal.ansi.dim_white": mix(getColor("terminal.ansiColors.background.ansiBlack"), getColor("text.primary"), 0.5),

    "link_text.hover": getColor("link.text.default"),

    "version_control.added": getColor("editor.gitDiff.background.added"),
    "version_control.modified": getColor("editor.gitDiff.background.modified"),
    "version_control.deleted": getColor("editor.gitDiff.background.deleted"),

    ...buildStatus("conflict", getColor("Red_100")),
    ...buildStatus("created", getColor("editor.gitDiff.text.added")),
    ...buildStatus("deleted", getColor("editor.gitDiff.text.deleted")),
    ...buildStatus("error", getColor("Red_100")),
    ...buildStatus("hidden", getColor("text.tertiary")),
    ...buildStatus("hint", getColor("text.tertiary")),
    ...buildStatus("ignored", getColor("text.tertiary")),
    ...buildStatus("info", getColor("Blue_110")),
    ...buildStatus("modified", getColor("editor.gitDiff.text.modified")),
    ...buildStatus("predictive", getColor("text.tertiary")),
    ...buildStatus("renamed", getColor("Blue_100")),
    ...buildStatus("success", getColor("Green_100")),
    ...buildStatus("unreachable", getColor("text.tertiary")),
    ...buildStatus("warning", getColor("Yellow_100")),

    "players": [
      {
        cursor: getColor("text.primary"),
        background: getColor("background.primary"),
        selection: getColor("editor.selection.focused"),
      },
      buildPlayer("remote.userColor.background.one"),
      buildPlayer("remote.userColor.background.two"),
      buildPlayer("remote.userColor.background.three"),
      buildPlayer("remote.userColor.background.four"),
      buildPlayer("remote.userColor.background.five"),
      buildPlayer("remote.userColor.background.six"),
      buildPlayer("remote.userColor.background.seven"),
      buildPlayer("remote.userColor.background.eight"),
    ],

    "syntax": {
      "attribute": getHighlight("attributeName.html"),
      "boolean": getHighlight("boolean"),
      "comment": getHighlight("comment"),
      "comment.doc": getHighlight("comment.doc"),
      "constant": getHighlight("identifier.constant"),
      "constructor": getHighlight("identifier.type.class"),
      "emphasis": getHighlight("markup.italic"),
      "emphasis.strong": getHighlight("markup.bold"),
      "enum": getHighlight("identifier.type.enum"),
      "function": getHighlight("identifier.function.call"),
      "function.definition": getHighlight("identifier.function.declaration"),
      "function.special": getHighlight("metadata"),
      "hint": getHighlight("problem.info"),
      "keyword": getHighlight("keyword"),
      "label": getHighlight("identifier.other"),
      "link_uri": getHighlight("link.text.default"),
      "number": getHighlight("number"),
      "operator": getHighlight("punctuation.operator"),
      "preproc": getHighlight("metadata"),
      "property": getHighlight("identifier.field"),
      "punctuation": getHighlight("punctuation"),
      "punctuation.bracket": getHighlight("punctuation"),
      "punctuation.delimiter": getHighlight("punctuation"),
      "punctuation.list_marker": getHighlight("punctuation"),
      "punctuation.special": getHighlight("punctuation"),
      "string": getHighlight("string"),
      "string.escape": getHighlight("string.escape"),
      "string.regex": getHighlight("string.regexp"),
      "string.special": getHighlight("string.formatItem"),
      "string.special.symbol": getHighlight("string.escape.alternative"),
      "tag": getHighlight("tagName.html"),
      "text.literal": getHighlight("markup.code.block"),
      "title": getHighlight("markup.heading"),
      "type": getHighlight("identifier.type"),
      "variable": getHighlight("identifier.variable"),
      "variable.special": getHighlight("identifier.variable.mutable"),
      "variant": getHighlight("identifier.type.valueType"),
    },
  };

  return {
    name,
    appearance,
    style,
  };
}

const dirPath = Deno.args[0];

if (!dirPath) {
  console.error("Please provide a directory path as an argument");
  Deno.exit(1);
}

try {
  const fleetThemes: Fleet.Theme[] = [];

  for await (const entry of Deno.readDir(dirPath)) {
    if (!entry.name.endsWith(".json")) continue;
    const themePath = `${dirPath}/${entry.name}`;
    const themeContent = await Deno.readTextFile(themePath);
    const theme = JSON.parse(themeContent) as Fleet.Theme;
    fleetThemes.push(theme);
  }

  const themes = fleetThemes.map(importFleetTheme);

  const family: Zed.ThemeFamily = {
    $schema: "https://zed.dev/schema/themes/v0.2.0.json",
    name: "Fleet Themes",
    author: "Lihuen Molina",
    themes,
  };

  const output = JSON.stringify(family, null, 2);

  await Deno.writeTextFile("./themes/fleet.json", output);

  if (Deno.build.os == "darwin") {
    const home = Deno.env.get("HOME")!;
    console.log(home);
    await Deno.writeTextFile(`${home}/.config/zed/themes/fleet.json`, output);
  }
} catch (error) {
  console.error(error);
  Deno.exit(1);
}
