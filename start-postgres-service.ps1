# PowerShell script to start PostgreSQL service with admin privileges
Write-Host "Starting PostgreSQL Service..." -ForegroundColor Green

# Try different possible service names
$serviceNames = @("postgresql-x64-17", "postgresql-17", "PostgreSQL")

foreach ($serviceName in $serviceNames) {
    try {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            Write-Host "Found service: $serviceName" -ForegroundColor Yellow
            
            if ($service.Status -eq "Running") {
                Write-Host "✅ PostgreSQL is already running!" -ForegroundColor Green
                break
            } else {
                Write-Host "Starting service: $serviceName" -ForegroundColor Yellow
                Start-Service -Name $serviceName
                Write-Host "✅ PostgreSQL service started successfully!" -ForegroundColor Green
                break
            }
        }
    } catch {
        Write-Host "Failed to start $serviceName : $($_.Exception.Message)" -ForegroundColor Red
        continue
    }
}

# Test if PostgreSQL is accessible
Write-Host "`nTesting PostgreSQL connection..." -ForegroundColor Yellow
try {
    $env:PGPASSWORD = "ZionGrocery2024!"
    & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d postgres -c "SELECT version();" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ PostgreSQL is accessible!" -ForegroundColor Green
    } else {
        Write-Host "❌ PostgreSQL connection failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing PostgreSQL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
