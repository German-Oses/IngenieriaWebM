FROM node:18-alpine AS builder

WORKDIR /app

# Argumento para API URL
ARG API_URL=http://localhost:3000/api

# Copiar archivos de dependencias
COPY package*.json ./
COPY angular.json ./
COPY tsconfig*.json ./
COPY ionic.config.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Actualizar environment.prod.ts con API_URL
RUN echo "export const environment = { production: true, apiUrl: '${API_URL}' };" > src/environments/environment.prod.ts

# Construir la aplicación
RUN npm run build -- --configuration production

# Etapa de producción con nginx
FROM nginx:alpine

# Copiar archivos construidos
COPY --from=builder /app/www /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Iniciar nginx
CMD ["nginx", "-g", "daemon off;"]

