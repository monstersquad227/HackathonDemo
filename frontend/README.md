# Frontend - Event Management Module

## 概述

这是 Hackathon Platform 的前端应用，使用 React 和 Vite 构建，实现活动管理模块的用户界面。

## 技术栈

- **框架**: React 18
- **构建工具**: Vite
- **路由**: React Router
- **HTTP 客户端**: Axios
- **Web3**: Ethers.js / Web3.js

## 项目结构

```
frontend/
├── src/
│   ├── components/     # React 组件
│   │   ├── EventList.jsx      # 活动列表
│   │   ├── EventCreate.jsx    # 创建活动
│   │   └── EventDetail.jsx    # 活动详情
│   ├── api/           # API 调用
│   │   └── eventApi.js
│   ├── App.jsx        # 主应用组件
│   ├── main.jsx       # 入口文件
│   └── index.css      # 全局样式
├── index.html
├── package.json
└── vite.config.js
```

## 安装和运行

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 运行开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 3. 构建生产版本

```bash
npm run build
```

## 功能特性

### 活动列表页面
- 显示所有活动
- 活动卡片展示基本信息
- 显示当前阶段状态
- 点击卡片查看详情

### 创建活动页面
- 填写活动基本信息
- 设置各阶段时间
- 配置投票选项
- 设置奖项信息

### 活动详情页面
- 查看完整活动信息
- 查看阶段时间安排
- 查看奖项配置
- 更新活动阶段（主办方）

## API 集成

前端通过 `/api/v1/events` 端点与后端 API 通信。API 代理配置在 `vite.config.js` 中。

## 样式说明

- 使用 CSS 模块化设计
- 响应式布局
- 现代化 UI 设计
- 阶段状态使用不同颜色标识

## 开发

### 添加新组件

在 `src/components/` 目录下创建新的组件文件。

### API 调用

在 `src/api/` 目录下添加新的 API 调用函数。

### 路由配置

在 `src/App.jsx` 中添加新的路由。

