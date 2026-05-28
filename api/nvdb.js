export default async function handler(req, res) {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'Missing lat/lon' });

  const headers = {
    'Accept': 'application/json',
    'X-Client': 'loggbok-arbeidsvarsling',
    'User-Agent': 'loggbok-arbeidsvarsling/1.0'
  };

  const urls = [
    `https://nvdbapiv3.atlas.vegvesen.no/veg?lat=${lat}&lon=${lon}&maks_avstand=100`,
    `https://nvdbapiv3.atlas.vegvesen.no/posisjon?lat=${lat}&lon=${lon}&maks_avstand=100`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) continue;
      const data = await response.json();
      const item = Array.isArray(data) ? data[0] : data;
      const kortform = item?.vegsystemreferanse?.kortform;
      if (!kortform) continue;

      // Parse by pattern — handles "KV1336 S1D1 m52" AND "FV115 K S7D1 m1122"
      const parts = kortform.trim().split(/\s+/);
      const vegnr  = parts[0] || '';
      const sd     = parts.find(p => /^S\d/i.test(p)) || '';
      const mPart  = parts.find(p => /^m\d/i.test(p)) || '';
      const meter  = mPart.replace(/^m/i, '');

      return res.status(200).json({ vegnr, sd, meter, kortform });
    } catch (e) { continue; }
  }

  return res.status(200).json({ error: 'not_found' });
}
