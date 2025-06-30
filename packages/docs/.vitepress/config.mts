import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: '简音创作教程',
  description: '简音创作网站使用教程，及SimpleNotation库使用教程',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '首页', link: '/' },
      { text: '网站教程', link: '/site-tutorial/module' },
    ],

    sidebar: [
      {
        text: '网站教程',
        items: [
          { text: '模块介绍', link: '/site-tutorial/module' },
          { text: '语法教程', link: '/site-tutorial/syntax' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Encaik/simple-notation' },
      { icon: 'npm', link: 'https://www.npmjs.com/package/simple-notation' },
    ],
  },
});
