$killed = 0
Get-Process dart -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction Stop
        $killed++
    } catch {}
}
Write-Host "Procesos dart terminados: $killed"
