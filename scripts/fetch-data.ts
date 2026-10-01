import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

interface Row {
  readonly start: number;
  readonly end: number;
  readonly name: string;
  readonly inn: string;
  readonly place: string;
}

interface Dataset {
  readonly file: string;
  readonly sources: readonly string[];
  readonly minRows: number;
}

const SOURCE = 'https://opendata.digital.gov.ru/downloads/';
const LOCAL = process.argv[2];
const CACHE = '.registry';

const DATASETS: readonly Dataset[] = [
  { file: 'src/data/mobile.ts', sources: ['DEF-9xx'], minRows: 10_000 },
  { file: 'src/data/landline.ts', sources: ['ABC-3xx', 'ABC-4xx', 'ABC-8xx'], minRows: 300_000 },
];

const REQUIRED_INN: readonly string[] = ['7740000076', '7812014560', '7713076301', '7743895280'];

const download = async (name: string): Promise<string> => {
  if (LOCAL) return readFileSync(`${LOCAL}/${name}.csv`, 'utf8');
  const response = await fetch(`${SOURCE}${name}.csv`, { headers: { 'user-agent': 'Mozilla/5.0 phoneoperator' } });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const text = await response.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(`${CACHE}/${name}.csv`, text);
  return text;
};

const place = (locality: string, territory: string): string => {
  const region = territory.split('|').at(-1)?.trim() ?? '';
  const parts = locality.split('|');
  const town = parts.length > 1 ? parts[0]?.trim() ?? '' : '';
  return town && town !== region ? `${town}|${region}` : region;
};

const parse = (name: string, text: string): Row[] => {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter(Boolean);
  if (!lines[0]?.startsWith('АВС/ DEF;От;До;Емкость;Оператор;Регион;Территория ГАР;ИНН')) throw new Error(`${name}: unexpected header ${lines[0]}`);
  return lines.slice(1).map((line, index) => {
    const [code, from, to, capacity, operator, locality, territory, inn] = line.split(';');
    if (!code || !from || !to || !operator || locality === undefined || territory === undefined || inn === undefined) throw new Error(`${name}:${index + 2}: malformed row`);
    const start = Number(code + from);
    const end = Number(code + to);
    if (!/^\d{3}$/.test(code) || !/^\d{7}$/.test(from) || !/^\d{7}$/.test(to) || end < start || end - start + 1 !== Number(capacity)) {
      throw new Error(`${name}:${index + 2}: bad range ${code} ${from}-${to} (${capacity})`);
    }
    return { start, end, name: operator.trim(), inn: inn.trim(), place: place(locality, territory) };
  });
};

const build = (rows: Row[]): string => {
  rows.sort((a, b) => a.start - b.start);
  const capacity = new Map<string, Map<string, number>>();
  for (const row of rows) {
    const names = capacity.get(row.inn) ?? new Map<string, number>();
    names.set(row.name, (names.get(row.name) ?? 0) + row.end - row.start + 1);
    capacity.set(row.inn, names);
  }
  for (const inn of REQUIRED_INN) if (!capacity.has(inn)) throw new Error(`operator ${inn} is missing, refusing to write suspicious data`);

  const operators = [...capacity].map(([inn, names]) => [inn, [...names].sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''] as const).sort((a, b) => a[0].localeCompare(b[0]));
  const operatorIndex = new Map(operators.map(([inn], index) => [inn, index]));
  const places = [...new Set(rows.map((row) => row.place))].sort((a, b) => a.localeCompare(b, 'ru'));
  const placeIndex = new Map(places.map((value, index) => [value, index]));

  const merged: { start: number; end: number; operator: number; place: number }[] = [];
  for (const row of rows) {
    const operator = operatorIndex.get(row.inn) ?? -1;
    const where = placeIndex.get(row.place) ?? -1;
    const last = merged.at(-1);
    if (last && row.start <= last.end) throw new Error(`overlapping ranges at ${row.start}`);
    if (last && last.end + 1 === row.start && last.operator === operator && last.place === where) last.end = row.end;
    else merged.push({ start: row.start, end: row.end, operator, place: where });
  }

  let previous = -1;
  const ranges = merged.map((range) => {
    const encoded = [range.start - previous - 1, range.end - range.start, range.operator, range.place].map((value) => value.toString(36)).join(',');
    previous = range.end;
    return encoded;
  }).join(';');

  return [
    `export const OPERATORS: readonly (readonly [inn: string, name: string])[] = ${JSON.stringify(operators)};`,
    `export const PLACES: readonly string[] = ${JSON.stringify(places)};`,
    `export const RANGES: string = ${JSON.stringify(ranges)};`,
  ].join('\n');
};

for (const dataset of DATASETS) {
  const rows = (await Promise.all(dataset.sources.map(async (name) => parse(name, await download(name))))).flat();
  if (rows.length < dataset.minRows) throw new Error(`${dataset.file}: only ${rows.length} rows, refusing to write suspicious data`);
  const body = build(rows);
  const previous = existsSync(dataset.file) ? readFileSync(dataset.file, 'utf8') : '';
  if (previous.slice(previous.indexOf('\n') + 1) === `${body}\n`) {
    console.log(`${dataset.file}: up to date`);
    continue;
  }
  writeFileSync(dataset.file, `export const UPDATED: string = '${new Date().toISOString().slice(0, 10)}';\n${body}\n`);
  console.log(`${dataset.file}: ${rows.length} rows written`);
}
