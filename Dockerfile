# frontend/Dockerfile
# 1) build
FROM node:20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build -- --output-path=dist

# 2) nginx to serve
FROM nginx:stable
COPY --from=build /app/dist /usr/share/nginx/html

# copia configuración personalizada de nginx (opcional)
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
