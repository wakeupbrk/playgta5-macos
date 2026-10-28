$ErrorActionPreference = 'Stop'
$pythonExe = 'C:\Users\sebas\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (-not (Test-Path -LiteralPath $pythonExe)) {
    $pythonExe = (Get-Command python -ErrorAction Stop).Source
}
& $pythonExe (Join-Path $PSScriptRoot 'serve_local.py')
