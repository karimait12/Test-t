const { 
  makeWASocket, 
  makeInMemoryStore,
  DisconnectReason,
  useSingleFileAuthState 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// 1. إعداد الجلسة
const sessionFile = path.join(__dirname, 'session.json');
const { state, saveState } = useSingleFileAuthState(sessionFile);

// 2. إنشاء اتصال الواتساب
const startSock = async () => {
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: { level: 'silent' }
  });

  // 3. معالجة QR Code
  sock.ev.on('connection.update', (update) => {
    const { connection, qr } = update;
    
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('🔍 امسح رمز QR باستخدام واتسابك:');
    }

    if (connection === 'open') {
      console.log('✅ تم الاتصال بنجاح!');
    }

    if (connection === 'close') {
      const shouldReconnect = update.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`❌ انقطع الاتصال... ${shouldReconnect ? 'جاري إعادة الاتصال' : 'لن يتم إعادة الاتصال'}`);
      
      if (shouldReconnect) {
        setTimeout(startSock, 5000);
      }
    }
  });

  // 4. حفظ تحديثات الجلسة
  sock.ev.on('creds.update', saveState);

  // 5. نظام الأوامر
  const commands = {
    '/ping': () => ({ text: '🏓 Pong!' }),
    '/help': () => ({ text: '🛟 الأوامر المتاحة:\n• /ping\n• /help\n• /time' }),
    '/time': () => ({ text: `⏰ الوقت الآن: ${new Date().toLocaleTimeString()}` })
  };

  // 6. معالجة الرسائل
  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const jid = msg.key.remoteJid;
      const userMsg = msg.message.conversation || '';
      const sender = msg.pushName || 'مجهول';

      console.log(`📩 رسالة من [${sender}]: ${userMsg}`);

      // معالجة الأوامر
      if (userMsg.startsWith('/')) {
        const cmd = userMsg.split(' ')[0].toLowerCase();
        const response = commands[cmd]?.() || { 
          text: '⚠️ أمر غير معروف! اكتب /help للمساعدة' 
        };
        await sock.sendMessage(jid, response);
        return;
      }

      // ردود تلقائية
      if (/مرحبا|اهلا|سلام/.test(userMsg)) {
        await sock.sendMessage(jid, { 
          text: `أهلاً وسهلاً ${sender}! 😊\nكيف يمكنني مساعدتك؟`
        });
      } else {
        await sock.sendMessage(jid, {
          text: '🤖 تم استلام رسالتك!\nسيتم الرد قريباً...'
        });
      }

    } catch (error) {
      console.error('❌ خطأ في معالجة الرسالة:', error);
    }
  });

  return sock;
};

// 7. بدء التشغيل
startSock().catch(err => {
  console.error('🔥 خطأ فادح:', err);
  process.exit(1);
});

// 8. منع إغلاق البرنامج
setInterval(() => {}, 1 << 30);
