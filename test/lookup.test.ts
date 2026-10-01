import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { lookup as full } from '../src/full.js';
import { BRANDS, formatPhone, lookup, parsePhone, updated } from '../src/index.js';

describe('parsePhone', () => {
  it.each([
    ['+7 912 345-67-89', '9123456789'],
    ['8 (912) 345-67-89', '9123456789'],
    ['79123456789', '9123456789'],
    ['9123456789', '9123456789'],
    ['+7.912.345.67.89', '9123456789'],
    [' +7 (495) 123 45 67 ', '4951234567'],
    ['8 800 555 35 35', '8005553535'],
  ])('%s → %s', (input, national) => {
    expect(parsePhone(input)).toBe(national);
  });

  it.each(['', '123', '+1 212 555 0100', '+8 912 345 67 89', '89123456', '891234567890', '+7 112 345 67 89', 'abc', '+7 912 345 67 8x'])('rejects %j', (input) => {
    expect(parsePhone(input)).toBeNull();
    expect(lookup(input)).toBeNull();
  });

  it('formats numbers', () => {
    expect(formatPhone('89123456789')).toBe('+7 912 345-67-89');
    expect(formatPhone('nope')).toBeNull();
  });
});

describe('lookup', () => {
  it('finds big operators by brand', () => {
    expect(lookup('+7 916 123-45-67')?.operator.brand?.id).toBe('mts');
    expect(lookup('+7 903 123-45-67')?.operator.brand?.id).toBe('beeline');
    expect(lookup('+7 900 123-45-67')?.operator.brand?.id).toBe('t2');
    expect(lookup('+7 999 123-45-67')?.operator.brand?.id).toBe('yota');
  });

  it('returns the full record', () => {
    expect(lookup('8 (916) 123-45-67')).toEqual({
      number: '+79161234567',
      national: '9161234567',
      code: '916',
      type: 'mobile',
      operator: { name: 'ПАО "Мобильные ТелеСистемы"', inn: '7740000076', brand: { id: 'mts', name: 'МТС' } },
      region: 'Город Москва, Московская область',
      locality: null,
    });
  });

  it('keeps landlines out of the default entry point', () => {
    expect(lookup('+7 495 123-45-67')).toBeNull();
    expect(full('+7 495 123-45-67')).toMatchObject({ type: 'landline', region: 'Город Москва' });
    expect(full('8 800 555 35 35')).toMatchObject({ type: 'landline', region: 'Российская Федерация' });
  });

  it('agrees between entry points on mobile numbers', () => {
    for (const number of ['9161234567', '9031234567', '9001234567', '9581234567', '9781234567']) {
      expect(full(number)).toEqual(lookup(number));
    }
  });

  it('has brands only for known operators', () => {
    for (const [inn, brand] of Object.entries(BRANDS)) {
      expect(inn).toMatch(/^\d{10}$/);
      expect(brand.name).not.toBe('');
    }
  });

  it('knows its snapshot date', () => {
    expect(updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

const REGISTRY = process.env['PHONEOPERATOR_CSV'] ?? '.registry';

describe.runIf(existsSync(`${REGISTRY}/DEF-9xx.csv`))('every registry row', () => {
  it.each(['DEF-9xx', 'ABC-3xx', 'ABC-4xx', 'ABC-8xx'])('%s matches the bundled data', (name) => {
    const lines = readFileSync(`${REGISTRY}/${name}.csv`, 'utf8').split(/\r?\n/).slice(1).filter(Boolean);
    let checked = 0;
    for (const line of lines) {
      const [code = '', from = '', to = '', , , , territory = '', inn = ''] = line.split(';');
      const region = territory.split('|').at(-1)?.trim();
      for (const suffix of new Set([from, to, String(Math.floor((Number(from) + Number(to)) / 2)).padStart(7, '0')])) {
        const info = full(code + suffix);
        if (info?.operator.inn !== inn || info.region !== region) throw new Error(`${name} ${code}${suffix}: expected ${inn} ${region}, got ${info?.operator.inn} ${info?.region}`);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(lines.length);
  });
});
