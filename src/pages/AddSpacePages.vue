<template>
  <div id="addSpacePage">
    <!-- 页面标题 -->
    <h2 class="page-title">
      {{ isEditMode ? '修改空间' : '创建空间' }}
    </h2>

    <!-- 空间信息表单 -->
    <a-form
      layout="vertical"
      :model="formData"
      @finish="handleSubmit"
    >
      <a-form-item
        label="空间名称"
        name="spaceName"
      >
        <a-input
          v-model:value="formData.spaceName"
          placeholder="请输入空间名称"
          allow-clear
        />
      </a-form-item>

      <a-form-item
        label="空间级别"
        name="spaceLevel"
      >
        <a-select
          v-model:value="formData.spaceLevel"
          :options="SPACE_LEVEL_OPTIONS"
          placeholder="请选择空间级别"
          style="min-width: 180px"
          allow-clear
        />
      </a-form-item>

      <a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          :loading="loading"
          block
        >
          {{ isEditMode ? '保存修改' : '创建空间' }}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 空间级别介绍 -->
    <a-card title="空间级别介绍" class="level-card">
      <a-typography-paragraph>
        * 目前仅支持开通普通版，如需升级空间，请联系
        <a
          href="https://codefather.cn"
          target="_blank"
          rel="noopener noreferrer"
        >
          程序员鱼皮
        </a>。
      </a-typography-paragraph>

      <a-typography-paragraph
        v-for="spaceLevel in spaceLevelList"
        :key="spaceLevel.value"
      >
        {{ spaceLevel.text }}：
        大小 {{ formatSize(spaceLevel.maxSize) }}，
        数量 {{ spaceLevel.maxCount }}
      </a-typography-paragraph>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

import {
  addSpaceUsingPost,
  updateSpaceUsingPost,
  getSpaceVoByIdUsingGet,
  listSpaceLevelUsingGet,
} from '@/api/spaceController'

import {
  SPACE_LEVEL_ENUM,
  SPACE_LEVEL_OPTIONS,
} from '@/constants/space'

// 一、路由
const router = useRouter()
const route = useRoute()

// 是否为编辑模式
const isEditMode = computed(() => Boolean(route.query.id))

// 二、加载状态
const loading = ref(false)

// 三、空间表单
const formData = reactive<API.SpaceAddRequest & API.SpaceUpdateRequest>({
  spaceName: '',
  spaceLevel: SPACE_LEVEL_ENUM.COMMON,
})

// 四、原有空间数据
const oldSpace = ref<API.SpaceVO>()

// 五、空间级别列表
const spaceLevelList = ref<API.SpaceLevel[]>([])

// 六、格式化空间大小
const formatSize = (size?: number | string) => {
  const bytes = Number(size)

  if (!Number.isFinite(bytes) || bytes < 0) {
    return '-'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// 七、获取空间级别列表
const fetchSpaceLevelList = async () => {
  try {
    const res = await listSpaceLevelUsingGet()

    if (res.data.code === 0 && res.data.data) {
      spaceLevelList.value = res.data.data
    } else {
      message.error('加载空间级别失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取空间级别失败：', error)
    message.error('获取空间级别失败，请检查后端接口')
  }
}

// 八、获取原有空间数据
const getOldSpace = async () => {
  const id = route.query.id

  // 创建模式：清空旧空间信息
  if (typeof id !== 'string' || !id) {
    oldSpace.value = undefined
    formData.spaceName = ''
    formData.spaceLevel = SPACE_LEVEL_ENUM.COMMON
    return
  }

  try {
    const res = await getSpaceVoByIdUsingGet({
      id: id as unknown as number,
    })

    if (res.data.code === 0 && res.data.data) {
      const data = res.data.data

      oldSpace.value = data
      formData.spaceName = data.spaceName ?? ''
      formData.spaceLevel = data.spaceLevel ?? SPACE_LEVEL_ENUM.COMMON
    } else {
      message.error('获取空间信息失败：' + (res.data.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取旧空间失败：', error)
    message.error('获取空间信息失败，请检查后端接口')
  }
}

// 九、提交表单：创建或编辑空间
const handleSubmit = async () => {
  if (loading.value) {
    return
  }

  if (!formData.spaceName?.trim()) {
    message.warning('请输入空间名称')
    return
  }

  if (formData.spaceLevel == null) {
    message.warning('请选择空间级别')
    return
  }

  // 编辑时优先使用路由中的 ID，避免依赖旧数据加载状态
  const spaceId = oldSpace.value?.id

  if (isEditMode.value && spaceId == null) {
    message.warning('空间信息尚未加载完成')
    return
  }

  loading.value = true

  try {
    if (isEditMode.value && spaceId != null) {
      // 编辑空间
      const res = await updateSpaceUsingPost({
        id: spaceId,
        spaceName: formData.spaceName,
        spaceLevel: formData.spaceLevel,
      })

      if (res.data.code === 0 && res.data.data === true) {
        message.success('修改成功')
        await router.push(`/space/${spaceId}`)
      } else {
        message.error('修改失败：' + (res.data.message || '未知错误'))
      }
    } else {
      // 创建空间
      const res = await addSpaceUsingPost({
        spaceName: formData.spaceName,
        spaceLevel: formData.spaceLevel,
      })

      if (res.data.code === 0 && res.data.data != null) {
        message.success('创建成功')
        await router.push(`/space/${res.data.data}`)
      } else {
        message.error('创建失败：' + (res.data.message || '未知错误'))
      }
    }
  } catch (error) {
    console.error('空间操作失败：', error)
    message.error('操作失败，请检查后端接口或登录状态')
  } finally {
    loading.value = false
  }
}

// 十、页面初始化
onMounted(() => {
  void fetchSpaceLevelList()
})

// 十一、监听空间 ID，支持创建与编辑模式切换
watch(
  () => route.query.id,
  () => {
    void getOldSpace()
  },
  { immediate: true },
)
</script>

<style scoped>
#addSpacePage {
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

#addSpacePage :deep(.ant-form-item) {
  margin-bottom: 22px;
}

.level-card {
  margin-top: 24px;
}
</style>
