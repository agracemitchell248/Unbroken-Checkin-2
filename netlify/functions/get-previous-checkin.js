const https = require('https');

exports.handler = async function (event) {
  const API_KEY          = process.env.AIRTABLE_TOKEN;
  const BASE_ID          = process.env.AIRTABLE_BASE_ID || 'appz0D6kUon2e70B5';
  const ASSESSMENT_TABLE = process.env.ASSESSMENT_TABLE_NAME || 'Assessment Data';

  // Just fetch the 3 most recent records with no filter
  const path = `/v0/${BASE_ID}/${encodeURIComponent(ASSESSMENT_TABLE)}?maxRecords=3&sort[0][field]=Assessment%20Date&sort[0][direction]=desc&fields[]=Email&fields[]=PSYCHLOPS%3A%20Problem%20Description&fields[]=Assessment%20Date`;

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
        resolve({
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: body
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) });
    });

    req.end();
  });
};
