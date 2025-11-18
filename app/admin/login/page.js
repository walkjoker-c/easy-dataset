// ========== CUSTOM START ==========
// CUSTOM: 管理员登录页面UI - REQ-004
// 定制说明: REQ-004 Keycloak鉴权功能 - 管理员登录页面
// 修改日期: 2025-11-18
// 功能: 管理员密码登录UI,登录成功跳转到项目列表页
// ========== CUSTOM END ==========

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  Avatar,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * 处理登录提交
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    // 验证密码不为空
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // 登录成功,刷新路由缓存并跳转到项目列表页
        // 使用 router.refresh() + router.push() 确保服务端组件能获取最新Session
        router.refresh();
        // 延迟一下确保刷新完成
        setTimeout(() => {
          router.push('/');
        }, 100);
      } else {
        const data = await response.json();
        setError(data.error || '登录失败,请重试');
      }
    } catch (err) {
      console.error('[Admin Login] Login error:', err);
      setError('登录失败,请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          <Typography component="h1" variant="h5">
            管理员登录
          </Typography>

          <Box component="form" onSubmit={handleLogin} sx={{ mt: 3, width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="管理员密码"
              type="password"
              id="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              提示: 管理员登录后可访问所有项目
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
