const { PrismaClient } = require('@prisma/client');

const p = new PrismaClient({
    datasourceUrl: 'mysql://root@127.0.0.1:3306/trigadscommunication',
    log: ['query', 'error', 'warn'],
});

async function main() {
    try {
        const result = await p.user.findFirst();
        console.log('DB OK - user:', JSON.stringify(result));
    } catch (e) {
        console.log('DB ERROR:', e.message);
        console.log('Error code:', e.errorCode);
    } finally {
        await p.$disconnect();
    }
}

main();
