// CUSTOM: REQ-003 - Server Component wrapper
// 在服务端读取环境变量，传递给客户端组件
// 这样可以在运行时（runtime）动态配置，无需重新构建镜像

import TextSplitClientPage from './TextSplitClientPage';

export default function TextSplitPage({ params }) {
  // 在 Server Component 中读取环境变量
  // 注意：Server Component 可以访问任何环境变量（不需要 NEXT_PUBLIC_ 前缀）
  const obsDefaultEnv = process.env.OBS_DEFAULT_ENV || process.env.NEXT_PUBLIC_OBS_DEFAULT_ENV || '';

  return <TextSplitClientPage projectId={params.projectId} obsDefaultEnv={obsDefaultEnv} />;
}
