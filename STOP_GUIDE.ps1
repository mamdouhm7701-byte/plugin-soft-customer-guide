$ErrorActionPreference = 'Stop'
$guideRoot = $PSScriptRoot
$guideRecordPath = Join-Path $guideRoot '.sites-runtime/local-preview-process.json'
if (-not (Test-Path -LiteralPath $guideRecordPath)) { Write-Output 'No launcher-owned guide process was recorded.'; exit }
$guideRecord = Get-Content -LiteralPath $guideRecordPath -Raw | ConvertFrom-Json
$guideRecordedRoot = [IO.Path]::GetFullPath($guideRecord.root).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
$guideExpectedRoot = [IO.Path]::GetFullPath($guideRoot).TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar)
if ($guideRecordedRoot -ne $guideExpectedRoot) { throw 'Preview process belongs to a different project.' }
$guideProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($guideRecord.pid)"
if ($null -eq $guideProcess) { Write-Output 'Guide process already stopped.'; exit }
$guideCommand = [string]$guideProcess.CommandLine
if ($guideProcess.Name -ne 'node.exe' -or $guideCommand -notmatch 'scripts[/\\]run-framework\.mjs.+dev.+--hostname.+127\.0\.0\.1.+--port.+5174') { throw 'Process identity changed; nothing was stopped.' }
if ($guideCommand -notmatch [regex]::Escape($guideRoot)) { throw 'Process command does not belong to this checkout.' }
Stop-Process -Id $guideProcess.ProcessId
Write-Output 'Task-owned local guide process stopped.'
