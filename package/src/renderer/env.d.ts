/// <reference types="vite/client" />

declare module 'react-syntax-highlighter' {
  export const Prism: any;
  const Default: any;
  export default Default;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  export const oneDark: any;
  export const oneLight: any;
}

// 由 electron.vite.config.ts define 注入
declare const PACKAGE_VERSION: string;
