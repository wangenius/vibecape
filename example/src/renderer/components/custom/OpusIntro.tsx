export const OpusIntro = () => {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-16">
      {/* 第一部分：什么是世界观 */}
      <section className="mb-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-8">
            什么是作品（Opus）
          </h1>
          <div className="max-w-3xl mx-auto">
            <p className="text-xl text-gray-600 leading-relaxed">
              介子的作品包括小说、智能体、剧本、电影、游戏、漫画、动画等。目前版本支持小说。
            </p>
          </div>
        </div>
      </section>

      {/* 第二部分：为什么设置世界观 */}
      <section>
        <div className="max-w-7xl mx-auto">
          <div className="bg-muted rounded-2xl p-8 mb-4 border border-gray-100">
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
    </div>
  );
};
