<template>
  <el-config-provider>
    <router-view></router-view>
  </el-config-provider>
</template>

<script setup>
import { ElConfigProvider } from 'element-plus'
</script>

<style>
#app {
  width: 100%;
  height: 100vh;
}

/* 全局样式重置 */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
}

/* Element Plus 样式覆盖 */
.el-card {
  border-radius: 8px;
}
</style>
