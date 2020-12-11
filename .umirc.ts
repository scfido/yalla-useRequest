import { defineConfig } from 'umi';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  routes: [
    { exact: true,  path: '/users/:action(create|edit)/:id?', component: '@/pages/users' },
    { exact: true,  path: '/users', component: '@/pages/users' },
    { component: '@/pages/404' },
  ],
});
