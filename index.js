const { default: makeWASocket, useSingleFileAuthState } = require('@adiwajshing/baileys');

const fs = require('fs');

// إعداد المصادقة
const { state, saveState } = useSingleFileAuthState('./auth_info.json');

async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveState);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0];
            if (!msg.message) return;

            const from = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

            console.log(`Received message: ${text} from ${from}`);

            if (text && text.toLowerCase().includes('تطبيق')) {
                // إرسال ملف عند تلقي كلمة "تطبيق"
                const filePath = './file-to-send.pdf'; // ضع مسار الملف هنا

                if (fs.existsSync(filePath)) {
                    await sock.sendMessage(from, {
                        document: { url: filePath },
                        mimetype: 'application/pdf',
                        fileName: 'تطبيق.pdf'
                    });
                    console.log('تم إرسال الملف.');
                } else {
                    console.error('الملف غير موجود!');
                }
            }
        }
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed. Reconnecting...', shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === 'open') {
            console.log('Connected!');
        }
    });
}

startBot();
