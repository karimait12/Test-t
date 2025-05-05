// index.js
const { default: makeWASocket } = require('baileys');
const useSingleFileAuthState = require('@debanjan-s/use-single-file-auth-state').default;
const fs = require('fs');

async function startBot() {
  // مسار ملف الجلسة
  const sessionFile = './session.json';

  // هنا لو الملف غير موجود، سيُنشئ بوت جديد ويطبع QR
  const printQR = !fs.existsSync(sessionFile);

  // تحميل أو إنشاء الجلسة في ملف واحد
  const { state, saveState } = await useSingleFileAuthState(sessionFile);

  // إنشاء الاتصال - إذا كان printQR=true سيُعطيك كود QR
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: printQR,
  });

  // كلما تغيرت بيانات الاعتماد، احفظها
  sock.ev.on('creds.update', saveState);

  // الاستماع للرسائل
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (text?.toLowerCase().includes('تطبيق')) {
      const filePath = './file-to-send.pdf';
      if (fs.existsSync(filePath)) {
        await sock.sendMessage(from, {
          document: { url: filePath },
          mimetype: 'application/pdf',
          fileName: 'تطبيق.pdf',
        });
        console.log(`✔️ أُرسل الملف إلى ${from}`);
      }
    }
  });

  // مراقبة الاتصال
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!');
    } else if (connection === 'close') {
      console.log('⚠️ الاتصال أغلق، إعادة تشغيل...');
      startBot();
    }
  });
}

startBot();
