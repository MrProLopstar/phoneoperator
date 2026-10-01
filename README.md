# phoneoperator

[![npm](https://img.shields.io/npm/v/phoneoperator?color=0e7c66)](https://www.npmjs.com/package/phoneoperator)
[![JSR](https://jsr.io/badges/@mrprolopstar/phoneoperator)](https://jsr.io/@mrprolopstar/phoneoperator)

[Русская версия](README.ru.md) · [Playground](https://mrprolopstar.github.io/phoneoperator/)

Operator and region of a Russian phone number, offline. The data is the official numbering registry of the Ministry of Digital Development, bundled into the package and refreshed every week. No dependencies, no network requests, works in Node, Deno, Bun and browsers.

```sh
npm install phoneoperator
```

```ts
import { lookup } from 'phoneoperator';

lookup('+7 916 123-45-67');
// {
//   number: '+79161234567',
//   national: '9161234567',
//   code: '916',
//   type: 'mobile',
//   operator: { name: 'ПАО "Мобильные ТелеСистемы"', inn: '7740000076', brand: { id: 'mts', name: 'МТС' } },
//   region: 'Город Москва, Московская область',
//   locality: null
// }

lookup('8 (999) 123-45-67')?.operator.brand?.name; // 'Yota'
lookup('+1 212 555 0100');                         // null
```

## Mobile and landline

The default entry point covers mobile numbers (9xx), about 45 KB gzipped. Landlines (3xx, 4xx, 8xx) add 433 thousand ranges and about 640 KB, so they live in a separate entry point with the same API:

```ts
import { lookup } from 'phoneoperator/full';

lookup('+7 495 123-45-67'); // { type: 'landline', operator: { name: 'ПАО "Ростелеком"', ... }, region: 'Город Москва', ... }
lookup('8 800 555 35 35');  // { type: 'landline', region: 'Российская Федерация', ... }
```

For landlines `locality` holds the town when the registry names one.

## API

| Function | Result |
|---|---|
| `lookup(input)` | `PhoneInfo` or `null` for invalid input and unassigned ranges |
| `parsePhone(input)` | 10 national digits or `null`; accepts `+7`, `7`, `8` and the usual separators |
| `formatPhone(input)` | `'+7 912 345-67-89'` or `null` |
| `BRANDS` | Brand by operator INN: МТС, МегаФон, Билайн, T2, Yota, Т-Мобайл, СберМобайл and others |
| `updated` | Date of the bundled registry snapshot |

`operator.brand` is `null` for operators without a consumer brand; `operator.name` and `operator.inn` are always the legal entity from the registry.

## Ported numbers

The registry says who a number range was assigned to. Since 2013 a number can move to another operator, and the database of ported numbers is not public, so for a ported number `lookup` returns the original operator. Region does not change with porting.

## Data

Every week the registry is downloaded, checked (header, every range against its capacity, no overlaps, the big four operators present), compressed and compared with the bundled copy. If it changed, the tests run, including a check of three numbers from every one of the 450 thousand registry rows, and a new minor version is published to npm automatically.

## License

MIT. Registry data: [opendata.digital.gov.ru](https://opendata.digital.gov.ru/registry/numeric).
