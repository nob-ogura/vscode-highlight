
/* IMPORT */

import * as _ from 'lodash';
import * as vscode from 'vscode';
import RegexesDefaults from './config_regexes_defaults';

const oneDay: number = (1000 * 60 * 60 * 24)

const pad2Zero = function(n: number): string {return String(n).padStart(2, "0")}

const formatDate = function(dt: Date) { return `${dt.getFullYear()}-${pad2Zero(dt.getMonth() + 1)}-${pad2Zero(dt.getDate())}`}

const getNDaysLater = function(dt: Date, n: number): Date {
  const futureDate = new Date(dt.getTime() + (oneDay * n))
  return futureDate;
}

const onePlace = function (n: number): number {return n % 10}
const lastOnePlace = function (n: number): number {return onePlace(n - 1)}
const lastTenPlace = function (n: number): number {return Math.floor(((n - 1) / 10) % 10)}

const getPastDateRegex = function(dt: Date): string {
  const dtYear = dt.getFullYear()
  const dtMonth = dt.getMonth() + 1
  const dtDate = dt.getDate()
  let dateRegex: string = "("
  // 年（～2100年）
  dateRegex += `(1\\d{3}|20[0-${lastTenPlace(dtYear) - 1}]\\d|20${lastTenPlace(dtYear)}[0-${lastOnePlace(dtYear)}])-\\d{2}-\\d{2}`
  // 月
  if (dtMonth == 1) {
    // 1月
    // do nothing.
  } else if (dtMonth < 11) {
    // 2月～10月
    dateRegex += `|${dtYear}-0[1-${lastOnePlace(dtMonth)}]-\\d\\d`
  } else {
    // 11月～
    dateRegex += `|${dtYear}-(0\\d|1[0-${lastOnePlace(dtMonth)}])-\\d\\d`
  }
  // 日
  if (dtMonth == 1) {
    // 1日
    // do nothing.
  } else if (dtMonth < 11) {
    // 2日～10日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-0[1-${onePlace(dtDate)}]`
  } else if (dtMonth < 21) {
    // 11日～20日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-(0\\d|1[0-${onePlace(dtDate)}]`
  } else if (dtMonth < 31) {
    // 21日～30日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-([01]\\d|2[0-${onePlace(dtDate)}]`
  } else {
    // 31日
    dateRegex += `|${dtYear}-${pad2Zero(dtMonth)}-([0-2]\\d|3[0-${onePlace(dtDate)}]`
  }
  dateRegex += ")"
  return dateRegex
}

const getSerialDateRegex = function(dt: Date, start: number, end: number): string {
  let dateRegex: string = "("
  for (let i = start; i < end; i++) {
    if (i > start) dateRegex += "|"
    dateRegex += formatDate(getNDaysLater(dt, i))
  }
  dateRegex += ")"
  return dateRegex
}

const makeRegexesObj = function() {
  interface regexsClass {
    [prop: string]: any
  }
  const regexesObj : regexsClass = {}
  const dt: Date = new Date()
  regexesObj[getPastDateRegex(dt)] = {
    filterLanguageRegex: "Markdown",
    decorations: [
      {
        "overviewRulerColor": "#ff0000",
        "backgroundColor": "#ff0000",
        "color": "#ffffff",
        "fontWeight": "bold",
      },
    ],
  }
  regexesObj[getSerialDateRegex(dt, 1, 5)] = {
    filterLanguageRegex: "Markdown",
    decorations: [
      {
        "overviewRulerColor": "#ffcc00",
        "backgroundColor": "#ffcc00",
        "color": "#1f1f1f",
        "fontWeight": "normal",
      },
    ],
  }
  regexesObj[getSerialDateRegex(dt, 5, 15)] = {
    filterLanguageRegex: "Markdown",
    decorations: [
      {
        "overviewRulerColor": "#00ff00",
        "backgroundColor": "#00ff00",
        "color": "#1f1f1f",
        "fontWeight": "normal",
      },
    ],
  }
  return regexesObj
}

/* CONFIG */
const Config = {

  get ( extension = 'highlight' ) {

    const Config = vscode.workspace.getConfiguration ().get ( extension ) as any;
    Config.regexes = makeRegexesObj()
    return Config;

  },

  init () {

    const config = Config.get ();

    if ( !_.isEmpty ( config.regexes ) ) return;

    vscode.workspace.getConfiguration ().update ( 'highlight.regexes', RegexesDefaults, vscode.ConfigurationTarget.Global );

  }

};

/* EXPORT */

export default Config;
