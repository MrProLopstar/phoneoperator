/**
 * Mobile and landline numbers together. Same API as `phoneoperator`, with the landline registry
 * (3xx, 4xx, 8xx) included, about 640 KB gzipped.
 *
 * ```ts
 * import { lookup } from 'phoneoperator/full';
 *
 * lookup('+7 812 123-45-67')?.locality;
 * ```
 *
 * @module
 */
import * as landline from './data/landline.js';
import * as mobile from './data/mobile.js';
import { createLookup, type PhoneInfo } from './lookup.js';

export { BRANDS, type Brand, type BrandId } from './brands.js';
export { formatPhone, parsePhone, type Operator, type PhoneInfo, type PhoneType } from './lookup.js';

/** Date of the bundled registry snapshot, `YYYY-MM-DD`. */
export const updated: string = mobile.UPDATED > landline.UPDATED ? mobile.UPDATED : landline.UPDATED;

/**
 * Looks up a mobile or landline phone number. Returns `null` for invalid input and unassigned ranges.
 *
 * @example
 * ```ts
 * lookup('84951234567')?.type; // 'landline'
 * ```
 */
export const lookup: (input: string) => PhoneInfo | null = createLookup([
  { type: 'mobile', operators: mobile.OPERATORS, places: mobile.PLACES, ranges: mobile.RANGES },
  { type: 'landline', operators: landline.OPERATORS, places: landline.PLACES, ranges: landline.RANGES },
]);
