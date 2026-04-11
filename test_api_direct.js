const fetch = require('node-fetch'); // If not installed, I'll use raw https

const WHATSAPP_ACCESS_TOKEN = "EAAL0wDT7p2MBQ6hYv15323x46l9dJ8Hd0vten4oOb7ZC5uoQO4U0BmV6wyqUnIuXomFV8nOrl0pDbNfuoVfQa5PKQcOzbAgVjLLyCDojT2ZA9wr5FH0YnAfZB2zgF031rgpdEjl1tDFo9WVPjVHZAjHMsep20Yj4LHTuVm2VzZCsFAZC2RYxiQUZCdmWleKqaFpEaZAReNy9bmg6hO3tuJ4jlgbvCqntljQIfLGS495twVoGCGllg4ZAz4VStV1UgZBlFWyUxVTAmTxbYLOzUR6wox";
const WHATSAPP_PHONE_NUMBER_ID = "1040801602441414";
const TEST_NUMBER = "918075355480"; // Replace with user's testing number if known

async function sendText(to, text) {
    const url = `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: to,
            type: 'text',
            text: { body: text },
        }),
    });

    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}

(async () => {
    console.log('Sending test message...');
    const result = await sendText(TEST_NUMBER, 'Test message from standalone script');
    console.log('Result:', JSON.stringify(result, null, 2));
})();
