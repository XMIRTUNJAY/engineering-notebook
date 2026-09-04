# ============================================================
# evidence-pack.ps1
# Read-only collector: builds a single Markdown evidence file per
# project to attach to the tutorial-writing prompt.
# Usage:
#   powershell -NoProfile -ExecutionPolicy Bypass `
#     -File tools/evidence-pack.ps1 `
#     -ProjectPath "C:\Users\kumar\networth-tracker\networth-app" `
#     -OutFile "evidence-networth-app.md"
# ASCII only. PowerShell 5.1 compatible.
# ============================================================
param(
  [Parameter(Mandatory = $true)][string]$ProjectPath,
  [Parameter(Mandatory = $true)][string]$OutFile
)

$ErrorActionPreference = "SilentlyContinue"
$MaxFileBytes = 65536
$MaxTreeEntries = 400
$MaxGrepHits = 60

$SkipDirs = @(
  "node_modules", ".git", ".next", "dist", "build", "coverage",
  "__pycache__", ".venv", "venv", "site-packages", ".cache", ".turbo"
)

function Test-SkipDir([string]$Name) {
  foreach ($s in $SkipDirs) { if ($Name -ieq $s) { return $true } }
  return $false
}

function Get-Tree([string]$Root, [string]$Prefix, [int]$Depth, $Out) {
  if ($Depth -gt 4) { return }
  if ($Out.Count -ge $MaxTreeEntries) { return }
  try { $items = Get-ChildItem -LiteralPath $Root -Force -ErrorAction Stop } catch { return }
  foreach ($i in ($items | Sort-Object { -not $_.PSIsContainer }, Name)) {
    if ($Out.Count -ge $MaxTreeEntries) { return }
    if ($i.PSIsContainer -and (Test-SkipDir $i.Name)) {
      $Out.Add($Prefix + $i.Name + "/ [skipped]") | Out-Null
      continue
    }
    if ($i.PSIsContainer) {
      $Out.Add($Prefix + $i.Name + "/") | Out-Null
      Get-Tree -Root $i.FullName -Prefix ("  " + $Prefix) -Depth ($Depth + 1) -Out $Out
    } else {
      $Out.Add($Prefix + $i.Name) | Out-Null
    }
  }
}

function Read-SmallFile([string]$Path) {
  try {
    $fi = Get-Item -LiteralPath $Path -ErrorAction Stop
    if ($fi.Length -gt $MaxFileBytes) {
      return "(file too large: " + $fi.Length + " bytes, skipped)"
    }
    return (Get-Content -LiteralPath $Path -Raw -ErrorAction Stop)
  } catch { return "(unreadable: $Path)" }
}

$md = New-Object System.Collections.Generic.List[string]
$md.Add("# EVIDENCE PACK")
$md.Add(("Project: " + $ProjectPath))
$md.Add(("Generated: " + (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')))
$md.Add("")

# --- git log ---
$md.Add("## Git history (last 30)")
try {
  $log = git -C $ProjectPath log --oneline -30 2>$null
  if ($log) { foreach ($l in $log) { $md.Add("  " + $l) } }
  else { $md.Add("(no git history available)") }
} catch { $md.Add("(git not available)") }
$md.Add("")

# --- tree ---
$md.Add("## Source tree (depth 4, junk dirs skipped)")
$tree = New-Object System.Collections.Generic.List[string]
Get-Tree -Root $ProjectPath -Prefix "" -Depth 0 -Out $tree
foreach ($t in $tree) { $md.Add("  " + $t) }
$md.Add("")

# --- key files ---
$KeyFiles = @(
  "README.md", "README", "package.json", "pyproject.toml",
  "requirements.txt", "Dockerfile", "docker-compose.yml",
  "next.config.js", "next.config.mjs", "next.config.ts",
  "tsconfig.json", ".github/workflows"
)
$md.Add("## Key files")
foreach ($k in $KeyFiles) {
  $fp = Join-Path $ProjectPath $k
  if (Test-Path -LiteralPath $fp) {
    $md.Add("")
    $md.Add(("### " + $k))
    $md.Add('```')
    if ((Get-Item -LiteralPath $fp -ErrorAction SilentlyContinue).PSIsContainer) {
      try {
        foreach ($f in (Get-ChildItem -LiteralPath $fp -File -ErrorAction Stop)) {
          $md.Add(("--- " + $f.Name + " ---"))
          $md.Add((Read-SmallFile $f.FullName))
        }
      } catch { $md.Add("(unreadable dir)") }
    } else {
      $md.Add((Read-SmallFile $fp))
    }
    $md.Add('```')
  }
}
$md.Add("")

# --- TODO / FIXME grep ---
$md.Add("## TODO / FIXME / HACK hits (max 60, source files only)")
$hits = 0
try {
  $files = Get-ChildItem -LiteralPath $ProjectPath -Recurse -File -ErrorAction Stop |
    Where-Object {
      $skip = $false
      foreach ($part in ($_.FullName -split '\\')) {
        if (Test-SkipDir $part) { $skip = $true; break }
      }
      -not $skip
    } |
    Where-Object { $_.Length -lt $MaxFileBytes } |
    Select-Object -First 2000
  foreach ($f in $files) {
    if ($hits -ge $MaxGrepHits) { break }
    try {
      $m = Select-String -LiteralPath $f.FullName -Pattern "TODO|FIXME|HACK|XXX|console\.log" -SimpleMatch:$false -ErrorAction Stop |
        Select-Object -First 3
      foreach ($hit in $m) {
        if ($hits -ge $MaxGrepHits) { break }
        $rel = $f.FullName.Substring($ProjectPath.Length).TrimStart('\')
        $md.Add(("  " + $rel + ":" + $hit.LineNumber + ": " + $hit.Line.Trim()))
        $hits++
      }
    } catch {}
  }
  if ($hits -eq 0) { $md.Add("  (none found)") }
} catch { $md.Add("  (scan failed)") }
$md.Add("")

# --- tests ---
$md.Add("## Test files")
try {
  $tests = Get-ChildItem -LiteralPath $ProjectPath -Recurse -File -ErrorAction Stop |
    Where-Object { $_.Name -match 'test|spec' } |
    Where-Object {
      $skip = $false
      foreach ($part in ($_.FullName -split '\\')) {
        if (Test-SkipDir $part) { $skip = $true; break }
      }
      -not $skip
    } |
    Select-Object -First 40
  foreach ($t in $tests) { $md.Add(("  " + $t.FullName.Substring($ProjectPath.Length).TrimStart('\'))) }
  if (-not $tests -or $tests.Count -eq 0) { $md.Add("  (none found)") }
} catch { $md.Add("  (scan failed)") }

$md | Out-File -LiteralPath $OutFile -Encoding UTF8
Write-Host ("Evidence pack written: " + $OutFile)
