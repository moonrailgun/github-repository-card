import { AxiosRequestConfig } from 'axios';
import wrap from 'word-wrap';
import axios from 'axios';

const ERROR_CARD_LENGTH = 576.5;

/**
 * Renders error message on the card.
 *
 * @param message Main error message.
 * @param secondaryMessage The secondary error message.
 * @returns The SVG markup.
 */
export const renderError = (message: string, secondaryMessage = ''): string => {
  return `
    <svg width="${ERROR_CARD_LENGTH}" height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    <style>
    .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: #2F80ED }
    .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: #252525 }
    .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${
      ERROR_CARD_LENGTH - 1
    }" height="99%" rx="4.5" fill="#FFFEFE" stroke="#E4E2E2"/>
    <text x="25" y="45" class="text">Something went wrong! file an issue at moonrailgun/github-repository-card</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
    </text>
    </svg>
  `;
};

export function encodeHTML(str: string) {
  return str
    .replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
      return '&#' + i.charCodeAt(0) + ';';
    })
    .replace(/\u0008/gim, '');
}

const SECONDARY_ERROR_MESSAGES = {
  MAX_RETRY:
    'Please add an env variable called PAT_1 with your github token in vercel',
  USER_NOT_FOUND: 'Make sure the provided username is not an organization',
  GRAPHQL_ERROR: 'Please try again later',
  WAKATIME_USER_NOT_FOUND: 'Make sure you have a public WakaTime profile',
};

/**
 * Custom error class to handle custom GRS errors.
 */
export class CustomError extends Error {
  type;
  secondaryMessage;

  /**
   * @param {string} message Error message.
   * @param {string} type Error type.
   */
  constructor(message: string, type: string) {
    super(message);
    this.type = type;
    // @ts-ignore
    this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
  }

  static MAX_RETRY = 'MAX_RETRY';
  static USER_NOT_FOUND = 'USER_NOT_FOUND';
  static GRAPHQL_ERROR = 'GRAPHQL_ERROR';
  static WAKATIME_ERROR = 'WAKATIME_ERROR';
}

/**
 * Missing query parameter class.
 */
export class MissingParamError extends Error {
  /**
   * Missing query parameter error constructor.
   *
   * @param missedParams An array of missing parameters names.
   * @param secondaryMessage Optional secondary message to display.
   */
  constructor(public missedParams: string[], public secondaryMessage?: string) {
    const msg = `Missing params ${missedParams
      .map((p) => `"${p}"`)
      .join(', ')} make sure you pass the parameters in URL`;
    super(msg);
  }
}

/**
 * Clamp the given number between the given range.
 *
 * @param {number} number The number to clamp.
 * @param {number} min The minimum value.
 * @param {number} max The maximum value.
 * @returns {number} The clamped number.
 */
export const clampValue = (
  number: number,
  min: number,
  max: number
): number => {
  // @ts-ignore
  if (Number.isNaN(parseInt(number))) {
    return min;
  }
  return Math.max(min, Math.min(number, max));
};

export const CONSTANTS = {
  THIRTY_MINUTES: 1800,
  TWO_HOURS: 7200,
  FOUR_HOURS: 14400,
  ONE_DAY: 86400,
};

/**
 * Returns boolean if value is either "true" or "false" else the value as it is.
 *
 * @param {string | boolean} value The value to parse.
 * @returns {boolean | undefined } The parsed value.
 */
export const parseBoolean = (value: any): boolean | undefined => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true') {
      return true;
    } else if (value.toLowerCase() === 'false') {
      return false;
    }
  }
  return undefined;
};

/**
 * Parse string to array of strings.
 *
 * @param {string} str The string to parse.
 * @returns {string[]} The array of strings.
 */
export const parseArray = (str: any): string[] => {
  if (!str) return [];
  return str.split(',');
};

export const parseString = (input: any): string => {
  if (!input) {
    return '';
  }

  return String(input);
};

const noop = () => {};
// return console instance based on the environment
export const logger =
  process.env.NODE_ENV !== 'test' ? console : { log: noop, error: noop };

/**
 * Send GraphQL request to GitHub API.
 *
 * @param data Request data.
 * @param headers Request headers.
 * @returns Request response.
 */
export const request = (
  data: AxiosRequestConfig['data'],
  headers: AxiosRequestConfig['headers']
) => {
  // @ts-ignore
  return axios({
    url: 'https://api.github.com/graphql',
    method: 'post',
    headers,
    data,
  });
};

/**
 * Split text over multiple lines based on the card width.
 *
 * @param {string} text Text to split.
 * @param {number} width Line width in number of characters.
 * @param {number} maxLines Maximum number of lines.
 * @returns {string[]} Array of lines.
 */
export const wrapTextMultiline = (text: string, width = 59, maxLines = 3) => {
  const fullWidthComma = '，';
  const encoded = encodeHTML(text);
  const isChinese = encoded.includes(fullWidthComma);

  let wrapped = [];

  if (isChinese) {
    wrapped = encoded.split(fullWidthComma); // Chinese full punctuation
  } else {
    wrapped = wrap(encoded, {
      width,
    }).split('\n'); // Split wrapped lines to get an array of lines
  }

  const lines = wrapped.map((line) => line.trim()).slice(0, maxLines); // Only consider maxLines lines

  // Add "..." to the last line if the text exceeds maxLines
  if (wrapped.length > maxLines) {
    lines[maxLines - 1] += '...';
  }

  // Remove empty lines if text fits in less than maxLines lines
  const multiLineText = lines.filter(Boolean);
  return multiLineText;
};
