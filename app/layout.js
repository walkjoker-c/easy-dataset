import './globals.css';
import ThemeRegistry from '@/components/ThemeRegistry';
import I18nProvider from '@/components/I18nProvider';
import { Toaster } from 'sonner';
import { Provider } from 'jotai';

// CUSTOM: 自定义品牌元数据 (迁移自1.4.0)
export const metadata = {
  title: '训练数据管理平台',
  description: '一个强大的 LLM 数据集生成工具',
  icons: {
    icon: '/imgs/kuakua.ico' // CUSTOM: 使用自定义favicon (迁移自1.4.0)
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Provider>
          <ThemeRegistry>
            <I18nProvider>
              {children}
              <Toaster richColors position="top-center" />
            </I18nProvider>
          </ThemeRegistry>
        </Provider>
      </body>
    </html>
  );
}
