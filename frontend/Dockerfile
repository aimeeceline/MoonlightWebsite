# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# nhận biến build-time từ compose (REACT_APP_*)
ARG REACT_APP_USER_API
ARG REACT_APP_PRODUCT_API
ARG REACT_APP_ORDER_API
ENV REACT_APP_USER_API=$REACT_APP_USER_API
ENV REACT_APP_PRODUCT_API=$REACT_APP_PRODUCT_API
ENV REACT_APP_ORDER_API=$REACT_APP_ORDER_API
RUN npm run build

# --- Runtime stage (Nginx) ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
