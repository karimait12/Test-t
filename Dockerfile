FROM node:18-alpine

WORKDIR /app

# 1. تثبيت المتطلبات الأساسية
RUN apk add --no-cache python3 make g++

# 2. نسخ ملفات التبعية أولاً
COPY package.json package-lock.json ./

# 3. تثبيت التبعيات مع إصلاح المشاكل
RUN npm install --legacy-peer-deps --omit=optional

# 4. نسخ باقي الملفات
COPY . .

# 5. الأمر التشغيلي
CMD ["npm", "start"]
