/* IMPORT */

import * as _ from "lodash";
import * as vscode from "vscode";
import RegexesDefaults from "./config_regexes_defaults";

const oneDay: number = 1000 * 60 * 60 * 24;
const strikethrouhg: string = "[^~]";
const prefix: string = `(${strikethrouhg}`;
const postfix: string = `${strikethrouhg})`;

const pad2Zero = function (n: number): string {
  return String(n).padStart(2, "0");
};

const formatDate = function (dt: Date) {
  return `${dt.getFullYear()}-${pad2Zero(dt.getMonth() + 1)}-${pad2Zero(
    dt.getDate()
  )}`;
};

const getNDaysLater = function (dt: Date, n: number): Date {
  const futureDate = new Date(dt.getTime() + oneDay * n);
  return futureDate;
};

const getNDaysLaterDay = function (dt: Date, n: number): number {
  const futureDay = getNDaysLater(dt, n).getDay();
  return futureDay;
};

const onePlace = function (n: number): number {
  return n % 10;
};
const lastOnePlace = function (n: number): number {
  return onePlace(n - 1);
};
const lastTenPlace = function (n: number): number {
  return Math.floor(((n - 1) / 10) % 10);
};

const getPastDateRegex = function (dt: Date): string {
  const dtYear = dt.getFullYear();
  const dtMonth = dt.getMonth() + 1;
  const dtDate = dt.getDate();
  let dateRegex: string = `${prefix}(`;
  // 年（2000～2100年）
  dateRegex += `(20[0-${lastTenPlace(dtYear) - 1}]\\d|20${lastTenPlace(
    dtYear
  )}[0-${lastOnePlace(dtYear)}])-\\d{2}-\\d{2}`;
  // 月
  if (dtMonth == 1) {
    // 1月
    // do nothing.
  } else if (dtMonth < 11) {
    // 2月～10月
    dateRegex += `|${dtYear}-0[1-${lastOnePlace(dtMonth)}]-\\d\\d`;
  } else {
    // 11月～
    dateRegex += `|${dtYear}-(0\\d|1[0-${lastOnePlace(dtMonth)}])-\\d\\d`;
  }
  // 日
  if (dtDate < 10) {
    // 1日～9日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-0[1-${onePlace(dtDate)}]`;
  } else if (dtDate < 20) {
    // 10日～19日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-(0\\d|1[0-${onePlace(
      dtDate
    )}])`;
  } else if (dtDate < 30) {
    // 20日～29日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-([01]\\d|2[0-${onePlace(
      dtDate
    )}])`;
  } else {
    // 30日～31日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-([0-2]\\d|3[0-${onePlace(
      dtDate
    )}])`;
  }
  dateRegex += `)${postfix}`;
  return dateRegex;
};

const getSerialDateRegex = function (
  dt: Date,
  start: number,
  end: number
): string {
  let dateRegex: string = `${prefix}(`;
  for (let i = start; i < end; i++) {
    if (i > start) dateRegex += "|";
    dateRegex += formatDate(getNDaysLater(dt, i));
  }
  dateRegex += `)${postfix}`;
  return dateRegex;
};

type Rgb = [number, number, number];
type Hsl = [number, number, number];

const RGBToHSL = (r: number, g: number, b: number): Hsl => {
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;
  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let diff = max - min;
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
    switch (max) {
      case r:
        h = (g - b) / diff + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / diff + 2;
        break;
      case b:
        h = (r - g) / diff + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
};

const HSLToRGB = (h: number, s: number, l: number): Rgb => {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [r * 255, g * 255, b * 255];
};

const RGBToHex = (r: number, g: number, b: number): string => {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(x).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
};

const hexToRGB = (hex: string): Rgb => {
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  return [r, g, b];
};

const getHexColor = (originalColor: string, target: number): string => {
  let rgb = hexToRGB(originalColor);
  let hsl = RGBToHSL(...rgb);
  hsl[0] += (target - 2) * 4;
  if (hsl[0] > 360) {
    hsl[0] -= 360;
  } else if (hsl[0] < 0) {
    hsl[0] += 360;
  }
  let newRGB = HSLToRGB(...hsl);
  let newColor = RGBToHex(...newRGB);
  return newColor;
};

const makeRegexesObj = function () {
  interface regexsClass {
    [prop: string]: any;
  }
  const regexesObj: regexsClass = {};
  const today: Date = new Date();
  const yesterday: Date = getNDaysLater(today, -1);
  regexesObj[getPastDateRegex(yesterday)] = {
    filterLanguageRegex: "Markdown",
    decorations: [
      {
        overviewRulerColor: "#ff0000",
        backgroundColor: "#ff0000",
        color: "#ffffff",
        fontWeight: "normal",
      },
    ],
  };
  regexesObj[`(${prefix}${formatDate(today)}${postfix})`] = {
    filterLanguageRegex: "Markdown",
    decorations: [
      {
        overviewRulerColor: "#ff4433",
        backgroundColor: "#ff4433",
        color: "#ffffff",
        fontWeight: "normal",
      },
    ],
  };
  let diff = 0;
  const DayOfTommorow = getNDaysLaterDay(today, 1);
  if (DayOfTommorow == 0) diff = 1;
  if (DayOfTommorow == 6) diff = 2;
  let start = 1;
  for (let end = 2 + diff; end < 80; end += start) {
    const color = getHexColor("#ff8080", end);
    regexesObj[getSerialDateRegex(today, start, end)] = {
      filterLanguageRegex: "Markdown",
      decorations: [
        {
          overviewRulerColor: color,
          backgroundColor: color,
          color: "#000000",
          fontWeight: "normal",
        },
      ],
    };
    start = end - start;
  }
  return regexesObj;
};

/* CONFIG */
const Config = {
  get(extension = "highlight") {
    const Config = vscode.workspace.getConfiguration().get(extension) as any;
    Config.regexes = makeRegexesObj();
    return Config;
  },

  init() {
    const config = Config.get();

    if (!_.isEmpty(config.regexes)) return;

    vscode.workspace
      .getConfiguration()
      .update(
        "highlight.regexes",
        RegexesDefaults,
        vscode.ConfigurationTarget.Global
      );
  },
};

/* EXPORT */

export default Config;
