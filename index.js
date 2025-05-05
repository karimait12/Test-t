const { useSingleFileAuthState, makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs");

// قراءة ملف الجلسة
const sessionData = JSON.parse(fs.readFileSync("creds.json", "utf-8"));

// تحويل بيانات الـ Buffer من JSON إلى كائنات Buffer فعلية
function reviveBuffer(key, value) {
  if (value && value.type === "Buffer" && value.data) {
    return Buffer.from(value.data);
  }
  return value;
}

const session = JSON.parse(JSON.stringify(sessionData), reviveBuffer);

// تهيئة العميل
const socket = makeWASocket({
  auth: {
    creds: session,
    keys: session // إذا كانت المفاتيح مُضمنة في الجلسة
  },
  printQRInTerminal: false,
});

// التعامل مع الأحداث
socket.ev.on("connection.update", (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === "close") {
    if (lastDisconnect.error?.output?.statusCode === DisconnectReason.loggedOut) {
      console.log("تم تسجيل الخروج!");
      fs.unlinkSync("creds.json"); // حذف الجلسة إذا انتهت صلاحيتها
    }
  } else if (connection === "open") {
    console.log("تم الاتصال بنجاح!");
  }
});

// استقبال الرسائل
socket.ev.on("messages.upsert", async ({ messages }) => {
  const message = messages[0];
  if (!message.key.fromMe) {
    const sender = message.key.remoteJid;
    const text = message.message.conversation || "";
    
    if (text.toLowerCase() === "مرحبا") {
      await socket.sendMessage(sender, { text: "مرحبا بك في البوت!" });
    }
  }
});
