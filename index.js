const { makeWASocket, useSingleFileAuthState } = require("@adiwajshing/baileys");
const fs = require("fs");

// قراءة الـ Session من ملف
const { state, saveState } = useSingleFileAuthState("./session.json");

// إنشاء العميل
const client = makeWASocket({
  auth: state,
  printQRInTerminal: true,
});

// حفظ تحديثات الجلسة تلقائيًا
client.ev.on("creds.update", saveState);

// الاستماع للرسائل
client.ev.on("messages.upsert", ({ messages }) => {
  const message = messages[0];
  if (message.key.fromMe) return;

  client.sendMessage(message.key.remoteJid, {
    text: "تم استلام رسالتك!",
  });
});
