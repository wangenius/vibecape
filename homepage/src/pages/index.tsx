import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';
import Page from '../components/page';
import '@site/src/styles/global.css';

export default function Home(): ReactNode {
  return (
    <Layout
      title="vibecape - SaaS 应用搭建神器"
      description="vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: `{
          \"@context\": \"https://schema.org\",
          \"@type\": \"SoftwareApplication\",
          \"name\": \"vibecape\",
          \"applicationCategory\": \"DeveloperApplication\",
          \"operatingSystem\": \"Windows, macOS, Linux\",
          \"url\": \"https://vibecape.com\",
          \"downloadUrl\": \"https://github.com/vibe-cli/vibe\",
          \"softwareVersion\": \"1.0.0\",
          \"description\": \"vibecape 是一个 SaaS 应用搭建神器，让开发者用一行命令就能快速搭建出完整的在线服务系统。支持快速集成认证、支付、数据库、国际化等中间件。\",
          \"keywords\": \"SaaS, CLI, 工具, 快速开发, Next.js, React, TypeScript, 认证, 支付\",
          \"author\": {
            \"@type\": \"Organization\",
            \"name\": \"vibecape Team\"
          },
          \"offers\": {
            \"@type\": \"Offer\",
            \"price\": \"0\",
            \"priceCurrency\": \"USD\"
          }
        }`,
        }}
      />
      <Page />
    </Layout>
  );
}
