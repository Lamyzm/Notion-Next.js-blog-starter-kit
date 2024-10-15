import { siteConfig } from './lib/site-config';

export default siteConfig({
  // the site's root Notion page (required)

  rootNotionPageId: '04431c24227545c4bfda0261f136699f',

  // if you want to restrict pages to a single notion workspace (optional)
  // (this should be a Notion ID; see the docs for how to extract this)
  rootNotionSpaceId: 'eaa8cae3-750f-477e-9f30-3d5f233c3c32',

  name: 'Lamyzm blog',
  domain: 'www.lamyzm.duckdns.org',
  author: '2skydev',

  // open graph metadata (optional)
  description: 'Lamyzm blog - developer blog',

  // social usernames (optional)
  // twitter: 'transitive_bs',
  github: 'https://github.com/Lamyzm?page=1&tab=repositories',
  // linkedin: 'fisch2',
  // newsletter: '#', // optional newsletter URL
  // youtube: '#', // optional youtube channel name or `channel/UCGbXXXXXXXXXXXXXXXXXXXXXX`

  // default notion icon and cover images for site-wide consistency (optional)
  // page-specific values will override these site-wide defaults
  defaultPageIcon:
    'https://file.notion.so/f/f/eaa8cae3-750f-477e-9f30-3d5f233c3c32/f6f4423c-fe57-4106-8fdc-39feb6d97274/98949f547786ebaadc147fb025bf98cb91528fabd1e780bb68c8fb108835cfdb.png?table=block&id=2b259c44-dba3-4ea8-96cb-34f064cd8ca0&spaceId=eaa8cae3-750f-477e-9f30-3d5f233c3c32&expirationTimestamp=1729072800000&signature=tLwAMgabXSkjRilsG24LaQ0HEhWSKGyjMt2zTAqd6JE&downloadName=98949f547786ebaadc147fb025bf98cb91528fabd1e780bb68c8fb108835cfdb.png',
  // https://www.notion.so/image/https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2Feaa8cae3-750f-477e-9f30-3d5f233c3c32%2Ff6f4423c-fe57-4106-8fdc-39feb6d97274%2F98949f547786ebaadc147fb025bf98cb91528fabd1e780bb68c8fb108835cfdb.png?table=block&id=04431c24-2275-45c4-bfda-0261f136699f&spaceId=eaa8cae3-750f-477e-9f30-3d5f233c3c32&width=250&userId=bfb6c5ab-9a81-4b86-ab4d-9d22f11f1f92&cache=v2

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
  navigationLinks: [],
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
