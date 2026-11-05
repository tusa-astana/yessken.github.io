$ErrorActionPreference = 'Stop'

$cloudflared = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflared) {
    throw 'cloudflared is not installed. Install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/.'
}

$listener = Get-NetTCPConnection -LocalPort 5001 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
    throw 'TUSA is not listening on port 5001. Start scripts/start-meetups-local.ps1 first in another terminal.'
}

Write-Host 'Creating a temporary HTTPS tunnel to the local TUSA frontend + API.'
Write-Host 'Keep this terminal open; the URL stops working when the tunnel stops.'
& $cloudflared.Source tunnel --url http://localhost:5001
