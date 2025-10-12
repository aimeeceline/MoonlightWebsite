# ---------- Build React ----------
FROM node:18-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/. .
# build sản phẩm CRA
RUN npm run build

# ---------- Serve với Nginx ----------
FROM nginx:1.25-alpine AS run
# copy build ra nginx
COPY --from=build /app/build /usr/share/nginx/html

# nếu bạn đã có nginx.conf ở frontend/nginx.conf thì dùng dòng dưới:
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
# (nếu nginx.conf của bạn ở root repo, đổi đường dẫn COPY cho khớp)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
