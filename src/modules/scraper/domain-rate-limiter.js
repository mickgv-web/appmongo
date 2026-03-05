const domainState = new Map();

const MIN_DELAY_MS = parseInt(
  process.env.SCRAPE_DOMAIN_DELAY_MS || 1000
);

export async function waitForDomainSlot(url) {
  const domain = new URL(url).hostname;
  const now = Date.now();

  const lastRequestTime = domainState.get(domain) || 0;
  const elapsed = now - lastRequestTime;

  if (elapsed < MIN_DELAY_MS) {
    const waitTime = MIN_DELAY_MS - elapsed;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  domainState.set(domain, Date.now());
}