// ─────────────────────────────────────────────────────────────
// Netlify Function: submit-checkin
// Saves Check-In 2 responses to Airtable.
//
// Environment variables (set in Netlify dashboard):
//   AIRTABLE_API_KEY      — personal access token
//   AIRTABLE_BASE_ID      — appz0D6kUon2e70B5
//   AIRTABLE_TABLE_NAME   — "Assessment Data"
// ─────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const AIRTABLE_API_KEY    = process.env.AIRTABLE_API_KEY;
  const AIRTABLE_BASE_ID    = process.env.AIRTABLE_BASE_ID || 'appz0D6kUon2e70B5';
  const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Assessment Data';

  const fields = {
    email:                payload.email               || '',
    checkInNumber:        payload.checkInNumber       || 2,
    assessmentDate:       payload.assessmentDate      || new Date().toISOString(),
    subscriptionId:       payload.subscriptionId      || '',
    psychlopsProblem:     payload.psychlopsProblem     || '',
    psychlopsImpact:      payload.psychlopsImpact,
    psychlopsFunctioning: payload.psychlopsFunctioning,
    psychlopsWellbeing:   payload.psychlopsWellbeing,
    psychlopsTotal:       payload.psychlopsTotal,
    pssTotalScore:        payload.pssTotalScore,
    'Engagement: Features Used':       payload.engagementUsed                        || '',
    'Engagement: Name It Videos':      payload['Engagement: Name It Videos']         ?? null,
    'Engagement: Breathing Exercises': payload['Engagement: Breathing Exercises']    ?? null,
    'Engagement: Reset Exercises':     payload['Engagement: Reset Exercises']        ?? null,
    'Engagement: Course Modules':      payload['Engagement: Course Modules']         ?? null,
    'Engagement: Drop-in Sessions':    payload['Engagement: Drop-in Sessions']       ?? null,
  };

  for (let i = 1; i <= 10; i++) {
    const key = `PSS Q${i}`;
    if (payload[key] !== undefined) fields[key] = payload[key];
  }

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Airtable error:', data);
      return { statusCode: 500, body: JSON.stringify({ error: data.error?.message || 'Airtable error' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, id: data.id })
    };

  } catch (err) {
    console.error('Function error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
