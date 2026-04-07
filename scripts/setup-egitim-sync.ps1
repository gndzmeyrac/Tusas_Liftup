$taskName = 'TusasLiftupEtkinlikSync'
$runnerPath = Join-Path $PSScriptRoot 'run-egitim-sync.cmd'

schtasks /Create /F /SC DAILY /ST 08:00 /TN $taskName /TR $runnerPath
Write-Host "Scheduled task created: $taskName -> $runnerPath"
