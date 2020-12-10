import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { exact: true,  path: '/users/:editType(|create|edit)?/:id?', component: '@/pages/users' },
    { component: '@/pages/404' },
  ],
});
