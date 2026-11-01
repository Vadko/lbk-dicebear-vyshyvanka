import { Avatar, Style } from '@dicebear/core';
import vyshyvanka from './vyshyvanka.json';

const VYSHYVANKA = new Style(vyshyvanka);

// Every consumer draws through this one pinned DiceBear with the same options, so a seed looks the same everywhere
function avatarOf(seed: string): Avatar {
  return new Avatar(VYSHYVANKA, { seed, borderRadius: 50 });
}

export function vyshyvankaSvg(seed: string): string {
  return avatarOf(seed).toString();
}

export function vyshyvankaDataUri(seed: string): string {
  return avatarOf(seed).toDataUri();
}
