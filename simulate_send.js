const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendMessageAction } = require('./src/app/actions/whatsapp');

async function simulate() {
    try {
        const contact = await prisma.contact.findFirst();
        if (!contact) {
            console.log('No contacts found to test with.');
            return;
        }

        console.log('Using contact:', contact.name, '(', contact.phone, ')');

        // We need to simulate a session for auth()
        // Since auth() is usually called in server actions, we might need to mock it if it fails in standalone.
        // In this project, auth() is likely next-auth.

        const result = await sendMessageAction(contact.id, "Test message from simulation script");
        console.log('Result:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('Simulation Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

simulate();
