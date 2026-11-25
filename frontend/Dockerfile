# Frontend do IDENTIFY 2.0, em duas etapas:
#   1. Node compila o app React (Vite) para arquivos estaticos;
#   2. nginx serve esses arquivos e repassa /api ao container do backend.
# A imagem final nao tem Node: so o nginx e o site pronto (~90 MB).

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Vazio = o front chama a API no mesmo endereco da pagina (/api/analyze), e o
# nginx repassa ao backend. O Vite fixa este valor no build: muda-lo exige
# reconstruir a imagem.
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
