/**
 * # phoneoperator
 *
 * Finds the operator and region of a Russian phone number offline, using the official numbering
 * registry of the Ministry of Digital Development. No dependencies, no network requests.
 *
 * ```ts
 * import { lookup } from 'phoneoperator';
 *
 * lookup('+7 912 345-67-89');
 * // { number: '+79123456789', type: 'mobile', operator: { name: 'ПАО "МТС"', brand: { id: 'mts', name: 'МТС' }, ... }, region: 'Свердловская область', ... }
 * ```
 *
 * This entry point covers mobile numbers (9xx). Landlines (3xx, 4xx, 8xx) are in `phoneoperator/full`,
 * which is about 15 times larger.
 *
 * The registry knows who a range was assigned to. A number ported to another operator keeps the
 * original operator here, because the portability database is not public.
 *
 * Документация на русском: https://github.com/MrProLopstar/phoneoperator/blob/main/README.ru.md
 *
 * @module
 */
import * as mobile from './data/mobile.js';
import { createLookup, type PhoneInfo } from './lookup.js';

export { BRANDS, type Brand, type BrandId } from './brands.js';
export { formatPhone, parsePhone, type Operator, type PhoneInfo, type PhoneType } from './lookup.js';

/** Date of the bundled registry snapshot, `YYYY-MM-DD`. */
export const updated: string = mobile.UPDATED;

/**
 * Looks up a mobile phone number. Returns `null` for invalid input, landlines and unassigned ranges.
 *
 * @example
 * ```ts
 * lookup('89123456789')?.operator.brand?.name; // 'МТС'
 * ```
 */
export const lookup: (input: string) => PhoneInfo | null = createLookup([
  { type: 'mobile', operators: mobile.OPERATORS, places: mobile.PLACES, ranges: mobile.RANGES },
]);
