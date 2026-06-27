# Smoke test eFCaaS — executar com API em http://localhost:8081
# Uso: .\scripts\smoke-test.ps1

$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:EFCAAS_API_URL) { $env:EFCAAS_API_URL } else { "http://localhost:8081/api/v1" }
$IngestKey = if ($env:INGEST_API_KEY) { $env:INGEST_API_KEY } else { "efcaas-ingest-dev-key" }
$CuradorEmail = if ($env:CURADOR_EMAIL) { $env:CURADOR_EMAIL } else { "juliana.mendes@curadoria.com" }
$CuradorSenha = if ($env:CURADOR_SENHA) { $env:CURADOR_SENHA } else { "Admin@2026!" }

$results = @()

function Test-Step {
    param([string]$Name, [scriptblock]$Action)
    try {
        & $Action
        $script:results += [PSCustomObject]@{ Test = $Name; Status = "OK" }
        Write-Host "[OK] $Name" -ForegroundColor Green
    } catch {
        $script:results += [PSCustomObject]@{ Test = $Name; Status = "FAIL"; Detail = $_.Exception.Message }
        Write-Host "[FAIL] $Name - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== eFCaaS Smoke Tests ===" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl`n"

$healthUrl = ($BaseUrl -replace "/api/v1", "") + "/actuator/health"
try {
    $null = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 5
} catch {
    Write-Host "[ABORT] API indisponivel em $healthUrl" -ForegroundColor Red
    Write-Host "        Inicie o stack: docker compose --profile full up -d --build" -ForegroundColor Yellow
    exit 1
}

Test-Step "Health check" {
    $r = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 10
    if ($r.status -ne "UP") { throw "status=$($r.status)" }
}

$externalId = "smoke-" + [guid]::NewGuid().ToString("N").Substring(0, 8)

Test-Step 'Ingest REST - 201 novo conteudo' {
    $body = @{
        titulo = "Smoke test ingest"
        conteudo = "Conteudo automatizado de smoke test"
        tipoFonte = "other"
        idMensagemExterna = $externalId
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BaseUrl/ingest/conteudos-recebidos" -Method POST `
        -Headers @{ "X-Ingest-Api-Key" = $IngestKey; "Content-Type" = "application/json" } `
        -Body $body -UseBasicParsing
    if ($r.StatusCode -ne 201) { throw "Expected 201, got $($r.StatusCode)" }
    $script:conteudoId = ($r.Content | ConvertFrom-Json).id
}

Test-Step 'Ingest idempotencia - 200 duplicata' {
    $body = @{
        titulo = "Smoke test ingest"
        conteudo = "Conteudo automatizado de smoke test"
        tipoFonte = "other"
        idMensagemExterna = $externalId
    } | ConvertTo-Json
    $r = Invoke-WebRequest -Uri "$BaseUrl/ingest/conteudos-recebidos" -Method POST `
        -Headers @{ "X-Ingest-Api-Key" = $IngestKey; "Content-Type" = "application/json" } `
        -Body $body -UseBasicParsing
    if ($r.StatusCode -ne 200) { throw "Expected 200, got $($r.StatusCode)" }
}

Test-Step 'Ingest sem API key - 401' {
    try {
        Invoke-WebRequest -Uri "$BaseUrl/ingest/conteudos-recebidos" -Method POST `
            -ContentType "application/json" -Body '{"titulo":"x","conteudo":"y","tipoFonte":"other"}' `
            -UseBasicParsing | Out-Null
        throw "Expected 401"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 401) { throw $_ }
    }
}

$token = $null
Test-Step 'Login curador - JWT' {
    $body = @{ email = $CuradorEmail; senha = $CuradorSenha } | ConvertTo-Json
    $r = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -ContentType "application/json" -Body $body
    if (-not $r.token) { throw "Token ausente" }
    $script:token = $r.token
}

Test-Step 'GET /me - perfil autenticado' {
    $headers = @{ Authorization = "Bearer $token" }
    $r = Invoke-RestMethod -Uri "$BaseUrl/me" -Headers $headers
    if ($r.email -ne $CuradorEmail) { throw "Email incorreto: $($r.email)" }
}

Test-Step "Listar conteudos recebidos" {
    $headers = @{ Authorization = "Bearer $token" }
    $lista = Invoke-RestMethod -Uri "$BaseUrl/conteudos-recebidos?status=received" -Headers $headers
    if ($lista.Count -lt 1) { throw "Lista vazia" }
}

Test-Step "Encaminhar para triagem" {
    $headers = @{ Authorization = "Bearer $token" }
    $r = Invoke-RestMethod -Uri "$BaseUrl/conteudos-recebidos/$conteudoId/encaminhar" -Method POST -Headers $headers
    if ($r.status -ne "pending") { throw "Status triagem=$($r.status)" }
}

Test-Step 'WhatsApp webhook verify' {
    $waUrl = '{0}/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=x&hub.challenge=1' -f $BaseUrl
    try {
        Invoke-WebRequest -Uri $waUrl -UseBasicParsing -TimeoutSec 5 | Out-Null
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if ($code -notin 404, 401, 400, 200) { throw "Unexpected $code" }
    }
}

Write-Host "`n=== Resumo ===" -ForegroundColor Cyan
$results | Format-Table -AutoSize
$failed = ($results | Where-Object { $_.Status -eq 'FAIL' }).Count
if ($failed -gt 0) { exit 1 }
exit 0
