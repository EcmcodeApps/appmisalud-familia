# Script de arranque del backend AppMiSalud
# Ejecutar desde: E:\Proyectos\appmisalud-familia\services\api\
# Uso: .\start.ps1

$VENV = "E:\venvs\appmisalud-api"
$API_DIR = $PSScriptRoot

Write-Host "AppMiSalud API - Iniciando..." -ForegroundColor Cyan

# Activar venv
& "$VENV\Scripts\Activate.ps1"

# Ir al directorio de la API
Set-Location $API_DIR

# Instalar/actualizar dependencias si hace falta
pip install -r requirements.txt -q

# Arrancar uvicorn
Write-Host "Servidor: http://localhost:8000" -ForegroundColor Green
Write-Host "Docs:     http://localhost:8000/docs" -ForegroundColor Green

uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level info
