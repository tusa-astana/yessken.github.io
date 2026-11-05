param(
    [string]$WebAppUrl = $env:TUSA_PUBLIC_WEBAPP_URL,
    [switch]$ConfigureTelegram
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$backendRoot = (Resolve-Path (Join-Path $repoRoot '..\backend\TusaMap.Api')).Path
$databaseDirectory = Join-Path $env:LOCALAPPDATA 'TusaMap'
New-Item -ItemType Directory -Path $databaseDirectory -Force | Out-Null

Push-Location $repoRoot
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Angular production build failed.' }
}
finally {
    Pop-Location
}

$frontendPath = Join-Path $repoRoot 'dist\tusa-map\browser'
if (-not (Test-Path (Join-Path $frontendPath 'index.html'))) {
    throw "Built frontend index.html not found under $frontendPath"
}

$env:Frontend__Path = $frontendPath
$env:ConnectionStrings__Default = "Data Source=$(Join-Path $databaseDirectory 'meetups-local.db')"
$env:PORT = '5001'
$env:ASPNETCORE_ENVIRONMENT = 'Development'
$env:DOTNET_ENVIRONMENT = 'Development'
$env:Telegram__ConfigureOnStartup = $ConfigureTelegram.IsPresent.ToString().ToLowerInvariant()
$env:Telegram__HideSwagger = 'true'
if (-not [string]::IsNullOrWhiteSpace($WebAppUrl)) {
    $normalizedWebAppUrl = $WebAppUrl.TrimEnd('/')
    if ($normalizedWebAppUrl -notmatch '^https://[^/]+$') {
        throw 'WebAppUrl must be an HTTPS origin without a path, for example https://your-name.trycloudflare.com.'
    }
    $env:Telegram__WebAppUrl = $normalizedWebAppUrl
    $env:Telegram__WebhookUrl = "$normalizedWebAppUrl/api/telegram/webhook"
    Write-Host "Telegram /start will open $normalizedWebAppUrl/events"
} elseif ($ConfigureTelegram) {
    throw 'Pass -WebAppUrl with the current public HTTPS origin when configuring Telegram.'
}
if ($ConfigureTelegram) {
    Write-Host 'Telegram menu button and webhook will be configured for the current public URL.'
}
Write-Host 'Starting TUSA frontend + API at http://localhost:5001/'
Write-Host 'For a public Telegram Mini App, expose this single origin through an HTTPS tunnel.'
Write-Host 'Press Ctrl+C to stop the local server.'

dotnet run --no-launch-profile --project (Join-Path $backendRoot 'TusaMap.Api.csproj')
