import { version } from '../package.json';
import { vyshyvankaDataUri } from '../src/index';

const GALLERY_SIZE = 48;

function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const e = document.getElementById(id);
  if (!(e instanceof type)) {
    throw new Error(`#${id} is missing`);
  }
  return e;
}

const input = byId('seed', HTMLInputElement);
const snippet = byId('snippet', HTMLElement);
const gallery = byId('gallery', HTMLDivElement);
const previews = document.querySelectorAll<HTMLImageElement>('img.preview');

// The server hands out 12 hex characters, so the gallery draws seeds of the same shape
const randomSeed = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) =>
    b.toString(16).padStart(2, '0')
  ).join('');

function show(seed: string): void {
  const src = vyshyvankaDataUri(seed);
  for (const img of previews) {
    img.src = src;
  }
  byId('icon', HTMLLinkElement).href = src;
  snippet.textContent = `vyshyvankaDataUri(${JSON.stringify(seed)})`;
  history.replaceState(null, '', `#${new URLSearchParams({ seed })}`);
}

function pick(seed: string): void {
  input.value = seed;
  show(seed);
}

function avatarButton(seed: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.title = seed;
  button.setAttribute('aria-label', `Show seed ${seed}`);
  const img = document.createElement('img');
  img.src = vyshyvankaDataUri(seed);
  img.alt = '';
  img.width = 72;
  img.height = 72;
  button.append(img);
  button.addEventListener('click', () => {
    pick(seed);
    input.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  return button;
}

const shuffle = () =>
  gallery.replaceChildren(
    ...Array.from({ length: GALLERY_SIZE }, () => avatarButton(randomSeed()))
  );

const seedInHash = () => new URLSearchParams(location.hash.slice(1)).get('seed');

input.addEventListener('input', () => show(input.value));
byId('random', HTMLButtonElement).addEventListener('click', () => pick(randomSeed()));
byId('shuffle', HTMLButtonElement).addEventListener('click', shuffle);
window.addEventListener('hashchange', () => pick(seedInHash() ?? randomSeed()));
byId('version', HTMLElement).textContent = `v${version}`;

pick(seedInHash() ?? randomSeed());
shuffle();
