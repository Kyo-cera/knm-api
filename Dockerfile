FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x /app/dist/app.js



EXPOSE 3005

# Avvia il servizio cron all'interno del contenitore
CMD ["sh", "-c", "node /app/dist/app.js"]