import { siteConfig } from './lib/site-config';

export default siteConfig({
  // the site's root Notion page (required)
  rootNotionPageId: '04431c24227545c4bfda0261f136699f',
  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: 'eaa8cae3-750f-477e-9f30-3d5f233c3c32',

  name: '2skydev blog',
  domain: 'lnotion-next-js-blog-starter-kit-git-main-levijou-boos-projects.vercel.app',
  author: '2skydev',

  // open graph metadata (optional)
  description: '2skydev blog - developer blog',

  // social usernames (optional)
  // twitter: 'transitive_bs',
  github: 'Lamyzm',
  // linkedin: 'fisch2',
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon:
    'https://file.notion.so/f/f/eaa8cae3-750f-477e-9f30-3d5f233c3c32/370b7b59-5a99-4f84-8cd0-11810dc75b31/Untitled.png?table=block&id=ff6c2a6b-9751-4755-8d4d-cfab4457fa67&spaceId=eaa8cae3-750f-477e-9f30-3d5f233c3c32&expirationTimestamp=1726891200000&signature=I-IBsTW91bv9s--Cpu8NImqCbKanICcQRWbCdtOvlxE&downloadName=Untitled.png',
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
