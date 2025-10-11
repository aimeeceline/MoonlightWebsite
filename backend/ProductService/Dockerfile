# build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ProductService/ProductService.csproj ProductService/
COPY Shared/Shared.csproj Shared/
RUN dotnet restore ProductService/ProductService.csproj
COPY . .
WORKDIR /src/ProductService
RUN dotnet publish -c Release -o /app /p:UseAppHost=false

# run
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet","ProductService.dll"]
