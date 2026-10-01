export type BrandId =
  | 'mts'
  | 'megafon'
  | 'beeline'
  | 't2'
  | 'yota'
  | 't-mobile'
  | 'sber-mobile'
  | 'alfa-mobile'
  | 'vtb-mobile'
  | 'motiv'
  | 'win-mobile'
  | 'volna'
  | 'rostelecom'
  | 'mtt';

export interface Brand {
  readonly id: BrandId;
  readonly name: string;
}

export const BRANDS: Readonly<Record<string, Brand>> = {
  '7740000076': { id: 'mts', name: 'МТС' },
  '7812014560': { id: 'megafon', name: 'МегаФон' },
  '7713076301': { id: 'beeline', name: 'Билайн' },
  '7743895280': { id: 't2', name: 'T2' },
  '7701725181': { id: 'yota', name: 'Yota' },
  '7743200179': { id: 't-mobile', name: 'Т-Мобайл' },
  '7736264044': { id: 'sber-mobile', name: 'СберМобайл' },
  '9725152215': { id: 'alfa-mobile', name: 'Альфа-Мобайл' },
  '9705121882': { id: 'vtb-mobile', name: 'ВТБ Мобайл' },
  '6661079603': { id: 'motiv', name: 'Мотив' },
  '2308210371': { id: 'win-mobile', name: 'Win mobile' },
  '7718999159': { id: 'volna', name: 'Волна мобайл' },
  '7707049388': { id: 'rostelecom', name: 'Ростелеком' },
  '7705017253': { id: 'mtt', name: 'МТТ' },
};
