import type { DefaultTheme } from 'vitepress';

import { defineConfig } from 'vitepress';

import { version } from '../../../package.json';

export const zh = defineConfig({
  description: 'NG Gateway & 新一代高性能 IoT 网关',
  lang: 'zh-Hans',
  themeConfig: {
    darkModeSwitchLabel: '主题',
    darkModeSwitchTitle: '切换到深色模式',
    docFooter: {
      next: '下一页',
      prev: '上一页',
    },
    editLink: {
      pattern:
        'https://github.com/shiyuecamus/node-grove-gateway/edit/main/docs/src/:path',
      text: '在 GitHub 上编辑此页面',
    },
    footer: {
      copyright: `Copyright © 2020-${new Date().getFullYear()} Shiyuecamus`,
      message: '基于 MIT 许可发布.',
    },
    langMenuLabel: '多语言',
    lastUpdated: {
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
      text: '最后更新于',
    },
    lightModeSwitchTitle: '切换到浅色模式',
    nav: nav(),

    outline: {
      label: '页面导航',
      level: 'deep',
    },
    returnToTopLabel: '回到顶部',

    // Best practice for product docs: a global sidebar tree so readers can always see the full TOC.
    sidebar: sidebar(),
    sidebarMenuLabel: '菜单',
  },
});

function sidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      collapsed: false,
      text: '概览',
      items: [
        { link: '/overview/', text: '产品概览' },
        { link: '/overview/architecture', text: '核心架构' },
      ],
    },
    {
      collapsed: true,
      text: '安装',
      items: [
        { link: '/install/', text: '快速开始' },
        { link: '/install/docker', text: 'Docker 安装' },
        { link: '/install/helm', text: 'Helm 安装' },
        { link: '/install/macos', text: 'MacOS 安装' },
        { link: '/install/linux', text: 'Linux 安装' },
        { link: '/install/windows', text: 'Windows 安装' },
      ],
    },
    {
      collapsed: true,
      text: '南向',
      items: [
        { link: '/southward/overview', text: '南向总览' },
        { link: '/southward/modbus', text: 'Modbus' },
        { link: '/southward/s7', text: '西门子 S7' },
        { link: '/southward/iec104', text: 'IEC 60870-5-104' },
        { link: '/southward/dlt645', text: 'DLT645' },
        { link: '/southward/cjt188', text: 'CJT188' },
        { link: '/southward/opcua', text: 'OPC UA' },
        { link: '/southward/ethernet-ip', text: 'Ethernet-IP' },
        { link: '/southward/dnp3', text: 'DNP3' },
        { link: '/southward/mc', text: '三菱 MC' },
      ],
    },
    {
      collapsed: true,
      text: '北向',
      items: [
        { link: '/northward/overview', text: '北向总览' },
        { link: '/northward/kafka', text: 'Kafka' },
        { link: '/northward/pulsar', text: 'Pulsar' },
        { link: '/northward/thingsboard', text: 'Thingsboard' },
        { link: '/northward/opcua', text: 'OPC UA Server' },
        { link: '/northward/mqtt', text: 'MQTT' },
        { link: '/northward/websocket', text: 'WebSocket' },
        { link: '/northward/http', text: 'HTTP' },
      ],
    },
    {
      collapsed: true,
      text: '运维',
      items: [
        { link: '/ops/data-monitor', text: '数据监控' },
        { link: '/ops/action-debug', text: 'Action 调试' },
        { link: '/ops/configuration', text: '配置管理' },
        { link: '/ops/logging', text: '日志管理' },
        { link: '/ops/metrics', text: '指标管理' },
        { link: '/ops/tracing', text: '指标追踪' },
        { link: '/ops/faq', text: '常见问题及故障排查' },
      ],
    },
    {
      collapsed: true,
      text: '开发',
      items: [
        { link: '/dev/driver-dev', text: '南向驱动开发' },
        { link: '/dev/plugin-dev', text: '北向插件开发' },
      ],
    },
    {
      collapsed: true,
      text: '指南',
      items: [
        { link: '/guide/other/release', text: '发布日志' },
        { link: '/guide/other/roadmap', text: '路线图' },
      ],
    },
    {
      collapsed: true,
      text: '附录',
      items: [
        { link: '/appendix/data-types', text: '数据类型' },
        { link: '/appendix/protocol-docs', text: '协议文档' },
      ],
    },
  ];
}

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: '文档',
      link: '/overview/',
    },
    {
      text: version,
      items: [
        {
          link: 'https://github.com/vbenjs/vue-vben-admin/releases',
          text: '更新日志',
        },
      ],
    },
    {
      link: '/commercial/technical-support',
      text: '🦄 技术支持',
    },
    {
      link: '/sponsor/personal',
      text: '✨ 赞助',
    },
    {
      link: '/commercial/community',
      text: '👨‍👦‍👦 交流群',
      // items: [
      //   {
      //     link: 'https://qun.qq.com/qqweb/qunpro/share?_wv=3&_wwv=128&appChannel=share&inviteCode=22ySzj7pKiw&businessType=9&from=246610&biz=ka&mainSourceId=share&subSourceId=others&jumpsource=shorturl#/pc',
      //     text: 'QQ频道',
      //   },
      //   {
      //     link: 'https://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=mjZmlhgVzzUxvdxllB6C1vHpX8O8QRL0&authKey=DBdFbBwERmfaKY95JvRWqLCJIRGJAmKyZbrpzZ41EKDMZ5SR6MfbjOBaaNRN73fr&noverify=0&group_code=4286109',
      //     text: 'QQ群',
      //   },
      //   {
      //     link: 'https://discord.gg/VU62jTecad',
      //     text: 'Discord',
      //   },
      // ],
    },
    // {
    //   link: '/friend-links/',
    //   text: '🤝 友情链接',
    // },
  ];
}

export const search: DefaultTheme.AlgoliaSearchOptions['locales'] = {
  root: {
    placeholder: '搜索文档',
    translations: {
      button: {
        buttonAriaLabel: '搜索文档',
        buttonText: '搜索文档',
      },
      modal: {
        errorScreen: {
          helpText: '你可能需要检查你的网络连接',
          titleText: '无法获取结果',
        },
        footer: {
          closeText: '关闭',
          navigateText: '切换',
          searchByText: '搜索提供者',
          selectText: '选择',
        },
        noResultsScreen: {
          noResultsText: '无法找到相关结果',
          reportMissingResultsLinkText: '点击反馈',
          reportMissingResultsText: '你认为该查询应该有结果？',
          suggestedQueryText: '你可以尝试查询',
        },
        searchBox: {
          cancelButtonAriaLabel: '取消',
          cancelButtonText: '取消',
          resetButtonAriaLabel: '清除查询条件',
          resetButtonTitle: '清除查询条件',
        },
        startScreen: {
          favoriteSearchesTitle: '收藏',
          noRecentSearchesText: '没有搜索历史',
          recentSearchesTitle: '搜索历史',
          removeFavoriteSearchButtonTitle: '从收藏中移除',
          removeRecentSearchButtonTitle: '从搜索历史中移除',
          saveRecentSearchButtonTitle: '保存至搜索历史',
        },
      },
    },
  },
};
