<#
  ConvAudit — Comprehensive pre-launch smoke test.

  Usage:
    pwsh -File scripts/convaudit.ps1
    pwsh -File scripts/convaudit.ps1 -Base "https://staging.example.com"

  Run against a local dev/prod server. Requires the app to be running at -Base.
#>
param(
  [string]$Base = "http://localhost:3000"
)

Write-Host "=== ConvAudit — اختبار شامل ===" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Test-Route {
  param($name, $url, $expectedStatus)
  try {
    $response = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -UseBasicParsing -ErrorAction SilentlyContinue
    $status = $response.StatusCode
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
  }
  if ($status -eq $expectedStatus) {
    Write-Host "  [OK] $name ($status)" -ForegroundColor Green
    $script:passed++
  } else {
    Write-Host "  [FAIL] $name — متوقع $expectedStatus وجاء $status" -ForegroundColor Red
    $script:failed++
  }
}

function Test-API {
  param($name, $url, $body)
  try {
    $json = $body | ConvertTo-Json
    Invoke-RestMethod -Uri $url -Method POST `
      -ContentType "application/json" -Body $json -ErrorAction Stop | Out-Null
    Write-Host "  [OK] $name — شغال" -ForegroundColor Green
    $script:passed++
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
      Write-Host "  [OK] $name — محمي صح (401)" -ForegroundColor Green
      $script:passed++
    } elseif ($code -eq 429) {
      Write-Host "  [OK] $name — Rate limit شغال (429)" -ForegroundColor Green
      $script:passed++
    } else {
      Write-Host "  [FAIL] $name — خطأ $code" -ForegroundColor Red
      $script:failed++
    }
  }
}

# ══════════════════════════════════
Write-Host "`n[1] الصفحات العامة" -ForegroundColor Yellow
# ══════════════════════════════════
Test-Route "Landing Page"   "$Base/"          200
Test-Route "Login Page"     "$Base/login"     200
Test-Route "Pricing Page"   "$Base/pricing"   200
Test-Route "Blog"           "$Base/blog"      200
Test-Route "Docs"           "$Base/docs"      200
Test-Route "Affiliate"      "$Base/affiliate" 200

# ══════════════════════════════════
Write-Host "`n[2] الصفحات المحمية (يجب redirect)" -ForegroundColor Yellow
# ══════════════════════════════════
Test-Route "Dashboard"          "$Base/dashboard"          307
Test-Route "New Audit"          "$Base/audit/new"          307
Test-Route "History"            "$Base/history"            307
Test-Route "Reports"            "$Base/reports"            307
Test-Route "AI Center"          "$Base/ai-center"          307
Test-Route "Watch"              "$Base/watch"              307
Test-Route "Watch Alerts"       "$Base/watch/alerts"       307
Test-Route "Settings"           "$Base/settings"           307
Test-Route "Settings Billing"   "$Base/settings/billing"   307
Test-Route "Settings Usage"     "$Base/settings/usage"     307

# ══════════════════════════════════
Write-Host "`n[3] API Routes" -ForegroundColor Yellow
# ══════════════════════════════════
Test-Route "Status API"    "$Base/api/status"        200
# NextResponse.redirect() defaults to 307 (Temporary Redirect) in the App Router, not 302.
Test-Route "OAuth Google"  "$Base/api/oauth/google"   307
Test-Route "Auth Callback" "$Base/auth/callback"      307

# ══════════════════════════════════
Write-Host "`n[4] صفحات يجب ألا تكون 404" -ForegroundColor Yellow
# ══════════════════════════════════
# /quiz is a next.config.ts redirect (temporary, 307) to /onboarding.
# /onboarding itself IS middleware-gated and correctly returns 307 for unauthenticated users.
Test-Route "Quiz Redirect"      "$Base/quiz"         307
Test-Route "Onboarding"         "$Base/onboarding"   307

# ══════════════════════════════════
Write-Host "`n[5] API POST Routes" -ForegroundColor Yellow
# ══════════════════════════════════
Test-API "Audit API"    "$Base/api/audit"    @{productUrl="https://example.com"}
Test-API "Generate API" "$Base/api/generate" @{productUrl="https://example.com"}
# Checkout route validates { planId: "pro" | "business", period: "monthly" | "yearly" } via Zod
# BEFORE checking auth, so it must be sent with the real shape to reach the 401 auth check.
Test-API "Checkout API" "$Base/api/checkout" @{planId="pro"; period="monthly"}
Test-API "Chat API"     "$Base/api/chat"     @{message="مرحبا"}

# ══════════════════════════════════
Write-Host "`n[6] ENV Variables" -ForegroundColor Yellow
# ══════════════════════════════════
$envVars = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GEMINI_API_KEY",
  "FIRECRAWL_API_KEY",
  "KASHIER_MERCHANT_ID",
  "KASHIER_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "RESEND_API_KEY"
)

if (Test-Path ".env.local") {
  $envContent = Get-Content ".env.local" -Raw
  foreach ($var in $envVars) {
    if ($envContent -match "$var=.+") {
      Write-Host "  [OK] $var" -ForegroundColor Green
      $passed++
    } else {
      Write-Host "  [FAIL] $var — ناقص" -ForegroundColor Red
      $failed++
    }
  }
} else {
  Write-Host "  [FAIL] .env.local غير موجود" -ForegroundColor Red
  $failed++
}

# ══════════════════════════════════
Write-Host "`n[7] الملفات الأساسية" -ForegroundColor Yellow
# ══════════════════════════════════
$files = @(
  # Next.js 16 replaced middleware.ts with proxy.ts; auth logic lives in lib/supabase/middleware.ts
  "src/proxy.ts",
  "src/lib/supabase/middleware.ts",
  "src/lib/gemini.ts",
  "src/lib/firecrawl.ts",
  "src/lib/supabase.ts",
  "src/lib/plan-gates.ts",
  "src/lib/kashier.ts",
  "src/lib/pdf-generator.ts",
  "src/services/notification.ts",
  "src/services/weekly-report.ts",
  "src/app/api/webhook/kashier/route.ts",
  "src/app/api/chat/route.ts",
  "src/components/audit/customer-eye-test.tsx",
  "src/components/audit/quick-fixes.tsx",
  "src/components/audit/content-improver.tsx",
  "src/components/ui/plan-gate.tsx"
)

foreach ($f in $files) {
  if (Test-Path $f) {
    $size = (Get-Item $f).Length
    if ($size -gt 100) {
      Write-Host "  [OK] $f" -ForegroundColor Green
      $passed++
    } else {
      Write-Host "  [WARN] $f — فاضي" -ForegroundColor Yellow
      $failed++
    }
  } else {
    Write-Host "  [FAIL] $f — غير موجود" -ForegroundColor Red
    $failed++
  }
}

# ══════════════════════════════════
Write-Host "`n[8] TypeScript Check" -ForegroundColor Yellow
# ══════════════════════════════════
$tsc = npx tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) {
  Write-Host "  [OK] TypeScript — بدون أخطاء" -ForegroundColor Green
  $passed++
} else {
  Write-Host "  [FAIL] TypeScript — فيه أخطاء:" -ForegroundColor Red
  Write-Host $tsc -ForegroundColor Red
  $failed++
}

# ══════════════════════════════════
Write-Host "`n========================================" -ForegroundColor White
Write-Host "النتيجة النهائية" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor White
Write-Host "نجح  : $passed" -ForegroundColor Green
Write-Host "فشل  : $failed" -ForegroundColor Red

$total = $passed + $failed
if ($total -gt 0) {
  Write-Host "النسبة: $([math]::Round(($passed/$total)*100))%" -ForegroundColor Cyan
}

if ($failed -eq 0) {
  Write-Host "`nالموقع جاهز للإطلاق!" -ForegroundColor Green
} elseif ($failed -le 5) {
  Write-Host "`nقريب من الجاهزية — أصلح الأخطاء أعلاه" -ForegroundColor Yellow
} else {
  Write-Host "`nيحتاج إصلاحات قبل الإطلاق" -ForegroundColor Red
}
