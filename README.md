智能云图库管理系统（Smart Cloud Picture Management System）
基于 Vue 3 + TypeScript 开发的智能云图库管理系统前端，配合 Spring Boot 后端，实现图片上传、浏览、检索、管理以及私人空间等功能。

本项目采用前后端分离架构，前端负责页面交互与数据展示，后端提供 RESTful API 和图片存储服务。

项目仓库
- 前端（当前仓库）：picture-frontend
- 后端：picture-backend
  一、项目介绍
  智能云图库管理系统面向图片资源的上传、存储、分类、搜索与管理场景，支持公共图库和私人空间两类使用方式。

用户可以浏览公共图库、上传图片、查看图片详情；管理员可以管理用户、审核及管理图片；登录用户可以在自己的私人空间中管理图片资源。
二、技术栈
分类	技术
前端框架	Vue 3
开发语言	TypeScript
构建工具	Vite
UI 组件库	Ant Design Vue
状态管理	Pinia
路由管理	Vue Router
HTTP 请求	Axios


三、主要功能
- 用户模块：注册、登录及用户信息展示。
- 公共图库：图片浏览、搜索、分类和标签筛选。
- 图片操作：上传、查看详情、编辑及删除。
- 批量创建：按关键词批量创建图片。
- 后台管理：用户管理、图片管理与图片审核。
- 私人空间：个人空间及图片资源管理。
  四、本地运行
  环境要求：Node.js、npm，以及已启动的配套后端服务。
1. 克隆仓库：
   git clone https://github.com/ZiMing929/picture-frontend.git
   cd picture-frontend
2. 安装依赖：
   npm install
3. 启动开发环境：
   npm run dev
4. 浏览器访问终端提示的地址，通常为 http://localhost:5173/。
   开发时请确认前端接口请求地址与后端配置一致；当前后端开发地址通常为 http://localhost:8124/api。
   五、后端项目
   配套后端采用 Java 11 + Spring Boot 2.7 + MyBatis-Plus + MySQL + Redis + 腾讯云 COS，负责用户认证、图片业务处理、对象存储及数据管理。

后端仓库：picture-backend
本项目用于全栈开发学习、功能实践与项目展示，功能将持续完善。