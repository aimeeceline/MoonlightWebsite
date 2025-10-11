# =========================
#  BUILD STAGE
# =========================
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# chỉ copy csproj để restore nhanh
COPY Shared/Shared.csproj Shared/
COPY UserService/UserService.csproj UserService/

RUN dotnet restore "UserService/UserService.csproj"

# rồi mới copy full source
COPY . .

# publish
WORKDIR /src/UserService
RUN dotnet publish -c Release -o /app /p:UseAppHost=false


# =========================
#  RUNTIME STAGE
# =========================
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app .

EXPOSE 8080
ENTRYPOINT ["dotnet", "UserService.dll"]
