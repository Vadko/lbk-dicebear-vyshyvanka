import { avatarOf } from '../src/avatarOf';
import { PALETTES, type Region } from '../src/generator/palettes';

const REGION_NAMES: Record<Region, string> = {
  poltava: 'Poltavshchyna',
  chernihiv: 'Chernihivshchyna',
  kyiv: 'Kyivshchyna',
  volyn: 'Volyn',
  podillia: 'Podillia',
  hutsul: 'Hutsulshchyna',
  bukovyna: 'Bukovyna',
  pokuttia: 'Pokuttia',
  boiko: 'Boikivshchyna',
  lemko: 'Lemkivshchyna',
  polissia: 'Polissia',
  sloboda: 'Slobozhanshchyna',
  zakarpattia: 'Zakarpattia',
  kherson: 'Khersonshchyna',
  brand: 'LBK colours',
};

export interface DrawnAvatar {
  readonly src: string;
  readonly region: string;
}

// DiceBear reports the palette it picked, and the palette names its region
export function drawAvatar(seed: string): DrawnAvatar {
  const avatar = avatarOf(seed);
  const { pVariant } = avatar.toJSON().options;
  const palette = PALETTES.find((p) => p.name === pVariant);
  if (!palette) {
    throw new Error(`palette ${String(pVariant)} is not in PALETTES`);
  }
  return { src: avatar.toDataUri(), region: REGION_NAMES[palette.region] };
}
