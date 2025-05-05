/** index.js **/

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';

const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@adiwajshing/baileys');
const P = require('pino');
const { join } = require('path');

// 1) حيث سيتم تخزين creds.json و keys
const AUTH_FOLDER = join(__dirname, 'auth_info');

// 2) احذف مجلد auth_info القديم يدوياً، أو اجعله فارغاً
//    قبل التشغيل الأول

async function startBot() {
  // 3) استعمل multi-file auth state
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

  // 4) جيب آخر نسخة بروتوكول WhatsApp
  const { version } = await fetchLatestBaileysVersion();

  // 5) أنشئ الـ socket
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: 'silent' }),
  });

  // 6) احفظ التحديثات على creds & keys
  sock.ev.on('creds.update', saveCreds);

  // 7) تعقب حالة الاتصال
  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('📱 مسح رمز QR من واتساب لربط الجلسة');
    }
    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      if (code === DisconnectReason.loggedOut) {
        console.error('❌ تم تسجيل الخروج، احذف auth_info وأعد التشغيل.');
        process.exit(0);
      }
      console.log('🔄 اتصال مقطوع، إعادة تشغيل البوت...');
      startBot();
    }
    if (connection === 'open') {
      console.log('✅ متصل بواتساب بنجاح!');
    }
  });

  // 8) مثال: الرد على رسالة "ping"
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.remoteJid;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';

    console.log(`📩 من ${sender}: ${text}`);
    if (text.toLowerCase() === 'ping') {
      await sock.sendMessage(sender, { text: 'pong' });
    }
  });
}

startBot().catch(console.error);
