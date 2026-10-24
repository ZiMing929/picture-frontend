<template>
  <div class="picture-upload">
    <a-upload
      list-type="picture-card"
      :show-upload-list="false"
      :custom-request="handleUpload"
      :before-upload="beforeUpload"
    >
      <!-- 已上传图片：展示预览 -->
      <img v-if="currentPicture?.url" :src="currentPicture.url" alt="图片" />

      <!-- 未上传图片：展示上传按钮 -->
      <div v-else>
        <LoadingOutlined v-if="loading" />
        <PlusOutlined v-else />
        <div class="ant-upload-text">点击上传图片</div>
      </div>
    </a-upload>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import axios from 'axios'
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import type { UploadProps } from 'ant-design-vue'

// 一、定义父组件传入的参数
interface Props {
  picture?: API.PictureVO
  spaceId?: string | number
  onSuccess?: (newPicture: API.PictureVO) => void
}

// 注意：defineProps 只能声明一次
const props = defineProps<Props>()

// 二、组件状态
const loading = ref(false)
const uploadedPicture = ref<API.PictureVO | null>(null)

// 三、当前展示的图片
const currentPicture = computed(() => {
  return uploadedPicture.value ?? props.picture
})

// 四、父组件切换图片时，同步更新预览
watch(
  () => props.picture,
  () => {
    uploadedPicture.value = null
  },
)

// 五、上传前校验文件
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  // 限制图片格式
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png'

  if (!isImage) {
    message.error('只支持 JPG、PNG 图片')
    return false
  }

  // 限制图片大小为 2MB
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isLt2M) {
    message.error('图片不能超过 2MB')
    return false
  }

  return true
}

// 六、上传图片
const handleUpload: UploadProps['customRequest'] = async (options) => {
  if (loading.value) return

  loading.value = true

  try {
    // 1. 构造 multipart/form-data 请求
    const formData = new FormData()
    formData.append('file', options.file as File)

    // 2. 构造图片上传参数
    // 与鱼皮教程保持一致：传递 id 和 spaceId
    const params: API.PictureUploadRequest = {}

    // 已有图片时，传递图片 ID
    const pictureId = currentPicture.value?.id

    if (pictureId !== undefined && pictureId !== null) {
      params.id = String(pictureId) as unknown as number
    }

    // 上传到私人空间时，传递 spaceId
    if (props.spaceId !== undefined && props.spaceId !== null && props.spaceId !== '') {
      params.spaceId = String(props.spaceId) as unknown as number
    }

    // 3. 调用后端上传接口
    // 参数 id、spaceId 放在查询参数中
    // 文件放在 multipart/form-data 请求体中
    const response = await axios.post('http://localhost:8124/api/picture/upload', formData, {
      params,
      withCredentials: true,
    })

    const result = response.data

    // 4. 处理上传结果
    if (result.code === 0 && result.data) {
      uploadedPicture.value = result.data

      message.success('图片上传成功')

      // 将上传成功的图片信息传递给父组件
      props.onSuccess?.(result.data)

      // 通知 Ant Design Vue 上传成功
      options.onSuccess?.(result.data)
    } else {
      const errorMessage = result.message || '未知错误'

      message.error('图片上传失败：' + errorMessage)
      options.onError?.(new Error(errorMessage))
    }
  } catch (error: unknown) {
    console.error('图片上传请求失败：', error)

    let errorMessage = '请检查后端服务'

    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message || errorMessage
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    message.error('图片上传失败：' + errorMessage)
    options.onError?.(error instanceof Error ? error : new Error(errorMessage))
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.picture-upload :deep(.ant-upload) {
  width: 100% !important;
  height: 100% !important;
  min-height: 152px;
  min-width: 152px;
}

.picture-upload img {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
}

.ant-upload-text {
  margin-top: 8px;
  color: #666;
}
</style>
