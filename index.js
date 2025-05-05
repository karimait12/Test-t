const { default: makeWASocket, useSingleFileAuthState } = require('baileys');
const fs = require('fs');

async function startBot() {
  const { state, saveCreds } = await useSingleFileAuthState('./session.json');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // ستتم طباعة QR في الطرفية عند التشغيل
  });

  sock.ev.on('creds.update', saveCreds); // حفظ بيانات الجلسة

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!');
    } else if (connection === 'close') {
      console.log('⚠️ الاتصال أغلق!');
      // إعادة المحاولة بعد الانقطاع
      startBot();
    }
  });

  // الاستماع للرسائل
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    // يمكن إضافة المنطق هنا لالتقاط الرسائل
  });
}

startBot();
