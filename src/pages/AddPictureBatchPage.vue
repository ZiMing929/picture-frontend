<template>
  <div id="addPictureBatchPage">
    <h2 class="page-title">批量创建图片</h2>

    <!-- 一、批量抓取功能说明 -->
    <a-alert
      message="批量抓取说明"
      description="输入搜索关键词后，系统会从图片搜索结果中抓取图片并上传。每次最多创建 30 张，实际成功数量以接口返回为准。"
      type="info"
      show-icon
      class="page-alert"
    />

    <!-- 二、批量创建表单 -->
    <a-form layout="vertical" :model="formData" @finish="handleSubmit">
      <a-form-item
        label="关键词"
        name="searchText"
        :rules="[{ required: true, message: '请输入图片搜索关键词' }]"
      >
        <a-input
          v-model:value="formData.searchText"
          placeholder="例如：猫咪、风景、动漫"
          :maxlength="100"
          allow-clear
        />
      </a-form-item>

      <a-form-item
        label="抓取数量"
        name="count"
        :rules="[{ required: true, message: '请输入抓取数量' }]"
      >
        <a-input-number
          v-model:value="formData.count"
          placeholder="请输入抓取数量"
          :min="1"
          :max="30"
          :precision="0"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item label="名称前缀" name="namePrefix">
        <a-input
          v-model:value="formData.namePrefix"
          placeholder="例如：可爱猫咪（自动生成可爱猫咪1、可爱猫咪2）"
          :maxlength="100"
          allow-clear
        />
      </a-form-item>

      <!-- 三、执行批量创建任务 -->
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" block>
          {{ loading ? '正在批量创建...' : '执行任务' }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { uploadPictureByBatchUsingPost } from '@/api/pictureController'

// 一、路由和加载状态
const router = useRouter()
const loading = ref(false)

// 二、批量抓取表单
const formData = reactive<API.PictureUploadByBatchRequest>({
  searchText: '',
  count: 10,
  namePrefix: '',
})

// 三、提交批量抓取任务
const handleSubmit = async () => {
  if (loading.value) return

  // 1. 校验关键词
  const searchText = formData.searchText?.trim()
  if (!searchText) {
    message.warning('请输入图片搜索关键词')
    return
  }

  // 2. 校验抓取数量
  const count = formData.count
  if (count == null || !Number.isInteger(count) || count < 1 || count > 30) {
    message.warning('抓取数量必须是 1 到 30 之间的整数')
    return
  }

  loading.value = true

  try {
    // 3. 调用后端批量抓取接口
    const res = await uploadPictureByBatchUsingPost({
      searchText,
      count,
      namePrefix: formData.namePrefix?.trim() || searchText,
    })

    // 4. 根据接口返回结果展示提示
    if (res.data.code === 0) {
      const successCount = Number(res.data.data ?? 0)

      if (successCount > 0) {
        message.success(`批量创建完成，成功上传 ${successCount} 张图片`)
        await router.push('/admin/pictureManage')
      } else {
        message.warning('抓取任务已完成，但没有成功上传图片，请检查后端日志')
      }
    } else {
      message.error('批量创建失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('批量创建图片失败：', error)
    message.error('批量创建失败，请检查后端服务、网络或图片抓取接口')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
#addPictureBatchPage {
  max-width: 720px;
  margin: 32px auto;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.page-title {
  margin-bottom: 20px;
  font-size: 22px;
  font-weight: 600;
}

.page-alert {
  margin-bottom: 24px;
}

#addPictureBatchPage :deep(.ant-form-item) {
  margin-bottom: 22px;
}
</style>
