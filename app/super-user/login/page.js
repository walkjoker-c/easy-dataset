// ========== CUSTOM START ==========
// 定制说明: ISS-006 SuperUser审核员角色 - 登录页面
// 功能说明: super_user登录界面,支持登录后重定向
// 访问路径: /super-user/login?redirect=/projects/xxx
// 修改日期: 2025-11-18
// ========== CUSTOM END ==========

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Paper,
  Container
} from '@mui/material';

export default function SuperUserLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/super-user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok) {
        // 登录成功,重定向到原页面
        console.log('[Super User Login Page] Login successful, redirecting to:', redirectUrl);
        router.push(redirectUrl);
        router.refresh(); // 刷新服务端组件
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      console.error('[Super User Login Page] Error:', err);
      setError('登录请求失败,请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 3 }}>
            审核员登录
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              type="password"
              label="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoFocus
              disabled={loading}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
}
