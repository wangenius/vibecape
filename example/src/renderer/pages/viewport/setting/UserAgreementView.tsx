import { dialog } from '@/components/custom/DialogModal';

export const UserAgreementView = () => {
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
      <h1 className="text-3xl font-bold mb-6">用户协议</h1>
      <p className="text-muted-foreground mb-8">
        <strong>生效日期</strong>：2024年9月3日
      </p>
      <p className="text-foreground/90 leading-relaxed">
        欢迎您使用我们的产品和服务。在使用我们的产品或服务之前，请仔细阅读并同意以下用户协议。本协议规定了您与我们的权利和义务，并对您使用我们的产品或服务具有法律约束力。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">1. 服务的使用</h2>
      <p className="text-foreground/90">
        您同意仅为合法目的并按照本协议的条款使用我们的服务。您不得利用我们的服务从事任何违法、侵权、或不正当的活动。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">2. 用户责任</h2>
      <p className="text-foreground/90">
        作为用户，您有责任确保您的行为符合本协议及相关法律法规的要求。您不得通过我们的服务上传、发布或传播任何违法、有害、骚扰、诽谤、淫秽或其他不良内容。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">3. 知识产权</h2>
      <p className="text-foreground/90">
        我们拥有或被授权使用我们的服务中所包含的所有内容，包括但不限于文本、图像、软件、代码和商标。未经我们事先书面许可，您不得复制、修改、分发或展示这些内容。您创作的内容，您享有全部的知识产权。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">4. 账户安全</h2>
      <p className="text-foreground/90">
        您有责任维护您的账户和密码的机密性，并对您账户下发生的所有活动负责。如果您发现或怀疑您的账户安全受到了威胁，请立即通知我们。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">5. 第三方链接</h2>
      <p className="text-foreground/90">
        我们的服务可能包含指向第三方网站或服务的链接。我们对这些第三方网站或服务的内容、隐私政策或做法不承担任何责任。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">6. 免责声明</h2>
      <p className="text-foreground/90">
        我们的服务按"原样"提供，不提供任何明示或暗示的保证。我们不保证服务的持续、无错误或无病毒。我们不对因使用我们的服务而导致的任何损失或损害承担责任。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">7. 责任限制</h2>
      <p className="text-foreground/90">
        在任何情况下，我们均不对因使用或无法使用我们的服务而产生的任何间接、附带、特殊、惩罚性或后果性损害承担责任。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">8. 终止</h2>
      <p className="text-foreground/90">
        我们保留在不事先通知的情况下终止或暂停您的账户或访问我们的服务的权利，特别是在您违反本协议的情况下。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">9. 协议的修改</h2>
      <p className="text-foreground/90">
        我们可能会不时修改本协议。任何修改将在我们发布更新的协议时生效。我们建议您定期查看本协议以了解最新条款。
      </p>

      <h2 className="text-2xl font-semibold mt-8 mb-4">10. 联系我们</h2>
      <p className="text-foreground/90">
        如果您对本用户协议有任何疑问或需要进一步信息，请通过以下方式与我们联系：
      </p>
      <p className="text-foreground/90">
        电子邮件
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

UserAgreementView.open = () => {
  dialog({
    className: 'max-w-screen-md',
    content: <UserAgreementView />,
  });
};
