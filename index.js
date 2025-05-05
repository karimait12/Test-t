// index.js
const { default: makeWASocket, useMultiFileAuthState } = require('baileys');
const fs = require('fs');

async function startBot() {
  // 1. تحميل بيانات الجلسة (state) من مجلد auth_info/
  //    إذا وجدت ملفات الجلسة هناك، سيُستخدمُ token الموجود ولن يُطْلَبُ مسح QR.
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  // 2. إنشاء اتصال البوت بدون طباعة QR
  const sock = makeWASocket({
    auth: state,
    // يمكنك ضبط خيارات أخرى هنا إن احتجت، مثلاً:
    // defaultQueryTimeoutMs: undefined
  });

  // 3. حفظ بيانات الجلسة عند أي تحديث (مثل تجديد الـ tokens)
  sock.ev.on('creds.update', saveCreds);

  // 4. الاستماع للرسائل الجديدة
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
      } else {
        console.warn('❌ الملف غير موجود:', filePath);
      }
    }
  });

  // 5. مراقبة حالة الاتصال
  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح دون مسح QR!');
    }
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      console.log('⚠️ الاتصال أغلق، كود الحالة:', status);
      // إذا لم يكن logout (401) فنُعيد الاتصال
      if (status !== 401) {
        console.log('🔄 إعادة تشغيل البوت بعد انقطاع...');
        startBot();
      } else {
        console.error('🚫 تم تسجيل الخروج من الجلسة. يجب إنشاء جلسة جديدة.');
      }
    }
  });
}

startBot();
