$ErrorActionPreference = 'Stop'
$out = Join-Path $PSScriptRoot 'fw-result.txt'
$name = 'AlgoDetective Class Server (TCP 3001)'
$lines = @()

try {
  $lines += 'elevated = ' + ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
  Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue
  New-NetFirewallRule -DisplayName $name `
    -Description 'Algorithm Detective classroom app - inbound HTTP on port 3001' `
    -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Any | Out-Null
  $r = Get-NetFirewallRule -DisplayName $name
  $lines += 'created = True'
  $lines += 'displayName = ' + $r.DisplayName
  $lines += 'enabled = ' + $r.Enabled
  $lines += 'direction = ' + $r.Direction
  $lines += 'action = ' + $r.Action
  $lines += 'profile = ' + $r.Profile
} catch {
  $lines += 'created = False'
  $lines += 'error = ' + $_.Exception.Message
}

$lines | Out-File -FilePath $out -Encoding utf8
