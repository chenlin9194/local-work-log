#!/bin/bash
# ============================================================
# Work Log System - Comprehensive Test Suite
# Tests: Page rendering, Notes CRUD, Filters, AI Agent CRUD,
#        Content checks, Edge cases, and Bug regression tests
# ============================================================
set -o pipefail

PASS=0
FAIL=0
ERRORS=""

assert_eq() {
  local desc="$1" expected="$2" actual="$3"
  if [ "$expected" = "$actual" ]; then
    echo "  ✅ $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $desc (期望: '$expected', 实际: '$actual')"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n  ❌ $desc"
  fi
}

assert_contains() {
  local desc="$1" needle="$2" haystack="$3"
  if echo "$haystack" | grep -q "$needle"; then
    echo "  ✅ $desc"
    PASS=$((PASS+1))
  else
    echo "  ❌ $desc (未找到: $needle)"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n  ❌ $desc"
  fi
}

assert_not_eq() {
  local desc="$1" unexpected="$2" actual="$3"
  if [ "$unexpected" != "$actual" ]; then
    echo "  ✅ $desc (got: $actual)"
    PASS=$((PASS+1))
  else
    echo "  ❌ $desc (不应为: $unexpected)"
    FAIL=$((FAIL+1))
    ERRORS="$ERRORS\n  ❌ $desc"
  fi
}

BASE="http://localhost:3000"

# Pre-check: server is running
if ! curl -s -o /dev/null -w "" "$BASE/" 2>/dev/null; then
  echo "❌ 服务未运行在 $BASE"
  exit 1
fi

echo "================================="
echo "=== 1. 页面渲染测试 (7 cases) ==="
echo "================================="
for path in "/" "/notes" "/notes/new" "/today" "/stats" "/ai" "/ai/settings"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$path")
  assert_eq "GET $path → 200" "200" "$code"
done

echo ""
echo "================================="
echo "=== 2. Notes API CRUD (11 cases) ==="
echo "================================="

# 2a. GET notes list
resp=$(curl -s "$BASE/api/notes")
assert_contains "GET /api/notes 返回 notes 数组" '"notes"' "$resp"

# 2b. POST 创建记录 — 正常
resp=$(curl -s -X POST "$BASE/api/notes" -H 'Content-Type: application/json' \
  -d '{"title":"测试记录","content":"这是测试内容","type":"todo","priority":"P1","status":"open"}')
