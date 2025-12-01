export const MetaVaultIntro = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16">
      {/* 第一部分：什么是世界观 */}
      <section className="mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-8">
            什么是世界观
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed">
              世界观是介子创作的核心基础，它解构了故事逻辑，定义了故事的基本框架和规则。
              通过AI加持的
              <span className="font-bold bg-blue-100 px-2 rounded-md">
                MetaForge(元工坊)
              </span>
              世界观设计引擎，你可以高效、系统地利用AI构建和管理你的创作世界，让创作更加高效、连贯且富有深度。
            </p>
          </div>
        </div>
      </section>

      {/* 第二部分：为什么设置世界观 */}
      <section className="mb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            为什么设置世界观
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 leading-relaxed mb-2">
            世界观架构可以快速驱动各种形式的作品出现。通过解构化的世界观设计，让AI能够更好地理解和生成内容，实现从单一故事到多形式创作的跨越。解构化的世界观不仅便于AI理解和处理，也为二次创作提供了丰富的素材库和创作空间。
          </p>
        </div>
        <div className="max-w-7xl mx-auto">
          {/* 中心逻辑层 */}
          <div className="bg-muted rounded-2xl p-8 mb-4 border border-gray-100">
            <div className="flex items-center mb-8">
              <div className="flex flex-col items-center justify-center w-full">
                <h3 className="text-2xl font-semibold text-gray-900">
                  逻辑层(世界观)
                </h3>
                <p className="text-sm text-gray-500 mt-1">创作的核心引擎</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">知识体系</h4>
                <p className="text-sm text-gray-600">
                  系统化的创作知识库，包含角色、设定、情节等核心要素
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">创作引擎</h4>
                <p className="text-sm text-gray-600">
                  AI驱动的创作系统，确保内容的连贯性和深度
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <h4 className="font-medium text-gray-900 mb-2">创作工具箱</h4>
                <p className="text-sm text-gray-600">
                  提供丰富的创作工具和方法，支持多元化的创作形式
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted rounded-2xl p-8 mb-4 border border-gray-100">
            <div className="flex items-center mb-8">
              <div className="flex flex-col items-center justify-center w-full">
                <h3 className="text-2xl font-semibold text-gray-900">表达层</h3>
                <p className="text-sm text-gray-500 mt-1">创作的表达形式</p>
              </div>
            </div>
            {/* 表现层 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-2xl">
              {/* 小说 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">小说</h4>
                </div>
                <p className="text-sm text-gray-600">
                  通过文字构建故事世界，展现人物和情节。
                </p>
              </div>

              {/* 剧本 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">剧本</h4>
                </div>
                <p className="text-sm text-gray-600">
                  将故事转化为可执行的表演文本。
                </p>
              </div>

              {/* 电影 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">电影</h4>
                </div>
                <p className="text-sm text-gray-600">
                  通过影像语言展现故事世界。
                </p>
              </div>

              {/* 智能体 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">智能体</h4>
                </div>
                <p className="text-sm text-gray-600">
                  AI驱动的互动式故事体验。
                </p>
              </div>

              {/* 游戏 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">游戏</h4>
                </div>
                <p className="text-sm text-gray-600">
                  互动式故事体验，让玩家参与其中。
                </p>
              </div>

              {/* 漫画 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">漫画</h4>
                </div>
                <p className="text-sm text-gray-600">
                  通过图像叙事展现故事世界。
                </p>
              </div>

              {/* 动画 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">动画</h4>
                </div>
                <p className="text-sm text-gray-600">动态视觉叙事体验。</p>
              </div>

              {/* 更多 */}
              <div className="bg-white rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 rounded-md bg-gray-50 flex items-center justify-center mr-2 border border-gray-100">
                    <svg
                      className="w-4 h-4 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <h4 className="font-medium text-gray-900">更多</h4>
                </div>
                <p className="text-sm text-gray-600">探索更多创作可能性。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 第三部分：世界观的核心要素 */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            世界观的核心要素
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-gray-600">
            一个完整的世界观由三个核心要素构成。这些要素共同构建了创作世界的基础框架，为作品提供坚实的支撑。
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* 情节 */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                情节-Story
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              情节是故事发展的脉络，通过设计完整的情节结构，包括主线剧情、支线故事、关键事件等，让故事在既定的世界观框架下自然展开。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">情节结构</h4>
                <p className="text-gray-600">
                  通过剧情流的方式组织起来，实际用于情节的单元发展以及AI生成的上下文参考。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">内容细纲</h4>
                <p className="text-gray-600">
                  情节的详细描述，是对过程的详细描述，不涉及具体的表现形式。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">情节操作</h4>
                <p className="text-gray-600">
                  包括拆解、接续、章节化等操作，帮助创作者更好地展开和管理情节。
                </p>
              </div>
            </div>
          </div>

          {/* 角色 */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                角色-Actant
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              角色是世界观中的主体，包括人物、组织、势力、物品等一切具有能动性的元素。每个角色都有其独特的属性、状态和关系网络。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">动作者</h4>
                <p className="text-gray-600">
                  推动故事发展的核心角色，包括主要人物、重要组织等具有主动性的元素。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">受动者</h4>
                <p className="text-gray-600">
                  影响故事走向的关键对象，包括目标、阻碍、冲突等被动性元素。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">工具</h4>
                <p className="text-gray-600">
                  推动情节发展的关键要素，包括道具、能力、资源等辅助性元素。
                </p>
              </div>
            </div>
          </div>

          {/* 设定 */}
          <div className="bg-white rounded-lg p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-3">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                设定-Schema
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              设定定义了世界观的基本规则和框架，是创作的重要依据。它决定了世界运作的基本法则，为角色提供固有属性，确保故事在合理的范围内发展。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">世界规则</h4>
                <p className="text-gray-600">
                  定义世界的基本运作法则，包括物理法则、魔法体系、科技水平等基础设定。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">社会制度</h4>
                <p className="text-gray-600">
                  描述社会的组织结构和运作方式，包括政治体制、经济体系、文化传统等。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">角色属性</h4>
                <p className="text-gray-600">
                  规定角色的基本特征和能力范围，包括能力体系、性格特征、成长规则等。
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">时间线</h4>
                <p className="text-gray-600">
                  记录世界的重要历史事件和发展脉络，包括历史背景、重要节点、时间跨度等。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
