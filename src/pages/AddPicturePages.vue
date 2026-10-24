<template>
  <div id="addPicturePage">
    <h2 class="page-title">
      {{ isEditMode ? '修改图片' : '创建图片' }}
    </h2>

    <!-- 一、显示当前私人空间 ID -->
    <a-typography-paragraph v-if="spaceId" type="secondary">
      保存至空间：
      <a :href="`/space/${spaceId}`" target="_blank" rel="noopener noreferrer">
        {{ spaceId }}
      </a>
    </a-typography-paragraph>

    <!-- 二、选择图片上传方式 -->
    <a-tabs v-model:activeKey="uploadType">
      <a-tab-pane key="file" tab="文件上传">
        <PictureUpload :picture="picture" :space-id="spaceId" :onSuccess="onSuccess" />
      </a-tab-pane>

      <a-tab-pane key="url" tab="URL 上传" force-render>
        <UrlPictureUpload :picture="picture" :space-id="spaceId" :onSuccess="onSuccess" />
      </a-tab-pane>
    </a-tabs>

    <!-- 三、填写图片信息 -->
    <a-form layout="vertical" :model="pictureForm" @finish="handleSubmit">
      <a-form-item label="名称" name="name">
        <a-input v-model:value="pictureForm.name" placeholder="请输入图片名称" allow-clear />
      </a-form-item>

      <a-form-item label="简介" name="introduction">
        <a-textarea
          v-model:value="pictureForm.introduction"
          placeholder="请输入图片简介"
          :rows="2"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="分类" name="category">
        <a-auto-complete
          v-model:value="pictureForm.category"
          :options="categoryOptions"
          placeholder="请输入或选择分类"
          allow-clear
        />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-select
          v-model:value="pictureForm.tags"
          :options="tagOptions"
          mode="tags"
          placeholder="请输入或选择标签"
          allow-clear
        />
      </a-form-item>

      <!-- 四、提交图片信息 -->
      <a-form-item>
        <a-button type="primary" html-type="submit" :loading="loading" block>
          {{ isEditMode ? '保存修改' : '创建' }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

import PictureUpload from '@/components/icons/PictureUpload.vue'
import UrlPictureUpload from '@/components/icons/UrlPictureUpload.vue'

import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
} from '@/api/pictureController'

// 一、路由与页面状态
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const uploadType = ref<'file' | 'url'>('file')

// 是否为编辑模式
const isEditMode = computed(() => Boolean(route.query.id))

// 二、从 URL 查询参数中获取空间 ID
// 例如：/add_picture?spaceId=2113557676532822017
// 保留字符串，避免雪花 ID 转换为 Number 后精度丢失
const spaceId = computed<string | undefined>(() => {
  const id = route.query.spaceId

  if (typeof id !== 'string' || !/^\d+$/.test(id)) {
    return undefined
  }

  return id
})

// 三、当前图片和编辑表单
const picture = ref<API.PictureVO>()

const pictureForm = reactive<API.PictureEditRequest>({
  tags: [],
})

// 四、分类和标签选项
const categoryOptions = ref<{ value: string; label: string }[]>([])
const tagOptions = ref<{ value: string; label: string }[]>([])

// 五、安全解析标签，兼容数组和 JSON 字符串
const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) {
    return tags.map(String)
  }

  if (typeof tags !== 'string' || !tags.trim()) {
    return []
  }

  try {
    const result: unknown = JSON.parse(tags)
    return Array.isArray(result) ? result.map(String) : []
  } catch {
    console.warn('标签格式不正确：', tags)
    return []
  }
}

// 六、上传成功后，回显图片信息
const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture

  pictureForm.name = newPicture.name
  pictureForm.introduction = newPicture.introduction
  pictureForm.category = newPicture.category
  pictureForm.tags = parseTags(newPicture.tags)

  message.success('图片上传成功，可以继续编辑图片信息')
}

// 七、提交图片信息
const handleSubmit = async () => {
  const pictureId = picture.value?.id

  if (pictureId == null) {
    message.warning('请先上传图片')
    return
  }

  if (loading.value) {
    return
  }

  loading.value = true

  try {
    // 将图片 ID、空间 ID、表单内容一起提交
    // 类型断言仅用于兼容生成的 API 类型，不改变运行时的字符串
    const res = await editPictureUsingPost({
      ...pictureForm,
      id: pictureId,
      ...(spaceId.value ? { spaceId: spaceId.value as unknown as number } : {}),
    })

    if (res.data.code === 0 && res.data.data) {
      message.success(isEditMode.value ? '修改成功' : '创建成功')

      // 保存成功后跳转图片详情页
      await router.push(`/picture/${pictureId}`)
    } else {
      message.error('操作失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('保存图片失败：', error)
    message.error('操作失败，请检查后端接口')
  } finally {
    loading.value = false
  }
}

// 八、获取分类和标签选项
const getTagCategoryOptions = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()

    if (res.data.code === 0 && res.data.data) {
      categoryOptions.value = (res.data.data.categoryList ?? []).map((item: string) => ({
        value: item,
        label: item,
      }))

      tagOptions.value = (res.data.data.tagList ?? []).map((item: string) => ({
        value: item,
        label: item,
      }))
    } else {
      message.error('加载分类和标签失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取分类和标签失败：', error)
    message.error('获取分类和标签失败')
  }
}

// 九、编辑模式下获取旧图片信息
const getOldPicture = async () => {
  const id = route.query.id

  if (typeof id !== 'string' || !id) {
    picture.value = undefined

    Object.assign(pictureForm, {
      name: undefined,
      introduction: undefined,
      category: undefined,
      tags: [],
    })

    return
  }

  try {
    const res = await getPictureVoByIdUsingGet({
      id: id as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data

      picture.value = data
      pictureForm.name = data.name
      pictureForm.introduction = data.introduction
      pictureForm.category = data.category
      pictureForm.tags = parseTags(data.tags)
    } else {
      message.error('获取图片信息失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取旧图片失败：', error)
    message.error('获取图片信息失败，请检查后端接口')
  }
}

// 十、页面初始化
onMounted(() => {
  void getTagCategoryOptions()
})

// 十一、监听图片 ID，支持创建和编辑模式切换
watch(
  () => route.query.id,
  () => {
    void getOldPicture()
  },
  { immediate: true },
)
</script>

<style scoped>
#addPicturePage {
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

#addPicturePage :deep(.ant-form-item) {
  margin-bottom: 22px;
}
</style>
