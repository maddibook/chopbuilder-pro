const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Chop Builder Pro',
            description: 'Unlock all features: kick patterns, chop playback, more groups, history & favourites, and more.',
          },
          unit_amount: 299, // €2.99 in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `https://maddibook.github.io/chopbuilder/?token={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://maddibook.github.io/chopbuilder/?cancelled=1`,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
