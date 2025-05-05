const { default: makeWASocket, useSingleFileAuthState } = require('baileys');
const fs = require('fs');

async function startBot() {
  // تحقق إذا كان الملف موجودًا
  const sessionFile = './session.json';
  if (!fs.existsSync(sessionFile)) {
    console.log("ملف الجلسة غير موجود، يجب إنشاء جلسة جديدة...");
    return; // أو يمكنك إعادة الاتصال لجعل التطبيق يتصرف بشكل مناسب عند غياب الجلسة
  }

  // تحميل بيانات الجلسة من الملف
  const { state, saveCreds } = await useSingleFileAuthState(sessionFile);

  // إنشاء الاتصال
  const sock = makeWASocket({
    auth: state,
  });

  // حفظ بيانات الجلسة عند تحديثها
  sock.ev.on('creds.update', saveCreds);

  // الاستماع للرسائل
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return; // تجاهل الأنواع الأخرى
    const msg = messages[0];
    const from = msg.key.remoteJid;
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;

    // تحقق من وجود كلمة "تطبيق"
    if (text?.toLowerCase().includes('تطبيق')) {
      const filePath = './file-to-send.pdf';

      if (fs.existsSync(filePath)) {
        await sock.sendMessage(from, {
          document: { url: filePath },
          mimetype: 'application/pdf',
          fileName: 'تطبيق.pdf',
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
      console.log('⚠️ الاتصال أغلق، سيتم إعادة المحاولة...');
      startBot(); // إعادة الاتصال
    } else if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!');
    }
  });
}

startBot();
