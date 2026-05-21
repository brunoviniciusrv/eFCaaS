# ─── Estágio 1: Build ────────────────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /app

# Copiar apenas o pom.xml primeiro para aproveitar o cache de dependências
COPY pom.xml .
RUN mvn dependency:go-offline -q

# Copiar os fontes e compilar
COPY src ./src
RUN mvn package -DskipTests -q

# ─── Estágio 2: Runtime ──────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Usuário não-root
RUN addgroup --system efcaas && adduser --system --ingroup efcaas efcaas
USER efcaas

COPY --from=build /app/target/efcaas-api-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]
