const { useSingleFileAuthState, makeWASocket, DisconnectReason } = require("@whiskeysockets/baileys");
const fs = require("fs");

// قراءة ملف الجلسة
let sessionData;
try {
  sessionData = JSON.parse(fs.readFileSync("creds.json", "utf-8"));
} catch (err) {
  console.log("لم يتم العثور على ملف الجلسة. سيتم إنشاء جلسة جديدة عند الاتصال.");
  sessionData = null;
}

// تحويل بيانات الـ Buffer من JSON إلى كائنات Buffer فعلية
function reviveBuffer(key, value) {
  if (value && value.type === "Buffer" && value.data) {
    return Buffer.from(value.data);
  }
  return value;
}

const session = sessionData ? JSON.parse(JSON.stringify(sessionData), reviveBuffer) : null;

// تهيئة العميل
const socket = makeWASocket({
  auth: session ? {
    creds: session,
    keys: session // إذا كانت المفاتيح مُضمنة في الجلسة
  } : undefined,
  printQRInTerminal: true, // عرض رمز QR في المحطة إذا لم يكن هناك جلسة
});

// التعامل مع الأحداث
socket.ev.on("connection.update", (update) => {
  const { connection, lastDisconnect } = update;
  if (connection === "close") {
    if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
      console.log("تم تسجيل الخروج!");
      try {
        fs.unlinkSync("creds.json"); // حذف الجلسة إذا انتهت صلاحيتها
      } catch (err) {
        console.error("خطأ أثناء حذف ملف الجلسة:", err.message);
      }
    } else {
      console.log("تم قطع الاتصال! المحاولة قيد التنفيذ...");
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
    const text = message.message?.conversation || "";

    console.log(`رسالة جديدة من ${sender}: ${text}`);
    if (text.toLowerCase() === "مرحبا") {
      try {
        await socket.sendMessage(sender, { text: "مرحبا بك في البوت!" });
        console.log(`تم الرد على ${sender}.`);
      } catch (err) {
        console.error("خطأ أثناء إرسال الرسالة:", err.message);
      }
    }
  }
});

// حفظ بيانات الجلسة عند حدوث تغييرات
socket.ev.on("creds.update", (updatedCreds) => {
  try {
    fs.writeFileSync("creds.json", JSON.stringify(updatedCreds, null, 2));
    console.log("تم حفظ الجلسة بنجاح.");
  } catch (err) {
    console.error("خطأ أثناء حفظ الجلسة:", err.message);
  }
});
