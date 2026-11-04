param(
    [int]$Port = 8123,
    [string]$Hostname = '127.0.0.1'
)

$ErrorActionPreference = 'Continue'
$url = "http://${Hostname}:${Port}"

function Test-Serving([string]$h, [int]$p) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $iar = $client.BeginConnect($h, $p, $null, $null)
        $ok = $iar.AsyncWaitHandle.WaitOne(500) -and $client.Connected
        $client.Close()
        return $ok
    } catch { return $false }
}

if (Test-Serving $Hostname $Port) {
    Write-Host $url
    exit 0
}

$scriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$projectDir = (Resolve-Path (Join-Path $scriptDir '..')).Path
$logPath    = Join-Path $env:TEMP "brewdesk-flutter-$Port.log"
Remove-Item $logPath -ErrorAction SilentlyContinue

# WMI Win32_Process.Create lanza el proceso realmente independiente del árbol
# de PowerShell — no lo mata cuando la terminal se cierra ni cuando salimos.
$cmdLine = "cmd.exe /c cd /d `"$projectDir`" && flutter run -d web-server --web-port=$Port --web-hostname=$Hostname > `"$logPath`" 2>&1"

$startup = ([WMIClass]'Win32_ProcessStartup').CreateInstance()
$startup.ShowWindow = 0   # SW_HIDE
$result = ([WMIClass]'Win32_Process').Create($cmdLine, $projectDir, $startup)

if ($result.ReturnValue -ne 0) {
    Write-Host "Fallo al lanzar Flutter. ReturnValue=$($result.ReturnValue)"
    exit 1
}

$deadline = (Get-Date).AddSeconds(120)
while ((Get-Date) -lt $deadline) {
    if (Test-Path $logPath) {
        $content = Get-Content $logPath -Raw -ErrorAction SilentlyContinue
        if ($content -and $content -match 'is being served at (http\S+)') {
            Write-Host $Matches[1]
            exit 0
        }
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "Timeout esperando a Flutter. Log: $logPath"
exit 1
