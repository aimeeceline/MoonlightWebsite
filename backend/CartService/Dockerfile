FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# context hiện tại là ./backend → copy toàn bộ backend
COPY . .
# restore/publish TRÊN file csproj đúng đường dẫn
RUN dotnet restore CartService/CartService.csproj
RUN dotnet publish CartService/CartService.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CartService.dll"]
