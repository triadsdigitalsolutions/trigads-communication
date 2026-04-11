import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    try {
        const users = await prisma.user.findMany()
        console.log('Users count:', users.length)
        console.log('Recent users:', JSON.stringify(users.map(u => ({ id: u.id, name: u.name, role: u.role })), null, 2))
    } catch (e) {
        console.error('Failed to fetch users:', e)
    }

    try {
        const contacts = await prisma.contact.findMany({ take: 10 })
        console.log('Contacts found:', contacts.length)
        console.log('Recent contacts:', JSON.stringify(contacts, null, 2))
    } catch (e) {
        console.error('Failed to fetch contacts:', e)
    }

    try {
        const messages = await prisma.message.findMany({ take: 10, orderBy: { createdAt: 'desc' } })
        console.log('Messages found:', messages.length)
        console.log('Recent messages:', JSON.stringify(messages, null, 2))
    } catch (e) {
        console.error('Failed to fetch messages:', e)
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
