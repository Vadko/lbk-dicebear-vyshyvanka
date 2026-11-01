import { avatarOf } from './avatarOf';

export function vyshyvankaSvg(seed: string): string {
  return avatarOf(seed).toString();
}

export function vyshyvankaDataUri(seed: string): string {
  return avatarOf(seed).toDataUri();
}
