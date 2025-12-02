# 作品提交模块文档

## 概述

作品提交模块让参赛队伍可以在规定阶段提交项目，并由主办方进行审核与链上备案。支持多种资源链接、附件、哈希指纹以及审批意见。

## 功能特性

### 参赛者功能
- 创建作品提交（标题、描述、GitHub、Demo、文档）
- 上传附件（IPFS/Arweave 链接、哈希）
- 自动生成作品指纹（SHA256）
- 查看提交状态（待审核、已通过、已拒绝）

### 主办方功能
- 查看所有作品
- 审核（通过/拒绝）并添加意见
- 同步作品哈希到链上（可选）

## 数据模型

### Submission
- `event_id`, `team_id`
- `title`, `description`
- `github_repo`, `demo_url`, `documentation`
- `storage_url`, `submission_hash`
- `status` (pending / approved / rejected)
- `reviewer_comment`, `submitted_by`, `submitted_at`

### SubmissionFile
- `file_name`, `file_type`, `url`, `hash`

## API 端点

- `POST /api/v1/submissions`：提交作品
- `GET /api/v1/submissions`：获取所有作品
- `GET /api/v1/submissions/:id`：作品详情
- `GET /api/v1/submissions/event/:eventId`：活动作品列表
- `PUT /api/v1/submissions/:id`：更新作品（仅待审核）
- `PATCH /api/v1/submissions/:id/approve`：通过作品（主办方）
- `PATCH /api/v1/submissions/:id/reject`：拒绝作品（主办方）
- `DELETE /api/v1/submissions/:id`：删除作品

## 智能合约

`SubmissionRegistry.sol` 用于存储作品指纹：
- `registerSubmission(eventId, teamId, hash, metadataURI)`
- `getSubmission(id)`

## 前端页面

### SubmissionForm
- 支持钱包连接
- 填写作品信息 + 附件
- 提交后提示等待审核

### SubmissionList
- 查看所有作品卡片
- 显示 GitHub/Demo/文档/附件链接
- 编辑审核意见，执行通过/拒绝

## 使用流程
1. 队伍在 `submission` 阶段进入 `/events/{id}/submit` 页面。
2. 连接钱包并填写资料，提交后状态为 `pending`。
3. 主办方在 `/events/{id}/submissions` 查看所有作品，输入主办方地址完成审批。
4. 通过后可选择将 `submission_hash` 同步到链上 `SubmissionRegistry`，并回写 Tx Hash。

