FROM node:24-alpine

WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài full dependencies (bao gồm dev) để prisma generate chạy được
RUN npm install

# Copy toàn bộ source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build nếu có (ví dụ build TS)
RUN npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]


