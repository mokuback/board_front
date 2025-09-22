<script setup lang="ts">
import { ref, computed } from 'vue'

const currentCategory = ref('audit')

const categories = [
  { id: 'audit', name: '稽核' },
  { id: 'info', name: '資訊' },
  { id: 'other', name: '其它' }
]

const tasks = ref([
  // 稽核类别任务
  {
    id: 1,
    title: '内部系统安全稽核',
    category: 'audit',
    showProgress: false,
    progress: [
      { date: '2024-01-15', description: '完成初步安全评估' },
      { date: '2024-01-20', description: '制定稽核计划' },
      { date: '2024-01-25', description: '执行系统检查' },
      { date: '2024-01-30', description: '生成稽核报告' }
    ]
  },
  {
    id: 2,
    title: '财务流程稽核',
    category: 'audit',
    showProgress: false,
    progress: [
      { date: '2024-01-10', description: '收集财务文件' },
      { date: '2024-01-18', description: '审查交易记录' },
      { date: '2024-01-25', description: '完成合规检查' }
    ]
  },
  // 资讯类别任务
  {
    id: 3,
    title: '系统升级项目',
    category: 'info',
    showProgress: false,
    progress: [
      { date: '2024-01-12', description: '需求分析' },
      { date: '2024-01-18', description: '系统设计' },
      { date: '2024-01-24', description: '开发实施' },
      { date: '2024-01-30', description: '测试验收' },
      { date: '2024-02-05', description: '正式上线' }
    ]
  },
  {
    id: 4,
    title: '数据迁移计划',
    category: 'info',
    showProgress: false,
    progress: [
      { date: '2024-01-14', description: '数据清洗' },
      { date: '2024-01-21', description: '数据转换' },
      { date: '2024-01-28', description: '数据验证' },
      { date: '2024-02-04', description: '迁移执行' }
    ]
  },
  // 其它类别任务
  {
    id: 5,
    title: '办公室搬迁',
    category: 'other',
    showProgress: false,
    progress: [
      { date: '2024-01-16', description: '场地评估' },
      { date: '2024-01-23', description: '装修设计' },
      { date: '2024-01-30', description: '设备采购' }
    ]
  },
  {
    id: 6,
    title: '年度团建活动',
    category: 'other',
    showProgress: false,
    progress: [
      { date: '2024-01-13', description: '活动策划' },
      { date: '2024-01-20', description: '场地预订' },
      { date: '2024-01-27', description: '活动执行' },
      { date: '2024-02-03', description: '活动总结' }
    ]
  }
])

const filteredTasks = computed(() => {
  return tasks.value.filter(task => task.category === currentCategory.value)
})

const toggleTaskProgress = (taskId: number) => {
  const task = tasks.value.find(t => t.id === taskId)
  if (task) {
    task.showProgress = !task.showProgress
  }
}
</script>

<template>
  <div class="task-board">
    <div class="categories">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['category-btn', { active: currentCategory === cat.id }]"
        @click="currentCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <div class="tasks">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
      >
        <div class="task-card" @click="toggleTaskProgress(task.id)">
          <h3>{{ task.title }}</h3>
        </div>
        <div v-if="task.showProgress" class="progress">
          <div
            v-for="(item, index) in task.progress"
            :key="index"
            class="progress-item"
          >
            <span class="date">{{ item.date }}</span>
            <span class="description">{{ item.description }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-board {
  padding: 20px;
}

.categories {
  margin-bottom: 20px;
}

.category-btn {
  padding: 8px 16px;
  margin-right: 10px;
  border: none;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
}

.category-btn.active {
  background-color: #4CAF50;
  color: white;
}

.tasks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.task-card {
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 0 15px;
}

.progress-item {
  position: relative;
  padding: 12px 20px;
  background-color: #f9f9f9;
  border: 2px solid #4CAF50;
  border-radius: 8px;
  width: 90%;  /* 设置为工作卡片的90%宽度 */
  margin: 0 auto;  /* 居中对齐 */
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.progress-item:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #4CAF50;
}

.date {
  font-weight: bold;
  color: #4CAF50;
  display: block;
  margin-bottom: 4px;
}

.description {
  color: #333;
  font-size: 0.9em;
}
</style>
