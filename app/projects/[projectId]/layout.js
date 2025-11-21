'use client';

import Navbar from '@/components/Navbar';
import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Button, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 导入错误处理工具
// 修改日期: 2025-11-18
import { handleApiError } from '@/lib/custom/utils/errorHandler';
// ========== CUSTOM END ==========

export default function ProjectLayout({ children, params }) {
  const router = useRouter();
  const { projectId } = params;
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [t] = useTranslation();
  // 定义获取数据的函数
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // 清空之前的错误

      // ========== CUSTOM START ==========
      // 定制说明: REQ-004 Keycloak鉴权功能 - 使用错误处理工具
      // 修改日期: 2025-11-18

      // 获取用户创建的项目详情
      const projectsResponse = await fetch(`/api/projects`);
      const projectsData = await handleApiError(projectsResponse, { router, setError });
      if (!projectsData) return; // 错误时handleApiError已处理
      setProjects(projectsData);

      // 获取当前项目详情
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      // 特殊处理404: 项目不存在时直接跳转首页
      if (projectResponse.status === 404) {
        router.push('/');
        return;
      }
      // ISS-002: 安全优化 - 项目详情页禁止401跳转到登录页
      // 定制说明: 设置allowLoginRedirect=false,防止暴露管理员登录入口
      // 修改日期: 2025-11-18
      const projectData = await handleApiError(projectResponse, {
        router,
        setError,
        allowLoginRedirect: false  // 禁止跳转到登录页,仅显示错误
      });
      if (!projectData) return; // 错误时handleApiError已处理
      setCurrentProject(projectData);
      // ========== CUSTOM END ==========
    } catch (error) {
      console.error('加载项目数据出错:', error);
      setError(error.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    // 如果 projectId 是 undefined 或 "undefined"，直接重定向到首页
    if (!projectId || projectId === 'undefined') {
      router.push('/');
      return;
    }

    fetchData();
  }, [projectId, router]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh'
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>加载项目数据...</Typography>
      </Box>
    );
  }

  // ========== CUSTOM START ==========
  // ISS-004: 优化未授权访问错误页面UI
  // ISS-006: 管理员项目显示super_user登录提示
  // 定制说明: 移除"重试"和"返回首页"按钮,避免无效操作和暴露登录入口
  //          管理员项目显示super_user登录按钮(带redirect)
  // 修改日期: 2025-11-18
  if (error) {
    // ISS-006: 检查是否是管理员项目
    // 错误消息包含"仅管理员和审核员可访问"时显示登录按钮
    // (此错误消息由middleware在检测到admin项目时返回)
    const isAdminOnlyProject = error.includes('仅管理员和审核员可访问');

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          p: 3
        }}
      >
        <Alert severity="error" sx={{ maxWidth: 600 }}>
          <Typography variant="body1" fontWeight="600">
            {error}
          </Typography>

          {/* ISS-006: 管理员项目显示super_user登录提示 */}
          {isAdminOnlyProject && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                如果您是审核员,请
                <Button
                  size="small"
                  sx={{ ml: 1 }}
                  variant="outlined"
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    router.push(`/super-user/login?redirect=${encodeURIComponent(currentPath)}`);
                  }}
                >
                  点击登录
                </Button>
              </Typography>
            </Box>
          )}
        </Alert>
        {/* ISS-004: 移除"重试"和"返回首页"按钮,保持错误页面简洁 */}
      </Box>
    );
  }
  // ========== CUSTOM END ==========

  return (
    <>
      <Navbar projects={projects} currentProject={projectId} />
      <main>{children}</main>
    </>
  );
}