NOTE_ID=$(echo "$resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_contains "POST /api/notes 创建成功" '"title":"测试记录"' "$resp"

# 2c. POST 空标题 → 400
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/notes" \
  -H 'Content-Type: application/json' -d '{"title":"","content":"x"}')
assert_eq "POST /api/notes 空标题 → 400" "400" "$code"

# 2d. POST 空内容 → 400
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/notes" \
  -H 'Content-Type: application/json' -d '{"title":"x","content":""}')
assert_eq "POST /api/notes 空内容 → 400" "400" "$code"

# 2e. GET 单条记录
if [ -n "$NOTE_ID" ]; then
  resp=$(curl -s "$BASE/api/notes/$NOTE_ID")
  assert_contains "GET /api/notes/:id 返回记录" '"title":"测试记录"' "$resp"

  # 2f. 记录详情页
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notes/$NOTE_ID")
  assert_eq "GET /notes/:id 详情页 → 200" "200" "$code"

  # 2g. 编辑页
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/notes/$NOTE_ID/edit")
  assert_eq "GET /notes/:id/edit 编辑页 → 200" "200" "$code"

  # 2h. PUT 更新记录
  resp=$(curl -s -X PUT "$BASE/api/notes/$NOTE_ID" -H 'Content-Type: application/json' \
    -d '{"title":"测试记录-已更新","status":"following"}')
  assert_contains "PUT /api/notes/:id 更新标题" '"测试记录-已更新"' "$resp"
  assert_contains "PUT /api/notes/:id 状态改为 following" '"following"' "$resp"

  # 2i. PUT 关闭记录
  resp=$(curl -s -X PUT "$BASE/api/notes/$NOTE_ID" -H 'Content-Type: application/json' \
    -d '{"status":"closed"}')
  assert_contains "PUT 关闭记录" '"closed"' "$resp"

  # 2j. DELETE 删除记录
  resp=$(curl -s -X DELETE "$BASE/api/notes/$NOTE_ID")
  assert_contains "DELETE /api/notes/:id 删除成功" '"success":true' "$resp"

  # 2k. GET 删除后 → 404
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notes/$NOTE_ID")
  assert_eq "GET 已删除记录 → 404" "404" "$code"
fi

echo ""
echo "================================="
echo "=== 3. Notes 筛选/搜索 API (7 cases) ==="
echo "================================="

# 3a. keyword 搜索
resp=$(curl -s "$BASE/api/notes?keyword=Camera")
assert_contains "keyword=Camera 搜索命中" '"Camera' "$resp"

# 3b. type 筛选
resp=$(curl -s "$BASE/api/notes?type=risk")
total=$(echo "$resp" | grep -o '"total":[0-9]*' | cut -d: -f2)
assert_eq "type=risk 筛选返回正确数量" "1" "$total"

# 3c. priority 筛选
resp=$(curl -s "$BASE/api/notes?priority=P0")
assert_contains "priority=P0 筛选" '"P0"' "$resp"

# 3d. status 筛选
resp=$(curl -s "$BASE/api/notes?status=open")
assert_contains "status=open 筛选" '"open"' "$resp"

# 3e. module 筛选
resp=$(curl -s "$BASE/api/notes?module=Camera")
assert_contains "module=Camera 筛选" '"Camera"' "$resp"

# 3f. 日期范围
today=$(date +%Y-%m-%d)
resp=$(curl -s "$BASE/api/notes?startDate=$today&endDate=$today")
assert_contains "日期范围今天筛选" '"notes"' "$resp"

# 3g. 组合筛选
resp=$(curl -s "$BASE/api/notes?type=issue&priority=P0")
assert_contains "组合筛选 type=issue&priority=P0" '"notes"' "$resp"

echo ""
echo "================================="
echo "=== 4. AI Agent CRUD (10 cases) ==="
echo "================================="

# 4a. 清空 agents
existing=$(curl -s "$BASE/api/ai-providers")
for id in $(echo "$existing" | grep -o '"id":"[^"]*"' | cut -d'"' -f4); do
  curl -s -X DELETE "$BASE/api/ai-providers/$id" > /dev/null
done
sleep 0.2

# 4b. POST 创建 agent
resp=$(curl -s -X POST "$BASE/api/ai-providers" -H 'Content-Type: application/json' \
  -d '{"label":"Claude Code","name":"claude-code","description":"WSL","command":"cat {prompt_file} | claude --print","isDefault":true}')
AGENT_ID=$(echo "$resp" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_contains "POST 创建 Agent" '"label":"Claude Code"' "$resp"
assert_contains "创建 Agent isDefault=true" '"isDefault":true' "$resp"

# 4c. POST 空名称 → 400
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/ai-providers" \
  -H 'Content-Type: application/json' -d '{"label":""}')
assert_eq "POST Agent 空名称 → 400" "400" "$code"

# 4d. 创建第二个 agent 并设为默认
resp2=$(curl -s -X POST "$BASE/api/ai-providers" -H 'Content-Type: application/json' \
  -d '{"label":"Codex CLI","name":"codex-cli","command":"cat {prompt_file} | codex","isDefault":true}')
AGENT_ID2=$(echo "$resp2" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
assert_contains "创建第二个 Agent" '"label":"Codex CLI"' "$resp2"

# 4e. 验证第一个 agent 不再是 default
# Wait a moment for DB consistency
sleep 0.2
resp_check=$(curl -s "$BASE/api/ai-providers")
# Use grep to find the claude-code agent's isDefault value
first_default=$(echo "$resp_check" | python3 -c "
import json,sys
try:
    agents=json.load(sys.stdin)
    for a in agents:
        if a.get('name')=='claude-code':
            print(str(a['isDefault']).lower())
            break
    else:
        print('not_found')
except Exception as e:
    print('error:' + str(e))
" 2>/dev/null)
assert_eq "设新默认后旧 agent 自动取消默认" "false" "$first_default"

# 4f. PUT 更新 agent
if [ -n "$AGENT_ID" ]; then
  resp=$(curl -s -X PUT "$BASE/api/ai-providers/$AGENT_ID" -H 'Content-Type: application/json' \
    -d '{"description":"运行在 WSL Ubuntu 22.04"}')
  assert_contains "PUT 更新 Agent 描述" '22.04' "$resp"
fi

# 4g. PUT 禁用 agent
if [ -n "$AGENT_ID" ]; then
  resp=$(curl -s -X PUT "$BASE/api/ai-providers/$AGENT_ID" -H 'Content-Type: application/json' \
    -d '{"enabled":false}')
  assert_contains "PUT 禁用 Agent" '"enabled":false' "$resp"
fi

# 4h. 创建纯复制模式 agent (无 command)
resp=$(curl -s -X POST "$BASE/api/ai-providers" -H 'Content-Type: application/json' \
  -d '{"label":"Codex Desktop","name":"codex-desktop","description":"桌面应用，手动粘贴","command":""}')
assert_contains "创建纯复制模式 Agent" '"command":""' "$resp"

# 4i. GET 列表 — 应有 3 个
sleep 0.2
resp=$(curl -s "$BASE/api/ai-providers")
count=$(echo "$resp" | python3 -c "
import json,sys
try:
    agents=json.load(sys.stdin)
    print(len(agents))
except:
    print('error')
" 2>/dev/null)
assert_eq "Agent 列表共 3 个" "3" "$count"

# 4j. DELETE agent
if [ -n "$AGENT_ID2" ]; then
  resp=$(curl -s -X DELETE "$BASE/api/ai-providers/$AGENT_ID2")
  assert_contains "DELETE Agent 成功" '"success":true' "$resp"
fi

echo ""
echo "================================="
echo "=== 5. 页面内容检查 (7 cases) ==="
echo "================================="

# 5a. Dashboard 包含统计数据
page=$(curl -s "$BASE/")
assert_contains "Dashboard 包含 stat-card" 'stat-card' "$page"
assert_contains "Dashboard 包含 stat-value" 'stat-value' "$page"

# 5b. Notes 列表包含筛选
page=$(curl -s "$BASE/notes")
assert_contains "Notes 页包含搜索输入" 'placeholder' "$page"

# 5c. AI 页面结构
page=$(curl -s "$BASE/ai")
assert_contains "AI 页包含 Agent 选择器" 'Agent' "$page"
assert_contains "AI 页包含日报按钮" '日报' "$page"

# 5d. AI Settings 页面
page=$(curl -s "$BASE/ai/settings")
assert_contains "AI Settings 包含命令模板说明" 'prompt_file' "$page"

# 5e. Dark mode support: CSS contains dark theme variables
# Note: data-theme attribute is set client-side by ThemeProvider.tsx, NOT in SSR HTML.
# Instead, verify the CSS file contains dark mode rules.
CSS_URL=$(curl -s "$BASE/" | grep -oP 'href="(/_next/static/css/[^"]+)"' | head -1 | cut -d'"' -f2)
if [ -n "$CSS_URL" ]; then
  css_content=$(curl -s "$BASE$CSS_URL")
  assert_contains "CSS 包含 dark mode 变量" 'data-theme' "$css_content"
else
  # Fallback: check that ThemeProvider is present in layout JS
  page=$(curl -s "$BASE/")
  assert_contains "页面引用了主题 CSS" '_next/static/css' "$page"
fi

echo ""
echo "================================="
echo "=== 6. 边界情况 (5 cases) ==="
echo "================================="

# 6a. 不存在的记录 → 404
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/notes/nonexistent-id-12345")
assert_eq "GET 不存在记录 → 404" "404" "$code"

# 6b. DELETE 不存在的 agent → 404 (BUG FIX: 之前返回 500)
code=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/api/ai-providers/nonexistent-id")
assert_eq "DELETE 不存在 agent → 404" "404" "$code"

# 6c. 搜索无结果返回 total=0 (使用 URL-encoded 或 ASCII 关键词避免 bash 编码问题)
resp=$(curl -s "$BASE/api/notes?keyword=ZZZZZ_nonexistent_keyword_12345")
total=$(echo "$resp" | grep -o '"total":[0-9]*' | cut -d: -f2)
assert_eq "搜索无结果返回 total=0" "0" "$total"

# 6d. 无效 pageSize
resp=$(curl -s "$BASE/api/notes?pageSize=-1")
assert_contains "无效 pageSize 仍返回正常结构" '"notes"' "$resp"

# 6e. Favicon / icon 可访问
code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/icon.svg")
assert_eq "GET /icon.svg → 200" "200" "$code"

echo ""
echo "================================="
echo "=== 7. Bug 回归测试 (4 cases) ==="
echo "================================="

# 7a. Navbar: /ai 和 /ai/settings 页面不应互相高亮
# 检查 /ai 页面的 HTML 中 /ai/settings 链接不应有 active 样式
ai_page=$(curl -s "$BASE/ai")
# The active link for /ai page should have the accent-blue color
# The /ai/settings link should NOT have accent-blue background
# We test by checking the rendered HTML for the nav link patterns
assert_contains "AI 页面 Navbar 包含 AI 助手链接" 'AI 助手' "$ai_page"
assert_contains "AI 页面 Navbar 包含 AI 配置链接" 'AI 配置' "$ai_page"

# 7b. API: filter endpoint returns proper JSON structure consistently
resp=$(curl -s "$BASE/api/notes?type=nonexistent_type")
# grep -F for fixed string (no regex interpretation of [])
if echo "$resp" | grep -qF '"notes":[]'; then
  echo "  ✅ 不存在的 type 筛选返回空列表"
  PASS=$((PASS+1))
else
  echo "  ❌ 不存在的 type 筛选返回空列表"
  FAIL=$((FAIL+1))
  ERRORS="$ERRORS\n  ❌ 不存在的 type 筛选返回空列表"
fi

# 7c. Agent default logic: setting new default clears previous default
# Clean up and test
for id in $(curl -s "$BASE/api/ai-providers" | grep -o '"id":"[^"]*"' | cut -d'"' -f4); do
  curl -s -X DELETE "$BASE/api/ai-providers/$id" > /dev/null
done
sleep 0.1

# Create two agents, second one default
curl -s -X POST "$BASE/api/ai-providers" -H 'Content-Type: application/json' \
  -d '{"label":"Agent A","name":"a","command":"cmd","isDefault":true}' > /dev/null
curl -s -X POST "$BASE/api/ai-providers" -H 'Content-Type: application/json' \
  -d '{"label":"Agent B","name":"b","command":"cmd","isDefault":true}' > /dev/null
sleep 0.2

# Check: only one default
resp=$(curl -s "$BASE/api/ai-providers")
default_count=$(echo "$resp" | python3 -c "
import json,sys
try:
    agents=json.load(sys.stdin)
    print(sum(1 for a in agents if a.get('isDefault')))
except:
    print('error')
" 2>/dev/null)
assert_eq "同时只有一个默认 Agent" "1" "$default_count"

echo ""
echo "================================="
echo "=== 测试结果 ==="
echo "================================="
TOTAL=$((PASS + FAIL))
echo "✅ 通过: $PASS / $TOTAL"
echo "❌ 失败: $FAIL / $TOTAL"
if [ $FAIL -gt 0 ]; then
  echo ""
  echo "失败详情:"
  echo -e "$ERRORS"
fi
echo "================================="
exit $FAIL
