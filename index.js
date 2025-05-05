const { makeWASocket, useSingleFileAuthState } = require('@whiskeysockets/baileys');
const { unlinkSync } = require('fs');
const path = require('path');

// مسار ملف الجلسة
const SESSION_FILE = path.join(__dirname, 'session.json');

// إعداد حالة المصادقة
const { state, saveState } = useSingleFileAuthState(SESSION_FILE);

// إنشاء الاتصال
async function startBot() {
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true, // يعرض كود QR إذا لم يتم تسجيل الدخول
    });

    // حفظ الجلسة عند التغيير
    sock.ev.on('creds.update', saveState);

    // الاستماع إلى الرسائل
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type === 'notify') {
            const msg = messages[0];
            if (!msg.key.fromMe && msg.message) {
                const sender = msg.key.remoteJid;
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

                console.log(`رسالة جديدة من ${sender}: ${text}`);

                // الرد التلقائي
                await sock.sendMessage(sender, { text: 'شكراً لرسالتك! نحن هنا لمساعدتك.' });
            }
        }
    });

    // الاستماع إلى أحداث الانفصال
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401; // إعادة الاتصال إذا لم يكن بسبب خطأ في المصادقة
            console.log('تم قطع الاتصال، جارٍ إعادة المحاولة...', shouldReconnect);
            if (shouldReconnect) startBot();
            else unlinkSync(SESSION_FILE); // حذف ملف الجلسة عند انتهاء الجلسة
        } else if (connection === 'open') {
            console.log('تم الاتصال بنجاح!');
        }
    });
}

// بدء البوت
startBot();
