import { Avatar, Style } from '@dicebear/core';
import vyshyvanka from './vyshyvanka.json';

const VYSHYVANKA = new Style(vyshyvanka);

// Every consumer draws through this one pinned DiceBear with the same options, so a seed looks the same everywhere
export function avatarOf(seed: string): Avatar {
  return new Avatar(VYSHYVANKA, { seed, borderRadius: 50 });
}
