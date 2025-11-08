# Use a Chrome-enabled image for Puppeteer
FROM ghcr.io/puppeteer/puppeteer:22.13.1

WORKDIR /srv
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server-bot.js"]
