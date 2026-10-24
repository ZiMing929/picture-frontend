import { generateService } from '@umijs/openapi'

generateService({
  requestLibPath: "import request from '@/request'",
  schemaPath: 'http://localhost:8124/api/v2/api-docs',   // 这是后端的请求地址！
  serversPath: './src',
})
