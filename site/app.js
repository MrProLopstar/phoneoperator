import { formatPhone, lookup, parsePhone, updated } from './lib/index.js';

const EXAMPLES = ['+7 916 123-45-67', '8 (903) 555-12-34', '+7 999 000 11 22', '8 958 100 00 00', '+7 495 123-45-67', '8 800 555 35 35'];
const TYPES = { mobile: 'мобильный', landline: 'стационарный' };

const $ = (id) => document.getElementById(id);
const input = $('phone');
let full = null;

const show = (info) => {
  $('result').hidden = !info;
  if (!info) return;
  $('brand').textContent = info.operator.brand?.name ?? info.operator.name;
  $('formatted').textContent = formatPhone(info.national);
  $('type').textContent = TYPES[info.type];
  $('name').textContent = info.operator.name;
  $('inn').textContent = info.operator.inn;
  $('region').textContent = info.region;
  $('locality').textContent = info.locality ?? '';
  $('locality').hidden = $('locality-label').hidden = !info.locality;
};

const message = (text) => {
  $('message').hidden = !text;
  $('message').textContent = text ?? '';
};

const update = async () => {
  const value = input.value;
  const national = parsePhone(value);
  if (value.replace(/\D/g, '').length < 10) return show(null), message(null);
  if (!national) return show(null), message('Это не похоже на российский номер');
  let info = lookup(national);
  if (!info && !national.startsWith('9')) {
    $('note').textContent = 'Загружаю реестр стационарных номеров…';
    full ??= import('./lib/full.js');
    info = (await full).lookup(national);
    if (parsePhone(input.value) !== national) return;
  }
  show(info);
  message(info ? null : 'Диапазон не выделен ни одному оператору');
  $('note').textContent = `Реестр от ${updated}. Для перенесённых номеров показывается исходный оператор.`;
};

for (const example of EXAMPLES) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = example;
  button.addEventListener('click', () => {
    input.value = example;
    update();
  });
  $('examples').append(button);
}

input.addEventListener('input', update);
input.value = new URLSearchParams(location.search).get('n') ?? EXAMPLES[0];
update();
