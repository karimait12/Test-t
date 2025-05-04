const { makeWASocket, useSingleFileAuthState, delay } = require("@whiskeysockets/baileys");
const fs = require('fs');
const path = require('path');

// 1. إعدادات الجلسة المحسنة
const sessionFile = path.join(__dirname, 'session.json');
const { state, saveState } = useSingleFileAuthState(sessionFile);

// 2. إنشاء العميل مع خيارات متقدمة
const client = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  logger: { level: 'warn' }, // تقليل السجلات غير الضرورية
  browser: ["MyBot", "Chrome", "1.0"], // تخصيص معلومات المتصفح
  markOnlineOnConnect: true, // الظهور متصلاً
  syncFullHistory: false // عدم جلب كل المحادثات القديمة
});

// 3. نظام إدارة الأخطاء
process.on('uncaughtException', (err) => {
  console.error('⚠️ خطأ غير متوقع:', err);
});

// 4. الأوامر المخصصة
const commands = {
  '/ping': () => ({ text: '🏓 Pong!' }),
  '/help': () => ({ text: '🛟 الأوامر المتاحة:\n• /ping\n• /info\n• /time' }),
  '/info': () => ({ text: `🖥️ إصدار البوت: 1.0\n🕒 آخر تشغيل: ${new Date().toLocaleString()}` })
};

// 5. معالجة الرسائل مع تحسينات
client.ev.on('messages.upsert', async ({ messages }) => {
  try {
    const msg = messages[0];
    if (msg.key.fromMe || !msg.message?.conversation) return;

    const jid = msg.key.remoteJid;
    const userMsg = msg.message.conversation.toLowerCase();
    const sender = msg.pushName || 'مجهول';

    console.log(`📩 رسالة من [${sender}]: ${userMsg}`);

    // 6. نظام الأوامر
    if (userMsg.startsWith('/')) {
      const cmd = userMsg.split(' ')[0];
      const response = commands[cmd]?.() || { 
        text: '⚠️ أمر غير معروف! اكتب /help للمساعدة' 
      };
      
      await client.sendMessage(jid, response);
      return;
    }

    // 7. ردود تلقائية ذكية
    if (/مرحبا|اهلا|سلام/.test(userMsg)) {
      await client.sendMessage(jid, { 
        text: `أهلاً وسهلاً ${sender}! 😊\nكيف يمكنني مساعدتك؟`
      });
    } else if (/شكرا|متشكر|thanks/.test(userMsg)) {
      await client.sendMessage(jid, { 
        text: 'العفو! 🤗 دائماً بخدمتك'
      });
    } else {
      await client.sendMessage(jid, {
        text: '🤖 تم استلام رسالتك!\nسيتم الرد قريباً...'
      });
    }

  } catch (error) {
    console.error('❌ خطأ في معالجة الرسالة:', error);
  }
});

// 8. التحكم في حالة الاتصال
client.ev.on('connection.update', (update) => {
  const { connection, lastDisconnect } = update;
  
  if (connection === 'close') {
    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
    console.log(`🔌 انقطع الاتصال... ${shouldReconnect ? 'إعادة الاتصال' : 'لن يتم إعادة الاتصال'}`);
    
    if (shouldReconnect) {
      setTimeout(() => {
        console.log('🔄 محاولة إعادة الاتصال...');
        initializeClient();
      }, 5000);
    }
  } else if (connection === 'open') {
    console.log('✅ تم الاتصال بنجاح!');
  }
});

// 9. حفظ الجلسة التلقائي
client.ev.on('creds.update', saveState);

// 10. منع إغلاق البرنامج
setInterval(() => {}, 1000 * 60 * 60 * 24); // تشغيل دائم
