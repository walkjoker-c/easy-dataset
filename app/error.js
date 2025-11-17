// ========== CUSTOM START ==========
// 定制说明: REQ-004 Keycloak鉴权功能 - 全局错误处理边界
// 修改日期: 2025-11-18
// 功能: 捕获React组件渲染错误,显示友好的错误页面
// 注意: 此组件仅捕获React组件错误,不捕获fetch API错误 (需使用errorHandler.js)
// ========== CUSTOM END ==========

'use client';

import { useEffect } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * 全局错误边界组件 (Next.js App Router)
 * @param {Object} props
 * @param {Error} props.error - 捕获的错误对象
 * @param {Function} props.reset - 重置错误状态的函数
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // 记录错误到监控系统 (可选,后续可集成如Sentry等)
    console.error('[Global Error Boundary] Caught error:', error);
  }, [error]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '60vh',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            textAlign: 'center',
            width: '100%'
          }}
        >
          <ErrorOutlineIcon color="error" sx={{ fontSize: 80, mb: 2 }} />

          <Typography variant="h4" gutterBottom fontWeight="600">
            出错了
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 2, mb: 3 }}>
            {error?.message || '页面加载失败,请稍后重试'}
          </Typography>

          {/* 错误详情 (开发环境显示,生产环境隐藏) */}
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <Box
              sx={{
                mt: 2,
                mb: 3,
                p: 2,
                backgroundColor: 'grey.100',
                borderRadius: 1,
                textAlign: 'left',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {error.stack}
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={reset}>
              重新加载
            </Button>

            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => (window.location.href = '/')}
            >
              返回首页
            </Button>
          </Box>
        </Paper>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 3 }}>
          如果问题持续存在,请联系技术支持
        </Typography>
      </Box>
    </Container>
  );
}
