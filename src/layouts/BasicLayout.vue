<template>
  <div id="basicLayout">
    <a-layout class="layout">
      <!-- 一、顶部导航栏 -->
      <a-layout-header class="header">
        <GlobalHeader />
      </a-layout-header>

      <!-- 二、主体区域：左侧导航栏 + 右侧内容 -->
      <a-layout class="main-layout">
        <!-- 左侧导航栏 -->
        <GlobalSider class="sider" />

        <!-- 右侧页面内容 -->
        <a-layout-content class="content">
          <router-view />
        </a-layout-content>
      </a-layout>

      <!-- 三、底部版权信息 -->
      <a-layout-footer class="footer">
        <a href="https://www.codefather.cn" target="_blank" rel="noopener noreferrer">
         王子茗的图库网站，请勿侵权！
        </a>
      </a-layout-footer>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import GlobalHeader from '@/components/icons/GlobalHeader.vue'
import GlobalSider from '@/components/icons/GlobalSider.vue'
</script>

<style scoped>
/* 一、整体布局 */
#basicLayout {
  min-height: 100vh;
  width: 100%;
}

#basicLayout .layout {
  min-height: 100vh;
}

/* 二、顶部导航栏 */
#basicLayout .header {
  height: 64px;
  padding: 0;
  margin-bottom: 1px;
  background: #fff;
}

/* 三、主体区域 */
#basicLayout .main-layout {
  flex: 1;
  min-height: calc(100vh - 128px);
  background: #fff;
}

/* 四、右侧页面内容 */
#basicLayout .content {
  flex: 1;
  min-width: 0;
  padding: 28px;
  background: #fff;
}

/* 五、左侧导航栏 */
#basicLayout .sider {
  flex-shrink: 0;
  background: #fff;
  padding-top: 20px;
  border-right: 0.5px solid #eee;
}

/* 六、去除菜单多余边框 */
#basicLayout :deep(.ant-menu-root) {
  border-bottom: none !important;
  border-inline-end: none !important;
}

/* 七、底部版权信息 */
#basicLayout .footer {
  padding: 16px;
  text-align: center;
  background: #f5f5f5;
}
</style>
