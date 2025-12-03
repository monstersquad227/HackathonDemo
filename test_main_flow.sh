#!/bin/bash

# 主流程自动化测试脚本
# 根据功能测试用例.md执行主流程测试

BASE_URL="http://localhost:8080/api/v1"
TEST_REPORT="主流程测试报告_$(date +%Y%m%d_%H%M%S).md"

# 测试数据 - 使用时间戳确保唯一性
TIMESTAMP=$(date +%s)
ORGANIZER_ADDRESS="0x1234567890123456789012345678901234567890"
SPONSOR_ADDRESS="0x234567890123456789012345678901234567890${TIMESTAMP: -1}"
PARTICIPANT_ADDRESS="0x3456789012345678901234567890123456789012"

# 存储测试结果
EVENT_ID=""
SPONSOR_ID=""
SPONSORSHIP_ID=""
TEAM_ID=""
REGISTRATION_ID=""
SUBMISSION_ID=""

echo "开始主流程测试..."
echo "测试时间: $(date)"
echo ""

# 测试结果统计
PASSED=0
FAILED=0
TOTAL=0

# 测试函数
test_case() {
    local test_id=$1
    local test_name=$2
    local method=$3
    local endpoint=$4
    local data=$5
    local expected_status=$6
    
    TOTAL=$((TOTAL + 1))
    
    echo "执行测试: $test_id - $test_name"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PATCH" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PATCH "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "$expected_status" ]; then
        echo "✅ 通过 (HTTP $http_code)"
        PASSED=$((PASSED + 1))
        
        # 提取ID（如果是创建操作）
        if [ "$method" = "POST" ] && [ "$expected_status" = "201" ]; then
            if echo "$endpoint" | grep -q "events"; then
                EVENT_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            elif echo "$endpoint" | grep -q "sponsors"; then
                SPONSOR_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            elif echo "$endpoint" | grep -q "sponsorships"; then
                SPONSORSHIP_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            elif echo "$endpoint" | grep -q "teams"; then
                TEAM_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            elif echo "$endpoint" | grep -q "registrations"; then
                REGISTRATION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            elif echo "$endpoint" | grep -q "submissions"; then
                SUBMISSION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)
            fi
        fi
        
        return 0
    else
        echo "❌ 失败 (期望: HTTP $expected_status, 实际: HTTP $http_code)"
        echo "响应: $body"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# TC-001: 创建活动
test_case "TC-001" "创建活动" "POST" "/events" "{
  \"name\": \"测试黑客松2024\",
  \"description\": \"这是一个测试活动\",
  \"location\": \"线上\",
  \"start_time\": \"2024-12-01T09:00:00Z\",
  \"end_time\": \"2024-12-03T18:00:00Z\",
  \"registration_start_time\": \"2024-11-01T00:00:00Z\",
  \"registration_end_time\": \"2024-11-30T23:59:59Z\",
  \"checkin_start_time\": \"2024-12-01T08:00:00Z\",
  \"checkin_end_time\": \"2024-12-01T10:00:00Z\",
  \"submission_start_time\": \"2024-12-01T10:00:00Z\",
  \"submission_end_time\": \"2024-12-03T16:00:00Z\",
  \"voting_start_time\": \"2024-12-03T16:00:00Z\",
  \"voting_end_time\": \"2024-12-03T17:00:00Z\",
  \"organizer_address\": \"$ORGANIZER_ADDRESS\",
  \"allow_sponsor_voting\": true,
  \"allow_public_voting\": true,
  \"on_chain\": false,
  \"prizes\": [
    {
      \"rank\": 1,
      \"name\": \"一等奖\",
      \"description\": \"最佳项目\",
      \"amount\": \"10000\"
    }
  ]
}" "201"

echo "创建的活动ID: $EVENT_ID"
echo ""

# TC-002: 获取活动列表
test_case "TC-002" "获取活动列表" "GET" "/events" "" "200"
echo ""

# TC-003: 获取单个活动详情
if [ -n "$EVENT_ID" ]; then
    test_case "TC-003" "获取单个活动详情" "GET" "/events/$EVENT_ID" "" "200"
    echo ""
fi

# TC-006: 创建赞助商
test_case "TC-006" "创建赞助商" "POST" "/sponsors" "{
  \"name\": \"测试赞助商\",
  \"description\": \"这是一个测试赞助商\",
  \"logo_url\": \"https://example.com/logo.png\",
  \"website_url\": \"https://example.com\",
  \"address\": \"$SPONSOR_ADDRESS\"
}" "201"

echo "创建的赞助商ID: $SPONSOR_ID"
echo ""

# TC-007: 创建赞助
if [ -n "$EVENT_ID" ] && [ -n "$SPONSOR_ID" ]; then
    test_case "TC-007" "创建赞助" "POST" "/sponsorships" "{
      \"event_id\": $EVENT_ID,
      \"sponsor_id\": $SPONSOR_ID,
      \"asset_type\": \"erc20\",
      \"token_address\": \"0x0000000000000000000000000000000000000000\",
      \"amount\": \"10000\",
      \"amount_display\": \"10000 USDC\",
      \"voting_weight\": \"10000\",
      \"voting_power\": 10000.0,
      \"benefits\": \"Logo展示、投票权\"
    }" "201"
    echo "创建的赞助ID: $SPONSORSHIP_ID"
    echo ""
fi

