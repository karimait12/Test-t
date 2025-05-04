FROM node:18-slim

WORKDIR /app

# نسخ الملفات الأساسية (بشرط وجودها)
COPY package*.json ./

RUN npm install --omit=optional --legacy-peer-deps

COPY . .

CMD ["npm", "start"]
