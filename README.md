# ten-chat-websocket-demo

[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](../LICENSE)

## 🚀 项目简介

`ten-chat-websocket-demo` 是一个现代化、基于 WebSocket 的实时聊天应用示例。它旨在全面展示如何高效地整合和利用 `ten4j` 后端框架，实现前端与后端的实时、双向通信。本项目融合了尖端的前端技术和强大的 Java 后端服务，致力于为用户提供无缝、响应迅速的聊天体验。

**⚠️ 注意**: 本项目目前仅保证核心功能可正常运行。部分功能代码可能仍存在错误或未经过全面测试。

## ✨ 核心特性

-   **实时消息传输**: 利用 WebSocket 协议，实现消息的即时发送与接收，确保沟通无延迟。
-   **直观的用户界面**: 采用 `React` 和 `Tailwind CSS` 构建，提供简洁、美观且响应式的聊天界面，适配不同设备。
-   **深度集成 ten4j**: 后端完全基于 `ten4j` 框架开发，充分展现其在构建高性能、高并发实时通信应用方面的强大能力。
-   **可扩展架构**: 项目结构清晰，易于理解和扩展，方便开发者在此基础上进行二次开发。
-   **跨平台兼容**: 前端可在现代浏览器中运行，后端基于 Java，具备良好的跨平台特性。

## 🛠️ 技术栈

### 前端 (`ten-chat-websocket-demo`)

-   **框架**: [React](https://react.dev/)
-   **构建工具**: [Vite](https://vitejs.dev/)
-   **样式**: [Tailwind CSS](https://tailwindcss.com/)
-   **语言**: [TypeScript](https://www.typescriptlang.org/)
-   **包管理**: [Bun](https://bun.sh/)

### 后端 (`ten4j`)

-   **框架**: [ten-framework Java](https://github.com/hanger-source/ten4j)
-   **协议**: WebSocket
-   **构建工具**: [Maven](https://maven.apache.org/)
-   **语言**: [Java](https://www.java.com/)

## ⚙️ 如何运行

### 1. 克隆项目

首先，将整个仓库克隆到本地：

```bash
git clone <项目地址>
cd ten-realtime-chat
```

### 2. 启动后端服务 (`ten4j`)

进入 `ten4j` 目录并编译运行后端服务。请确保您的系统已安装 Java 开发环境 (JDK) 和 Maven。

```bash
cd ten4j
mvn clean install
mvn spring-boot:run
```

请确认后端服务已成功启动，并监听 WebSocket 连接 (通常在 `ws://localhost:8080/websocket` 等地址)。

### 3. 启动前端应用 (`ten-chat-websocket-demo`)

在新终端中，进入 `ten-chat-websocket-demo` 目录，安装依赖并启动前端应用：

```bash
cd ten-chat-websocket-demo
bun install
bun run dev
```

前端应用通常会在 `http://localhost:3000` 或类似地址上启动。在浏览器中打开该地址即可访问功能完备的实时聊天应用。

## 📂 文件结构

```
ten-realtime-chat/
├── ten-chat-websocket-demo/ # 前端项目，包含 React 应用的源代码、配置和资源。
│   ├── public/              # 静态资源目录。
│   ├── src/                 # 前端核心源代码。
│   │   ├── app/             # Next.js 路由和页面。
│   │   ├── assets/          # 图片、字体等静态资源。
│   │   ├── common/          # 通用工具函数和常量。
│   │   ├── components/      # 可复用的 React 组件。
│   │   ├── hooks/           # 自定义 React Hooks。
│   │   ├── lib/             # 库文件和实用工具。
│   │   ├── manager/         # 状态管理和 WebSocket 连接管理。
│   │   ├── store/           # Redux 存储配置。
│   │   └── types/           # TypeScript 类型定义。
│   ├── .env                 # 环境变量配置文件。
│   ├── package.json         # 前端项目依赖和脚本。
│   └── vite.config.ts       # Vite 构建工具配置。
└── ten4j/                 # 后端项目，基于 Java 和 ten-framework 构建。
    ├── ten4j-agent/         # ten4j 代理模块。
    ├── ten4j-core/          # ten4j 核心模块。
    ├── ten4j-server/        # ten4j 服务器模块。
    ├── pom.xml              # Maven 主配置文件，管理所有子模块。
    └── README.md            # ten4j 项目说明。
```

## ✨ **AI 辅助开发**

本项目在开发过程中充分利用了 Cursor 的 AI 编码能力，包括但不限于项目分析、方案设计、代码实现、问题调试等环节。Cursor AI 有效提升了开发效率和代码质量。

## 📄 许可证

本项目采用 Apache 2.0 许可证。更多详情请参阅 [LICENSE](LICENSE) 文件。
