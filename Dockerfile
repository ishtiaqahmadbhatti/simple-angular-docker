# Single stage build (development/testing only)
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build the app
RUN npm run build -- --configuration=production

# Install Angular CLI globally to use its server
RUN npm install -g @angular/cli

EXPOSE 4200

# Serve the app using Angular CLI (not recommended for production)
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4200", "--disable-host-check"]