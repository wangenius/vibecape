import { dialog } from '@/components/custom/DialogModal';

export const PrivacyPolicyView = () => {
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div
          className="prose prose-slate dark:prose-invert max-w-4xl mx-auto px-6 py-6 *:select-text"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.8',
          }}
        >
      <h1 className="text-3xl font-bold mb-6">隐私政策</h1>
      <p className="text-muted-foreground mb-8">
        <strong>生效日期</strong>：2024年9月3日
      </p>

      <p className="text-foreground/90 leading-relaxed">
        我们非常重视您的隐私。本隐私政策解释了我们如何收集、使用、披露和保护您的个人信息。当您使用我们的产品或服务时，您同意按照本隐私政策的规定处理您的信息。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. 我们收集的信息</h2>
      <p className="text-foreground/90">
        我们可能会收集以下类型的信息：
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li className="text-foreground/90">
          <strong>个人身份信息</strong>：如您的微信UnionID等。
        </li>
        <li className="text-foreground/90">
          <strong>使用数据</strong>
          ：包括您如何使用我们的产品或服务的信息，如您的IP地址、和访问时间等。
        </li>
        <li className="text-foreground/90">
          <strong>AI信息</strong>
          ：关于您使用AI生成的信息部分信息，包括创作类型等，不包括您创作的内容。
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. 信息的使用</h2>
      <p className="text-foreground/90">
        我们可能会将您的信息用于以下目的：
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li className="text-foreground/90">
          提供和维护我们的服务
        </li>
        <li className="text-foreground/90">
          改进和优化我们的产品
        </li>
        <li className="text-foreground/90">
          分析用户行为以提高用户体验
        </li>
        <li className="text-foreground/90">
          与您沟通，包括发送重要通知或营销信息
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. 信息的分享</h2>
      <p className="text-foreground/90">
        我们不会将您的个人信息出售、交易或出租给第三方。我们可能在以下情况下分享您的信息：
      </p>
      <ul className="list-disc pl-6 space-y-2">
        <li className="text-foreground/90">
          <strong>法律要求</strong>
          ：如果我们有合理的理由相信披露您的信息是为了遵守法律、法庭命令或其他法律程序。
        </li>
        <li className="text-foreground/90">
          <strong>业务转让</strong>
          ：如果我们参与合并、收购或资产出售，您的信息可能会作为交易的一部分被转移。
        </li>
      </ul>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. 数据安全</h2>
      <p className="text-foreground/90">
        我们采取合理的措施来保护您的信息免受未经授权的访问、使用或披露。然而，没有任何在线传输或存储方法是100%安全的，我们无法保证绝对的安全性。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. 您的权利</h2>
      <p className="text-foreground/90">
        根据适用的法律，您可能有权访问、更正或删除我们收集的您的个人信息。您也可以选择不接收我们的营销通讯。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. 儿童隐私</h2>
      <p className="text-foreground/90">
        我们的服务不面向13岁以下的儿童。我们不会故意收集13岁以下儿童的个人信息。如果发现我们无意中收集了13岁以下儿童的信息，我们将采取措施尽快删除这些信息。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. 隐私政策的更改</h2>
      <p className="text-foreground/90">
        我们可能会不时更新本隐私政策。任何更改将在我们发布更新的隐私政策时生效。我们建议您定期查看此政策，以了解我们的隐私实践。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. 联系我们</h2>
      <p className="text-foreground/90">
        如果您对本隐私政策有任何疑问或担忧，请通过以下方式与我们联系：
      </p>
      <p className="text-foreground/90">
        电子邮件{' '}
        <a
          href="mailto:jezz_official@outlook.com"
          className="text-primary hover:underline"
        >
          jezz_official@outlook.com
        </a>
      </p>
        </div>
      </div>
    </div>
  );
};

PrivacyPolicyView.open = () => {
  dialog({
    className: 'max-w-screen-md',
    content: <PrivacyPolicyView />,
  });
};
