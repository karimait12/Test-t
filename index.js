const { makeWASocket, makeInMemoryStore } = require('@whiskeysockets/baileys');
const { useSingleFileAuthState } = makeInMemoryStore();
const path = require('path');

// 1. إعداد الجلسة
const sessionFile = path.join(__dirname, 'session.json');
const { state, saveState } = useSingleFileAuthState(sessionFile);

// 2. إنشاء اتصال الواتساب
const sock = makeWASocket({
  auth: state,
  printQRInTerminal: true,
  logger: { level: 'warn' }
});

// 3. حفظ تحديثات الجلسة
sock.ev.on('creds.update', saveState);

// 4. معالجة الرسائل
sock.ev.on('messages.upsert', ({ messages }) => {
  const msg = messages[0];
  if (!msg.message || msg.key.fromMe) return;

  sock.sendMessage(msg.key.remoteJid, {
    text: 'تم استلام رسالتك!'
  });
});

console.log('✅ البوت يعمل! امسح QR Code عند ظهوره');
