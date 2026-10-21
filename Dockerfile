# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Set these at build time for a real backend:  --build-arg VITE_USE_MOCK=false --build-arg VITE_API_BASE_URL=/api/v1
ARG VITE_USE_MOCK=true
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_ROUTER=hash
ENV VITE_USE_MOCK=$VITE_USE_MOCK VITE_API_BASE_URL=$VITE_API_BASE_URL VITE_ROUTER=$VITE_ROUTER
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
