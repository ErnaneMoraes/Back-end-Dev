$port = 8080

# Verifica se a porta está em uso
$connection = netstat -aon | Select-String ":$port\s+.*LISTENING\s+(\d+)" | ForEach-Object {
    $_.Matches[0].Groups[1].Value
}

# Mata o processo, se encontrado
if ($connection) {
    Write-Output "Porta $port em uso. Matando processo com PID $connection..."
    Stop-Process -Id $connection -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

# Inicia o servidor Node.js em segundo plano (sem abrir janela)
Start-Process "node" -ArgumentList "app.js" -WindowStyle Hidden

# Aguarda e abre navegador
Start-Sleep -Seconds 2
Start-Process "http://localhost:$port"
