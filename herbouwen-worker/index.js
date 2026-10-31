/**
 * Roept de Deploy Hook van Cloudflare Pages aan op de tijden uit wrangler.toml.
 * De build haalt zelf de data op; deze worker geeft alleen het startsein.
 */
export default {
  async scheduled(event, env) {
    if (!env.DEPLOY_HOOK) throw new Error('Secret DEPLOY_HOOK ontbreekt.');
    const antwoord = await fetch(env.DEPLOY_HOOK, { method: 'POST' });
    if (!antwoord.ok) throw new Error(`Deploy Hook gaf ${antwoord.status}`);
  },
};
