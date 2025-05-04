FROM node:18-slim

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install --omit=optional --legacy-peer-deps

COPY . .

CMD ["npm", "start"]
