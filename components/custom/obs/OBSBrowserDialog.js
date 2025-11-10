/**
 * OBS文件浏览器对话框
 * 支持两种模式:
 * 1. 有externalId: 自动显示环境选择(dev/test/prod)
 * 2. 无externalId: 显示手动路径输入
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-003 OBS文件浏览器组件
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert,
  Typography,
} from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import { useTranslation } from 'react-i18next';
import OBSFileList from './OBSFileList';

export default function OBSBrowserDialog({ open, onClose, project, onConfirm }) {
  const { t } = useTranslation();

  // 状态管理
  const [env, setEnv] = useState('test'); // dev/test/prod
  const [agentType, setAgentType] = useState(project?.externalId || '');
  const [currentFolder, setCurrentFolder] = useState('pending'); // pending | completed
  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 构建OBS路径
  const buildPath = () => {
    if (!agentType) return null;
    return `env=${env}/messageType=conversation_data/agentType=${agentType}/${currentFolder}/`;
  };

  // 获取文件列表
  const fetchFiles = async () => {
    const prefix = buildPath();
    if (!prefix) {
      setError(t('obsUpload.pleaseInputAgentType', { defaultValue: '请输入AgentType' }));
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedFiles([]); // 清空选择

    try {
      console.log(`[OBSBrowser] 获取文件列表: ${prefix}`);

      const response = await fetch('/api/obs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prefix }),
      });

      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        console.log(`[OBSBrowser] 成功获取 ${data.files.length} 个文件`);
      } else {
        setError(data.error || t('obsUpload.fetchFailed', { defaultValue: '获取文件列表失败' }));
      }
    } catch (err) {
      console.error('[OBSBrowser] 获取文件列表失败:', err);
      setError(err.message || t('obsUpload.networkError', { defaultValue: '网络错误' }));
    } finally {
      setLoading(false);
    }
  };

  // 环境、agentType或文件夹变化时重新加载
  useEffect(() => {
    if (open && agentType) {
      fetchFiles();
    }
  }, [open, env, agentType, currentFolder]);

  // 初始化agentType
  useEffect(() => {
    if (open && project?.externalId) {
      setAgentType(project.externalId);
    }
  }, [open, project]);

  // 确认选择
  const handleConfirm = () => {
    if (selectedFiles.length === 0) {
      return;
    }

    console.log(`[OBSBrowser] 用户选择了 ${selectedFiles.length} 个文件`);

    // 传递选中的文件信息和元数据
    onConfirm({
      files: selectedFiles,
      env,
      agentType,
      folder: currentFolder,
    });

    onClose();
  };

  // 关闭对话框
  const handleClose = () => {
    setSelectedFiles([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CloudIcon color="info" />
        {t('obsUpload.selectOBSFile', { defaultValue: '选择OBS文件' })}
      </DialogTitle>

      <DialogContent dividers>
        {/* 路径配置区域 */}
        <Box sx={{ mb: 3 }}>
          {project?.externalId ? (
            // 有externalId: 显示环境选择
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth>
                <InputLabel>{t('obsUpload.environment', { defaultValue: '环境' })}</InputLabel>
                <Select value={env} onChange={(e) => setEnv(e.target.value)} label={t('obsUpload.environment')}>
                  <MenuItem value="dev">
                    <Box>
                      <Typography variant="body1">Development</Typography>
                      <Typography variant="caption" color="text.secondary">开发环境</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="test">
                    <Box>
                      <Typography variant="body1">Test</Typography>
                      <Typography variant="caption" color="text.secondary">测试环境</Typography>
                    </Box>
                  </MenuItem>
                  <MenuItem value="prod">
                    <Box>
                      <Typography variant="body1">Production</Typography>
                      <Typography variant="caption" color="text.secondary">生产环境</Typography>
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label={t('obsUpload.agentType', { defaultValue: 'AgentType' })}
                value={agentType}
                disabled
                helperText={t('obsUpload.autoFromProject', { defaultValue: '自动从项目获取' })}
              />
            </Box>
          ) : (
            // 无externalId: 显示手动输入
            <TextField
              fullWidth
              label={t('obsUpload.agentType', { defaultValue: 'AgentType' })}
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
              placeholder={t('obsUpload.agentTypePlaceholder', { defaultValue: '请输入agentType' })}
              helperText={t('obsUpload.agentTypeHelp', { defaultValue: '输入后将构建路径: env=test/messageType=conversation_data/agentType={value}/pending/' })}
            />
          )}

          {/* 显示当前路径 */}
          {agentType && (
            <Box sx={{ mt: 2, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {t('obsUpload.currentPath', { defaultValue: '当前路径' })}: {buildPath()}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Pending/Completed切换 */}
        <Tabs
          value={currentFolder}
          onChange={(e, v) => setCurrentFolder(v)}
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab
            label={t('obsUpload.pending', { defaultValue: 'Pending (待处理)' })}
            value="pending"
          />
          <Tab
            label={t('obsUpload.completed', { defaultValue: 'Completed (已完成)' })}
            value="completed"
          />
        </Tabs>

        {/* 文件列表 */}
        <Box sx={{ minHeight: 300 }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!loading && !error && (
            <OBSFileList
              files={files}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} color="inherit">
          {t('common.cancel', { defaultValue: '取消' })}
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={selectedFiles.length === 0}
        >
          {t('common.confirm', { defaultValue: '确认' })} ({selectedFiles.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
