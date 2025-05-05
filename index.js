const { default: makeWASocket, initAuthCreds } = require('baileys');
const fs = require('fs');

async function startBot() {
  let creds;
  const sessionFile = './session.json';

  // تحميل بيانات الجلسة من ملف JSON
  if (fs.existsSync(sessionFile)) {
    creds = JSON.parse(fs.readFileSync(sessionFile, { encoding: 'utf-8' }));
  } else {
    creds = initAuthCreds(); // إذا لم يوجد ملف جلسة، إنشاء جلسة جديدة
  }

  const sock = makeWASocket({
    auth: creds,
  });

  // حفظ الجلسة عند تحديثها
  sock.ev.on('creds.update', (updatedCreds) => {
    fs.writeFileSync(sessionFile, JSON.stringify(updatedCreds, null, 2));
  });

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!');
    }
    if (connection === 'close') {
      const status = lastDisconnect?.error?.output?.statusCode;
      console.log('⚠️ الاتصال أغلق، كود الحالة:', status);
      if (status !== 401) {
        console.log('🔄 إعادة تشغيل البوت بعد انقطاع...');
        startBot();
      } else {
        console.error('🚫 تم تسجيل الخروج من الجلسة. تحتاج إلى تسجيل الدخول مجددًا.');
      }
    }
  });
}

startBot();
