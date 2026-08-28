/**
 * Controleert tijdens de build of een foto daadwerkelijk in /public staat.
 *
 * De club levert het beeldmateriaal in delen aan. Zolang een map leeg is
 * willen we een nette plaatshouder met de juiste verhouding tonen en nooit
 * een gebroken plaatje. Omdat de site statisch gebouwd wordt, kunnen we dat
 * gewoon op de schijf nakijken; er komt geen extra verzoek van de bezoeker
 * aan te pas.
 *
 * Zie IMAGES.md voor de lijst met verwachte bestandsnamen.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const cache = new Map<string, boolean>();

export function fotoBestaat(pad?: string | null): boolean {
  if (!pad) return false;
  if (!pad.startsWith('/')) return true;          // externe url, niet onze zorg
  if (cache.has(pad)) return cache.get(pad)!;

  const schoon = pad.split('?')[0].split('#')[0];
  const bestaat = existsSync(join(process.cwd(), 'public', schoon));
  cache.set(pad, bestaat);
  return bestaat;
}
