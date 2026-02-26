const requests = new Map();

export function searchRateLimit(req, res, next) {
  const userId = req.user.id;

  const now = Date.now();
  const windowMs = 24 * 60 * 60 * 1000; // 24h
  const maxRequests = 50; // configurable

  if (!requests.has(userId)) {
    requests.set(userId, []);
  }

  const timestamps = requests.get(userId).filter(
    ts => now - ts < windowMs
  );

  if (timestamps.length >= maxRequests) {
    return res.status(429).json({ message: "Daily limit reached" });
  }

  timestamps.push(now);
  requests.set(userId, timestamps);

  next();
}