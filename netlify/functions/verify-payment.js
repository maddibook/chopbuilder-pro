const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': 'https://maddibook.github.io',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { sessionId } = JSON.parse(event.body);

    if (!sessionId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing sessionId' }) };
    }

    // Retrieve the session from Stripe to verify payment succeeded
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return { statusCode: 402, headers, body: JSON.stringify({ error: 'Payment not completed' }) };
    }

    // Generate a signed token — HMAC of the session ID using our secret
    // This lets the app verify the token without a database
    const token = crypto
      .createHmac('sha256', process.env.TOKEN_SECRET)
      .update(sessionId)
      .digest('hex');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token, sessionId }),
    };
  } catch (err) {
    console.error('Verify error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
