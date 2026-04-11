require('dotenv').config({ path: '.env.local' });
const { sendText } = require('./src/lib/whatsapp');

// Use a known number for testing - replace with a real one for final check
const TEST_NUMBER = '918075355480';

async function test() {
    console.log('Testing sendText to:', TEST_NUMBER);
    try {
        const response = await sendText(TEST_NUMBER, 'Hello from the dashboard! This is a regular text message test.');
        console.log('Success!', JSON.stringify(response, null, 2));
    } catch (error) {
        console.error('Failed!', error.message);
    }
}

test();