# TC-008: 审批赞助
if [ -n "$SPONSORSHIP_ID" ]; then
    test_case "TC-008" "审批赞助" "PATCH" "/sponsorships/$SPONSORSHIP_ID/approve" "{
      \"organizer_address\": \"$ORGANIZER_ADDRESS\"
    }" "200"
    echo ""
fi

# TC-011: 创建团队
test_case "TC-011" "创建团队" "POST" "/teams" "{
  \"name\": \"测试团队\",
  \"description\": \"这是一个测试团队\",
  \"leader_address\": \"$PARTICIPANT_ADDRESS\",
  \"max_members\": 5,
  \"skills\": \"Web3, Solidity, React\",
  \"members\": [
    {
      \"address\": \"$PARTICIPANT_ADDRESS\",
      \"name\": \"队长\",
      \"email\": \"leader@example.com\",
      \"skills\": \"Solidity\",
      \"role\": \"队长\"
    }
  ]
}" "201"

echo "创建的团队ID: $TEAM_ID"
echo ""

# TC-013: 审批团队
if [ -n "$TEAM_ID" ]; then
    test_case "TC-013" "审批团队" "PATCH" "/teams/$TEAM_ID/approve" "{
      \"organizer_address\": \"$ORGANIZER_ADDRESS\"
    }" "200"
    echo ""
fi

# TC-014: 提交报名
if [ -n "$EVENT_ID" ] && [ -n "$TEAM_ID" ]; then
    test_case "TC-014" "提交报名" "POST" "/registrations" "{
      \"event_id\": $EVENT_ID,
      \"team_id\": $TEAM_ID,
      \"project_name\": \"测试项目\",
      \"project_description\": \"这是一个测试项目描述\"
    }" "201"
    echo "创建的报名ID: $REGISTRATION_ID"
    echo ""
fi

# TC-015: 审批报名
if [ -n "$REGISTRATION_ID" ]; then
    test_case "TC-015" "审批报名" "PATCH" "/registrations/$REGISTRATION_ID/approve" "{
      \"organizer_address\": \"$ORGANIZER_ADDRESS\"
    }" "200"
    echo ""
fi

# TC-004: 更新活动阶段为checkin
if [ -n "$EVENT_ID" ]; then
    test_case "TC-004-1" "更新活动阶段为checkin" "PATCH" "/events/$EVENT_ID/stage" "{
      \"stage\": \"checkin\"
    }" "200"
    echo ""
fi

# TC-016: 生成签到二维码
if [ -n "$EVENT_ID" ]; then
    test_case "TC-016" "生成签到二维码" "GET" "/check-ins/event/$EVENT_ID/qrcode" "" "200"
    echo ""
fi

# TC-004: 更新活动阶段为submission
if [ -n "$EVENT_ID" ]; then
    test_case "TC-004-2" "更新活动阶段为submission" "PATCH" "/events/$EVENT_ID/stage" "{
      \"stage\": \"submission\"
    }" "200"
    echo ""
fi

# TC-021: 提交作品
if [ -n "$EVENT_ID" ] && [ -n "$TEAM_ID" ]; then
    test_case "TC-021" "提交作品" "POST" "/submissions" "{
      \"event_id\": $EVENT_ID,
      \"team_id\": $TEAM_ID,
      \"title\": \"测试项目作品\",
      \"description\": \"这是一个测试项目的详细描述\",
      \"github_repo\": \"https://github.com/example/project\",
      \"demo_url\": \"https://demo.example.com\",
      \"documentation\": \"项目文档内容\",
      \"storage_url\": \"ipfs://Qm...\",
      \"submitted_by\": \"$PARTICIPANT_ADDRESS\"
    }" "201"
    echo "创建的作品ID: $SUBMISSION_ID"
    echo ""
fi

# TC-023: 审批作品
if [ -n "$SUBMISSION_ID" ]; then
    test_case "TC-023" "审批作品" "PATCH" "/submissions/$SUBMISSION_ID/approve" "{
      \"organizer_address\": \"$ORGANIZER_ADDRESS\",
      \"comment\": \"作品质量优秀\"
    }" "200"
    echo ""
fi

# TC-004: 更新活动阶段为voting
if [ -n "$EVENT_ID" ]; then
    test_case "TC-004-3" "更新活动阶段为voting" "PATCH" "/events/$EVENT_ID/stage" "{
      \"stage\": \"voting\"
    }" "200"
    echo ""
fi

# TC-024: 添加评委
if [ -n "$EVENT_ID" ]; then
    test_case "TC-024" "添加评委" "POST" "/events/$EVENT_ID/judges" "{
      \"address\": \"0x5678901234567890123456789012345678901234\",
      \"weight\": 1.0,
      \"max_votes\": 3,
      \"organizer_address\": \"$ORGANIZER_ADDRESS\"
    }" "201"
    echo ""
fi

# TC-028: 获取投票统计
if [ -n "$EVENT_ID" ]; then
    test_case "TC-028" "获取投票统计" "GET" "/votes/event/$EVENT_ID/summary" "" "200"
    echo ""
fi

# 生成测试报告
echo "================================"
echo "测试完成"
echo "================================"
echo "总测试数: $TOTAL"
echo "通过: $PASSED"
echo "失败: $FAILED"
echo "通过率: $((PASSED * 100 / TOTAL))%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ 所有测试通过！"
    exit 0
else
    echo "❌ 有 $FAILED 个测试失败"
    exit 1
fi

