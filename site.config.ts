import { siteConfig } from './lib/site-config';

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '04431c24227545c4bfda0261f136699f',
  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: 'eaa8cae3-750f-477e-9f30-3d5f233c3c32',

  name: 'Lamyzm blog',
  domain: 'lnotion-next-js-blog-starter-kit-git-main-levijou-boos-projects.vercel.app',
  author: '2skydev',

  // open graph metadata (optional)
  description: 'Lamyzm blog - developer blog',

  // social usernames (optional)
  // twitter: 'transitive_bs',
  github: 'Lamyzm',
  // linkedin: 'fisch2',
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon:
    'https://private-user-images.githubusercontent.com/58257616/370933986-0acc3700-f0d2-48c9-8c35-450bddef7067.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3MjczMTE2MzQsIm5iZiI6MTcyNzMxMTMzNCwicGF0aCI6Ii81ODI1NzYxNi8zNzA5MzM5ODYtMGFjYzM3MDAtZjBkMi00OGM5LThjMzUtNDUwYmRkZWY3MDY3LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDA5MjYlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQwOTI2VDAwNDIxNFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPThhMTUxNTYwMTFkYjE2MjMxYThjNmY3NzI4MTYzNWEwMWUzNzEwZTY4NTQ4MjdhZDA1NTM0ODdhMTQzNDBhYjkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.ut7VvAxJMFMpza2wMkNJs53z2PJtY03jeZevYUzQSgw',
  defaultPageCover: null,
  defaultPageCoverPosition: 0.5,

  // whether or not to enable support for LQIP preview images (optional)
  isPreviewImageSupportEnabled: true,

  // whether or not redis is enabled for caching generated preview images (optional)
  // NOTE: if you enable redis, you need to set the `REDIS_HOST` and `REDIS_PASSWORD`
  // environment variables. see the readme for more info
  isRedisEnabled: false,

  // map of notion page IDs to URL paths (optional)
  // any pages defined here will override their default URL paths
  // example:
  //
  // pageUrlOverrides: {
  //   '/foo': '067dd719a912471ea9a3ac10710e7fdf',
  //   '/bar': '0be6efce9daf42688f65c76b89f8eb27'
  // }
  pageUrlOverrides: null,

  // whether to use the default notion navigation style or a custom one with links to
  // important pages
  navigationStyle: 'custom',
  navigationLinks: [
    {
      title: '카테고리',
      pageId: 'a8785e82ad0e43728b087f54fafcbe6b',
    },
  ],
  // -------- custom configs (2skydev) -------------

  // date-fns format string
  dateformat: 'yyyy년 MM월 dd일',

  // post page - hidden properties
  hiddenPostProperties: ['설명', '상태', '최하위 정렬'],

  // contentPosition (table of contents) text align
  contentPositionTextAlign: 'left',

  // default theme color
  defaultTheme: 'dark',

  // enable comment
  enableComment: true,
});
