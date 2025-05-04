FROM node:18-bullseye  # Debian-based أكثر استقراراً

WORKDIR /app

# 1. نسخ ملفات التبعية أولاً
COPY package.json package-lock.json ./

# 2. تثبيت التبعيات
RUN npm install --omit=optional --legacy-peer-deps

# 3. نسخ باقي الملفات
COPY . .

# 4. الأمر التشغيلي
CMD ["npm", "start"]
