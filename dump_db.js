const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function dump() {
    try {
        const messages = await prisma.message.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                contact: { select: { phone: true, name: true } }
            }
        });

        const output = {
            timestamp: new Date().toISOString(),
            count: messages.length,
            messages: messages.map(m => ({
                id: m.id,
                direction: m.direction,
                phone: m.contact.phone,
                content: m.content,
                createdAt: m.createdAt,
                status: m.status
            }))
        };

        fs.writeFileSync('db_dump.json', JSON.stringify(output, null, 2));
        console.log('Dumped to db_dump.json');
    } catch (error) {
        fs.writeFileSync('db_dump.json', JSON.stringify({ error: error.message }, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

dump();
