const { default: makeWASocket, useMultiFileAuthState } = require('baileys');
const fs = require('fs');

async function startBot() {
  // إعداد بيانات المصادقة
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  // إنشاء اتصال البوت
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // طباعة كود QR في الطرفية
  });

  // حفظ بيانات الاعتماد عند تحديثها
  sock.ev.on('creds.update', saveCreds);

  // الاستماع للرسائل الجديدة
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return; // تجاهل الأنواع الأخرى
    const msg = messages[0];
    const from = msg.key.remoteJid; // رقم المرسل
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    // تحقق من وجود كلمة "تطبيق"
    if (text?.toLowerCase().includes('تطبيق')) {
      const filePath = './file-to-send.pdf';

      // تحقق من وجود الملف
      if (fs.existsSync(filePath)) {
        await sock.sendMessage(from, {
          document: { url: filePath }, // مسار الملف
          mimetype: 'application/pdf', // نوع الملف
          fileName: 'تطبيق.pdf', // اسم الملف
        });
        console.log(`تم إرسال الملف إلى ${from}`);
      } else {
        console.log('الملف غير موجود!');
      }
    }
  });

  // التحقق من حالة الاتصال
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      if (shouldReconnect) {
        console.log('إعادة الاتصال...');
        startBot();
      }
    } else if (connection === 'open') {
      console.log('تم الاتصال بنجاح!');
    }
  });
}

startBot();
