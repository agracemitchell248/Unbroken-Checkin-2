const https = require('https');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!email || !email.includes('@')) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  const API_KEY          = process.env.AIRTABLE_TOKEN;
  const BASE_ID          = process.env.AIRTABLE_BASE_ID || 'appz0D6kUon2e70B5';
  const ASSESSMENT_TABLE = process.env.ASSESSMENT_TABLE_NAME || 'Assessment Data';

  const formula = encodeURIComponent(`LOWER({Email}) = "${email.toLowerCase().trim()}"`);
  const fieldList = [
    'First Name',
    'Email',
    'PSYCHLOPS: Problem Description',
    'PSYCHLOPS: Total Score',
    'PSYCHLOPS: Problem Impact',
    'PSYCHLOPS: Functioning',
    'PSYCHLOPS: Wellbeing',
    'PSS Total Score',
    'Assessment Date'
  ].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const path = `/v0/${BASE_ID}/${encodeURIComponent(ASSESSMENT_TABLE)}?filterByFormula=${formula}&sort[0][field]=Assessment%20Date&sort[0][direction]=desc&maxRecords=1&${fieldList}`;

  const JSON_HEADERS = { 'Content-Type': 'application/json' };

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.airtable.com',
      path,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('Airtable response:', JSON.stringify(data).substring(0, 500));

          if (!data.records || data.records.length === 0) {
            console.log('No records found for email:', email);
            return resolve({ statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ found: false }) });
          }

          const r = data.records[0].fields;
          console.log('Found record fields:', JSON.stringify(r).substring(0, 300));

          resolve({
            statusCode: 200,
            headers: JSON_HEADERS,
            body: JSON.stringify({
              found:            true,
              firstName:        r['First Name']                     || null,
              psychlopsProblem: r['PSYCHLOPS: Problem Description'] || null,
              basePssScore:     r['PSS Total Score']                ?? null,
              basePsychlops:    r['PSYCHLOPS: Total Score']         ?? null,
              baseImpact:       r['PSYCHLOPS: Problem Impact']      ?? null,
              baseFunctioning:  r['PSYCHLOPS: Functioning']         ?? null,
              baseWellbeing:    r['PSYCHLOPS: Wellbeing']           ?? null,
              assessmentDate:   r['Assessment Date']                || null
            })
          });
        } catch (err) {
          console.error('Parse error:', err, 'Body:', body.substring(0, 200));
          resolve({ statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ found: false }) });
        }
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err);
      resolve({ statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify({ found: false }) });
    });

    req.end();
  });
};
