FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

# Copy CSV data
COPY ../data /app/data

# Seed the database on build
RUN node seed.js

EXPOSE 4000
CMD ["node", "server.js"]
