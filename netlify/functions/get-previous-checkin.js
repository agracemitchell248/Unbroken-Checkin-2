// ─────────────────────────────────────────────────────────────
// Netlify Function: get-previous-checkin
//
// Looks up a user's most recent baseline record in Airtable
// by email address and returns:
//   - psychlopsProblem (for the "last time you said" callback)
//   - PSS Total Score  (for delta calculation on thank you screen)
//   - PSYCHLOPS Total Score (for delta calculation)
//   - firstName
//
// Environment variables (set in Netlify dashboard):
//   AIRTABLE_TOKEN        — personal access token
//   AIRTABLE_BASE_ID      — appz0D6kUon2e70B5
//   ASSESSMENT_TABLE_NAME — "Assessment Data"
// ─────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!email || !email.includes('@')) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Valid email required' }) };
  }

  const API_KEY          = process.env.AIRTABLE_TOKEN;
  const BASE_ID          = process.env.AIRTABLE_BASE_ID || 'appz0D6kUon2e70B5';
  const ASSESSMENT_TABLE = process.env.ASSESSMENT_TABLE_NAME || 'Assessment Data';

  const headers = {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  };

  try {
    const formula = encodeURIComponent(`LOWER({Email}) = "${email.toLowerCase().trim()}"`);
    const fields  = [
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

    const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(ASSESSMENT_TABLE)}?filterByFormula=${formula}&sort[0][field]=Assessment%20Date&sort[0][direction]=desc&maxRecords=1&${fields}`;

    const res = await fetch(url, { headers });

    if (!res.ok) {
      console.error('Airtable lookup failed:', await res.text());
      return { statusCode: 200, body: JSON.stringify({
