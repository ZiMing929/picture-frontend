# Picture Frontend - 云图库前端

基于 Vue 3 + TypeScript 开发的云图库前端项目，配合 Spring Boot 后端实现图片上传、管理、检索及个人空间等功能。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Ant Design Vue
- Pinia
- Vue Router
- Axios

## 主要功能

- 用户注册、登录及个人信息展示
- 公共图库浏览、搜索和分类筛选
- 图片上传、编辑、删除及详情查看
- 图片批量创建
- 图片管理及管理员审核
- 私人空间创建与图片管理

## 本地运行

**1. 安装依赖**

```bash
npm install
```

**2. 启动开发环境**

```bash
npm run dev
```

**3. 访问项目**

```text
http://localhost:5173
```

运行前请确保后端服务已经启动，并正确配置前端 API 请求地址。

## 后端项目

本项目为云图库系统的前端部分，后端基于 Spring Boot、MySQL、Redis 和腾讯云 COS 实现。

后端 GitHub 仓库：

https://github.com/ZiMing929/picture-backend

## 项目说明

本项目用于个人学习和实践，主要涉及 Vue 3 前端开发、前后端接口交互、图片资源管理以及云存储服务集成。