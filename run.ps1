$ErrorActionPreference = "Stop"

$projectRoot = $PSScriptRoot
$backendRoot = Join-Path $projectRoot "backend"
$pythonPath = Join-Path $backendRoot ".venv\Scripts\python.exe"

if (-not (Test-Path -LiteralPath $pythonPath)) {
    throw "백엔드 가상환경을 찾을 수 없습니다: $pythonPath"
}

Write-Host ""
Write-Host "  비움 개발 서버가 시작됩니다. 종료하려면 Ctrl+C"
Write-Host "  웹             -> http://127.0.0.1:8000"
Write-Host "  API 문서        -> http://127.0.0.1:8000/docs"
Write-Host "  수수료 지역 API -> http://127.0.0.1:8000/api/v1/waste-fees/regions"
Write-Host ""

& $pythonPath -m uvicorn app.main:app `
    --app-dir $backendRoot `
    --host 0.0.0.0 `
    --port 8000 `
    --reload
