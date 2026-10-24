<template>
  <div class="url-picture-upload">
    <!-- 一、URL 输入框 -->
    <a-input-group compact style="margin-bottom: 16px">
      <a-input
        v-model:value="fileUrl"
        style="width: calc(100% - 120px)"
        placeholder="请输入图片 URL"
        allow-clear
        :disabled="loading"
        @pressEnter="handleUpload"
      />

      <a-button
        type="primary"
        :loading="loading"
        :disabled="!fileUrl.trim()"
        style="width: 120px"
        @click="handleUpload"
      >
        提交
      </a-button>
    </a-input-group>

    <!-- 二、上传成功后展示图片 -->
    <div v-if="currentPicture?.url" class="img-wrapper">
      <img :src="currentPicture.url" :alt="currentPicture.name || '图片'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import axios from 'axios'
import { uploadPictureByUrlUsingPost } from '@/api/pictureController'

// 一、定义父组件参数
interface Props {
  picture?: API.PictureVO
  spaceId?: string | number
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<Props>()

// 二、组件状态
const loading = ref(false)
const fileUrl = ref('')
const uploadedPicture = ref<API.PictureVO | null>(null)

// 三、当前展示的图片
const currentPicture = computed<API.PictureVO | null>(() => {
  return uploadedPicture.value ?? props.picture ?? null
})

// 四、父组件切换图片时，更新预览
watch(
  () => props.picture,
  () => {
    uploadedPicture.value = null
  },
)

// 五、通过 URL 上传图片
const handleUpload = async () => {
  const url = fileUrl.value.trim()

  // 1. 检查 URL 是否为空
  if (!url) {
    message.warning('请输入图片 URL')
    return
  }

  // 2. 校验 URL 格式
  try {
    const parsedUrl = new URL(url)

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      message.error('仅支持 HTTP 或 HTTPS 图片地址')
      return
    }
  } catch {
    message.error('请输入正确的图片 URL')
    return
  }

  if (loading.value) return

  loading.value = true

  try {
    // 3. 构造图片上传请求
    const params: API.PictureUploadRequest = {
      fileUrl: url,
    }

    // 4. 如果是重新上传已有图片，传递图片 ID
    const pictureId = currentPicture.value?.id

    if (pictureId !== undefined && pictureId !== null) {
      // 雪花 ID 直接保留字符串，避免 Number() 精度丢失
      params.id = String(pictureId) as unknown as number
    }

    // 5. 上传到私人空间时，传递 spaceId
    if (props.spaceId !== undefined && props.spaceId !== null && props.spaceId !== '') {
      params.spaceId = String(props.spaceId) as unknown as number
    }

    // 6. 调用后端 URL 上传接口
    const res = await uploadPictureByUrlUsingPost(params)

    // 7. 处理上传结果
    if (res.data.code === 0 && res.data.data) {
      uploadedPicture.value = res.data.data

      message.success('图片上传成功')

      // 将图片信息通知父组件
      props.onSuccess?.(res.data.data)
    } else {
      message.error('图片上传失败：' + (res.data.message || '未知错误'))
    }
  } catch (error: unknown) {
    console.error('URL 图片上传失败：', error)

    let errorMessage = '请检查图片地址或后端接口'

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message || errorMessage
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    message.error('图片上传失败：' + errorMessage)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.url-picture-upload {
  margin-bottom: 16px;
}

.url-picture-upload img {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}

.url-picture-upload .img-wrapper {
  text-align: center;
  margin-top: 16px;
}
</style>
