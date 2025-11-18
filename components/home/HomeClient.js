// ========== CUSTOM START ==========
// CUSTOM: 项目列表页客户端组件 - REQ-004 补充需求
// 定制说明: 从app/page.js拆分出的客户端逻辑,添加登出按钮
// 修改日期: 2025-11-18
// 功能: 项目列表展示、管理员登出按钮
// ========== CUSTOM END ==========

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Box, Typography, CircularProgress, Stack, Button, Chip } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/home/HeroSection';
import StatsCard from '@/components/home/StatsCard';
import ProjectList from '@/components/home/ProjectList';
import CreateProjectDialog from '@/components/home/CreateProjectDialog';
import MigrationDialog from '@/components/home/MigrationDialog';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function HomeClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [unmigratedProjects, setUnmigratedProjects] = useState([]);
  const [migrationDialogOpen, setMigrationDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        // 获取用户创建的项目详情
        const response = await fetch(`/api/projects`);

        if (!response.ok) {
          throw new Error(t('projects.fetchFailed'));
        }

        const data = await response.json();
        setProjects(data);

        // 检查是否有未迁移的项目
        await checkUnmigratedProjects();
      } catch (error) {
        console.error(t('projects.fetchError'), String(error));
        setError(String(error));
      } finally {
        setLoading(false);
      }
    }

    // 检查未迁移的项目
    async function checkUnmigratedProjects() {
      try {
        const response = await fetch('/api/projects/unmigrated');

        if (!response.ok) {
          console.error('检查未迁移项目失败');
          return;
        }

        const { success, data } = await response.json();

        if (success && Array.isArray(data) && data.length > 0) {
          setUnmigratedProjects(data);
          setMigrationDialogOpen(true);
        }
      } catch (error) {
        console.error('检查未迁移项目出错', error);
      }
    }

    fetchProjects();
  }, []);

  // ========== CUSTOM: 登出功能 - REQ-004 补充需求 ==========
  /**
   * 处理管理员登出
   */
  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      const response = await fetch('/api/admin/logout', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('[Home Client] Logout successful, redirecting to login page');
        // 登出成功,刷新页面(服务端会重定向到登录页)
        router.refresh();
      } else {
        console.error('[Home Client] Logout failed:', await response.text());
        alert('登出失败,请重试');
      }
    } catch (error) {
      console.error('[Home Client] Logout error:', error);
      alert('登出失败,请检查网络连接');
    } finally {
      setLoggingOut(false);
    }
  };
  // ========== CUSTOM END ==========

  return (
    <main style={{ overflow: 'hidden', position: 'relative' }}>
      <Navbar projects={projects} />

      <HeroSection onCreateProject={() => setCreateDialogOpen(true)} />

      {/* ========== CUSTOM: 管理员状态栏和登出按钮 - REQ-004 补充需求 ========== */}
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 2,
            p: 2,
            bgcolor: 'success.light',
            borderRadius: 1,
          }}
        >
          <Chip
            icon={<AdminPanelSettingsIcon />}
            label="管理员已登录"
            color="success"
            size="small"
          />
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut ? '登出中...' : '登出'}
          </Button>
        </Box>
      </Container>
      {/* ========== CUSTOM END ========== */}

      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 6, md: 8 },
          mb: { xs: 4, md: 6 },
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* <StatsCard projects={projects} /> */}

        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              mt: 6,
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2
            }}
          >
            <CircularProgress size={40} thickness={4} />
            <Typography variant="body2" color="text.secondary">
              {t('projects.loading')}
            </Typography>
          </Box>
        )}

        {error && !loading && (
          <Box
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'error.light',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ErrorOutlineIcon color="error" />
              <Typography color="error.dark">
                {t('projects.fetchFailed')}: {error}
              </Typography>
            </Stack>
          </Box>
        )}

        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ProjectList projects={projects} onCreateProject={() => setCreateDialogOpen(true)} />
          </motion.div>
        )}
      </Container>

      <CreateProjectDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} />

      {/* 项目迁移对话框 */}
      <MigrationDialog
        open={migrationDialogOpen}
        onClose={() => setMigrationDialogOpen(false)}
        projectIds={unmigratedProjects}
      />
    </main>
  );
}
