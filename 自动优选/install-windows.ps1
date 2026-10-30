param(
    [Parameter(Mandatory=$true)][string]$Panel,
    [string]$Entry = '/admin',
    [string]$Python = 'python.exe',
    [string]$Mihomo = 'C:\Program Files\Clash Verge\verge-mihomo.exe',
    [string]$TaskTime = '03:10'
)
$ErrorActionPreference = 'Stop'
$installRoot = Join-Path $env:LOCALAPPDATA 'CFNextOptimizer'
New-Item -ItemType Directory -Force -Path $installRoot | Out-Null
$identity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $installRoot /inheritance:r /grant:r "${identity}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Cannot protect optimizer directory' }
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'runner.py') -Destination (Join-Path $installRoot 'runner.py') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'history.py') -Destination (Join-Path $installRoot 'history.py') -Force
$pythonPath = (Get-Command $Python).Source
$configuration = [ordered]@{
    panel=$Panel; entry=$Entry; carrier='unicom'; time=$TaskTime;
    expected_asns=@(4837,9929); mihomo=$Mihomo;
    password_file=(Join-Path $installRoot 'panel.dpapi'); state_file=(Join-Path $installRoot 'state.json');
    storage_file=(Join-Path $installRoot 'storage.dpapi');
    ports=@(443,2053,2083,2087,2096,8443); screen_ips=32; candidates_per_backend=6;
    unified_delay=$true; download_timeout=45
}
$configPath = Join-Path $installRoot 'config.json'
$configuration | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $configPath -Encoding utf8
if ($env:CFNEXT_PANEL_PASSWORD) {
    $env:CFNEXT_PANEL_PASSWORD | & $pythonPath (Join-Path $installRoot 'runner.py') --config $configPath --set-password
    Remove-Item Env:CFNEXT_PANEL_PASSWORD
    if ($LASTEXITCODE -ne 0) { throw 'Credential encryption failed' }
} elseif (-not (Test-Path -LiteralPath $configuration.password_file)) {
    throw 'Set CFNEXT_PANEL_PASSWORD for first installation; it is stored using this Windows user DPAPI'
}
if (-not (Test-Path -LiteralPath $configuration.storage_file)) { throw 'Missing protected backend KV credentials (storage.dpapi)' }
$backgroundPython = Join-Path ([IO.Path]::GetDirectoryName($pythonPath)) 'pythonw.exe'
if (-not (Test-Path -LiteralPath $backgroundPython)) { $backgroundPython = $pythonPath }
$action = New-ScheduledTaskAction -Execute $backgroundPython -Argument ('"' + (Join-Path $installRoot 'runner.py') + '" --config "' + $configPath + '"') -WorkingDirectory $installRoot
$daily = New-ScheduledTaskTrigger -Daily -At $TaskTime
$retry = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Hours 1)
$login = New-ScheduledTaskTrigger -AtLogOn -User $identity
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RunOnlyIfNetworkAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Hours 2) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId $identity -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'CFNext-Unicom-Daily' -Action $action -Trigger @($daily,$retry,$login) -Settings $settings -Principal $principal -Description 'Daily Unicom proxy benchmarks; uploads one batch per backend/day; isolated Mihomo only' -Force | Out-Null
Write-Output 'Installed CFNext-Unicom-Daily (03:10 default, login/hourly catch-up, current Windows session).'
