import { weddingPack } from './wedding';
import { birthdayPack } from './birthday';
import { communityPack } from './community';
import type { TemplatePack } from '../types';

export const templatePacks: Record<string, TemplatePack> = {
  wedding: weddingPack,
  birthday: birthdayPack,
  community: communityPack,
};

export function getPackForEvent(eventType: string): TemplatePack {
  return templatePacks[eventType] || weddingPack;
}

export { weddingPack, birthdayPack, communityPack };
