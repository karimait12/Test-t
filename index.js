// index.js
const { makeWASocket, useMultiFileAuthState } = require('baileys');
const { unlinkSync } = require('fs');
const path = require('path');

// مسار مجلد المصادقة (حيث ستُخزّن عدة ملفات: creds.json و keys.json)
const AUTH_DIR = path.join(__dirname, 'auth_info');

// دالة بدء البوت
async function startBot() {
  // هذه الدالة تُعيد لك state وحفظ التحديثات
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // إذا لم تكن قد سجلت من قبل
  });

  // حفظ بيانات الاعتماد عند أي تحديث
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect.error?.output?.statusCode !== 401;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
      else unlinkSync(path.join(AUTH_DIR, 'creds.json')); 
    } else if (connection === 'open') {
      console.log('⚡️ Connected');
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type === 'notify') {
      const msg = messages[0];
      if (!msg.key.fromMe && msg.message) {
        const jid = msg.key.remoteJid;
        await sock.sendMessage(jid, { text: 'شكراً لرسالتك! نحن هنا لمساعدتك.' });
      }
    }
  });
}

startBot();
