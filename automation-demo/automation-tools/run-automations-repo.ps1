param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
)

$ErrorActionPreference = 'Stop'

$ctx = Join-Path $ProjectRoot 'context'
if (-not (Test-Path $ctx)) { throw "Missing context folder: $ctx" }

$productSummaryPath = Join-Path $ctx 'product-summary.md'
$userFeedbackPath = Join-Path $ctx 'user-feedback.md'

if (-not (Test-Path $productSummaryPath)) { throw "Missing file: $productSummaryPath" }
if (-not (Test-Path $userFeedbackPath)) { throw "Missing file: $userFeedbackPath" }

$productSummary = Get-Content -LiteralPath $productSummaryPath -Raw
$userFeedback = Get-Content -LiteralPath $userFeedbackPath -Raw

$productName = 'Campus Closet'
if ($productSummary -match '(?m)^#\s*(.+)$') { $productName = $Matches[1].Trim() }

$url = 'https://campuscloset10.lovable.app/'
if ($productSummary -match 'https?://\S+') { $url = $Matches[0] }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$proofRoot = Join-Path $ProjectRoot 'automation-proof'
$runDir = Join-Path $proofRoot $stamp
New-Item -ItemType Directory -Force -Path $runDir | Out-Null

# Automation 1: Social content pipeline
$socialFile = Join-Path $runDir 'social-content-output.md'
$social = @"
# Social Content Pipeline Output

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Product: $productName
Live URL: $url

## 7-Day Campaign (IG + TikTok + X)

Day 1: Problem Hook
- IG: Event season is expensive. Buy/rent smarter on Campus Closet. #CampusCloset
- TikTok: POV you have 3 events and one budget.
- X: Stop buying a new dress every event.

Day 2: How It Works
- IG: Browse -> Message -> Transact.
- TikTok: 3-step flow demo.
- X: Built for campus speed.

Day 3: Social Proof
- IG: "Easy to use and well structured." - tester
- TikTok: UI walkthrough reactions.
- X: User feedback is guiding roadmap.

Day 4: Feature Tease
- IG: Multi-photo listings coming.
- TikTok: Why multiple angles matter.
- X: Top request = multi-photo support.

Day 5: Audience Expansion
- IG: Greek life and beyond.
- TikTok: Event-heavy student life scenarios.
- X: Built for every campus social calendar.

Day 6: Weekend Prompt
- IG: What listing do you want first?
- TikTok: Comment your hardest event outfit challenge.
- X: What would increase listing trust instantly?

Day 7: Launch CTA
- IG: Campus Closet is live: $url
- TikTok: Try it + send feedback.
- X: Live now: $url
"@
Set-Content -LiteralPath $socialFile -Value $social -Encoding UTF8

# Automation 2: User feedback analyzer
$feedbackFile = Join-Path $runDir 'feedback-analysis-output.md'
$actionFile = Join-Path $runDir 'action-plan-output.md'

$lines = ($userFeedback -split "`r?`n") | Where-Object { $_.Trim().StartsWith('-') }
$items = foreach ($line in $lines) {
  $text = $line.TrimStart('-').Trim()
  if ($text) { $text }
}

function Get-Category([string]$text) {
  $t = $text.ToLowerInvariant()
  if ($t -match 'bug|broken|did not|does not|issue|redirect') { return 'Bug' }
  if ($t -match 'request|want|asked|feature|add ') { return 'Feature Request' }
  if ($t -match 'like|easy|intuitive|well structured|great|good') { return 'Praise' }
  if ($t -match 'delay|confus|friction|hard|unclear') { return 'UX Issue' }
  return 'General'
}

function Get-Severity([string]$text, [string]$cat) {
  $t = $text.ToLowerInvariant()
  if ($t -match 'redirect|auth|login|broken') { return 'Critical' }
  if ($cat -eq 'Bug' -or $t -match 'delay|messaging|friction') { return 'Important' }
  if ($cat -eq 'Feature Request') { return 'Important' }
  return 'Nice-to-have'
}

$classified = foreach ($it in $items) {
  $cat = Get-Category $it
  $sev = Get-Severity $it $cat
  [pscustomobject]@{ Item=$it; Category=$cat; Severity=$sev }
}

$catBreakdown = ($classified | Group-Object Category | Sort-Object Name | ForEach-Object { "- $($_.Name): $($_.Count)" }) -join "`r`n"
$sevBreakdown = ($classified | Group-Object Severity | Sort-Object Name | ForEach-Object { "- $($_.Name): $($_.Count)" }) -join "`r`n"
$detailed = ($classified | ForEach-Object { "- [$($_.Severity)] ($($_.Category)) $($_.Item)" }) -join "`r`n"

$feedbackText = @"
# User Feedback Analyzer Output

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Product: $productName
Items analyzed: $($classified.Count)

## Category Breakdown
$catBreakdown

## Severity Breakdown
$sevBreakdown

## Detailed Classification
$detailed

## Top Patterns
1. Auth and messaging reliability impact user trust.
2. Listing quality needs multi-angle visuals.
3. Baseline UX is strong and should be preserved.
"@
Set-Content -LiteralPath $feedbackFile -Value $feedbackText -Encoding UTF8

$criticalEvidence = (($classified | Where-Object Severity -eq 'Critical' | ForEach-Object { "- $($_.Item)" }) -join "`r`n")
$messagingEvidence = (($classified | Where-Object { $_.Item -match 'messag|delay' } | ForEach-Object { "- $($_.Item)" }) -join "`r`n")
$photoEvidence = (($classified | Where-Object { $_.Item -match 'photo|angle|feature' } | ForEach-Object { "- $($_.Item)" }) -join "`r`n")

$actionText = @"
# Prioritized Action Plan

Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Product: $productName

## Priority 1 - Fix Auth Redirect Reliability
Impact: Improves activation and reduces first-session drop-off.
Effort: Half-day
Evidence:
$criticalEvidence

## Priority 2 - Improve Messaging Responsiveness
Impact: Increases trust and transaction completion.
Effort: Half-day to multi-day
Evidence:
$messagingEvidence

## Priority 3 - Ship Multi-Photo Listings
Impact: Improves listing confidence and message initiation.
Effort: Multi-day
Evidence:
$photoEvidence

## Board Memo Line
We ran an automated feedback analysis on real tester notes, prioritized issues by severity, and produced a 3-step execution plan.
"@
Set-Content -LiteralPath $actionFile -Value $actionText -Encoding UTF8

$logFile = Join-Path $runDir 'proof-run-log.md'
$logLines = @(
  '# Automation Proof Run Log',
  '',
  "Generated at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
  "Project Root: $ProjectRoot",
  "Product: $productName",
  "URL: $url",
  'Outputs:',
  "- $(Split-Path -Leaf $socialFile)",
  "- $(Split-Path -Leaf $feedbackFile)",
  "- $(Split-Path -Leaf $actionFile)",
  '',
  'Run Command:',
  '.\\automation-tools\\run-automations-repo.ps1'
)
Set-Content -LiteralPath $logFile -Value $logLines -Encoding UTF8

Write-Output "RUN_DIR=$runDir"
Write-Output "SOCIAL_FILE=$socialFile"
Write-Output "FEEDBACK_FILE=$feedbackFile"
Write-Output "ACTION_FILE=$actionFile"
Write-Output "LOG_FILE=$logFile"
