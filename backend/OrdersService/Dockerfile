# build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# chỉ copy csproj để restore nhanh và tránh kéo bin/obj
COPY ["OrdersService.csproj", "./"]
RUN dotnet restore "OrdersService.csproj"

# giờ mới copy toàn bộ mã nguồn (đã có .dockerignore chặn bin/obj)
COPY . .
RUN dotnet publish "OrdersService.csproj" -c Release -o /app /p:UseAppHost=false

# run
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENTRYPOINT ["dotnet", "OrdersService.dll"]
