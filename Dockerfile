# استخدام صورة Node.js الرسمية (Debian-based)
FROM node:18-slim

# إنشاء مجلد العمل
WORKDIR /app

# نسخ ملفات التبعية أولاً
COPY package.json package-lock.json ./

# تثبيت التبعيات
RUN npm install --omit=optional --legacy-peer-deps

# نسخ باقي الملفات
COPY . .

# الأمر التشغيلي
CMD ["npm", "start"]
