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
    const { email } = JSON.parse(event.body);

    if (!email || !email.includes('@')) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid email' }) };
    }

    // Search Stripe for completed checkout sessions with this email
    // We look through the last 100 sessions to find a paid one
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
    });

    // Find a paid session matching this email
    const match = sessions.data.find(s =>
      s.payment_status === 'paid' &&
      s.customer_details &&
      s.customer_details.email &&
      s.customer_details.email.toLowerCase() === email.toLowerCase()
    );

    if (!match) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'No purchase found for this email' }),
      };
    }

    // Generate token the same way as verify-payment
    const token = crypto
      .createHmac('sha256', process.env.TOKEN_SECRET)
      .update(match.id)
      .digest('hex');

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token, sessionId: match.id }),
    };

  } catch (err) {
    console.error('Restore error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
