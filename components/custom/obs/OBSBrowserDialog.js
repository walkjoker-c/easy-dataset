/**
 * OBS文件浏览器对话框
 * 支持两种模式:
 * 1. 有externalId: 自动显示环境选择(dev/test/prod)
 * 2. 无externalId: 显示手动路径输入
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-003 OBS文件浏览器组件
 *
 * 修改历史:
 * - 2025-11-11: 添加OBS_DEFAULT_ENV环境变量支持（控制默认环境选择行为）
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

export default function OBSBrowserDialog({ open, onClose, project, obsDefaultEnv, onConfirm }) {
  const { t } = useTranslation();

  // CUSTOM: REQ-003 - 2025-11-11 - 支持运行时环境变量配置
  // 从 Server Component 传递的 prop 读取环境配置（支持运行时修改）
  // 支持dev/test/prod三个值
  const defaultEnv = obsDefaultEnv || '';
  const isValidEnv = ['dev', 'test', 'prod'].includes(defaultEnv);

  // 调试日志
  console.log('[OBSBrowserDialog] Rendered with project:', project);
  console.log('[OBSBrowserDialog] project.externalId:', project?.externalId);
  console.log('[OBSBrowserDialog] obsDefaultEnv (runtime):', defaultEnv, 'isValid:', isValidEnv);

  // 状态管理
  // CUSTOM: REQ-003 - 2025-11-11 - 如果有有效的环境变量配置，使用它作为默认值
  const [env, setEnv] = useState(isValidEnv ? defaultEnv : 'test'); // dev/test/prod
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
    if (!agentType) {
      setError(t('obsUpload.pleaseInputAgentType', { defaultValue: '请输入AgentType' }));
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedFiles([]); // 清空选择

    try {
      // 如果有externalId，根据环境变量决定拉取策略
      if (project?.externalId) {
        // ========== CUSTOM START: REQ-003 - 2025-11-11 ==========
        // 功能: 支持OBS_DEFAULT_ENV环境变量控制单环境拉取
        // 如果配置了有效的默认环境，只从该环境拉取
        if (isValidEnv) {
          console.log(`[OBSBrowser] 使用环境变量配置，只从 ${defaultEnv} 环境获取文件`);
          const prefix = `env=${defaultEnv}/messageType=conversation_data/agentType=${agentType}/${currentFolder}/`;

          const response = await fetch('/api/obs/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prefix }),
          });

          const data = await response.json();

          if (data.success) {
            // 为文件添加环境标记
            const filesWithEnv = data.files.map(file => ({
              ...file,
              env: defaultEnv,
            }));
            setFiles(filesWithEnv);
            console.log(`[OBSBrowser] 从 ${defaultEnv} 环境获取到 ${data.files.length} 个文件`);

            if (filesWithEnv.length === 0) {
              setError(t('obsUpload.noFilesFound', { defaultValue: '未找到任何文件' }));
            }
          } else {
            setError(data.error || t('obsUpload.fetchFailed', { defaultValue: '获取文件列表失败' }));
          }
        }
        // ========== CUSTOM END: REQ-003 - 2025-11-11 ==========
        else {
          // 没有配置环境变量，从三个环境都拉取（原有逻辑）
          console.log(`[OBSBrowser] 从所有环境获取文件列表`);

          const envs = ['dev', 'test', 'prod'];
          const allFiles = [];

          for (const envName of envs) {
            const prefix = `env=${envName}/messageType=conversation_data/agentType=${agentType}/${currentFolder}/`;
            console.log(`[OBSBrowser] 获取文件列表: ${prefix}`);

            try {
              const response = await fetch('/api/obs/list', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prefix }),
              });

              const data = await response.json();

              if (data.success && data.files.length > 0) {
                // 为每个文件添加环境标记
                const filesWithEnv = data.files.map(file => ({
                  ...file,
                  env: envName,
                }));
                allFiles.push(...filesWithEnv);
                console.log(`[OBSBrowser] 从 ${envName} 环境获取到 ${data.files.length} 个文件`);
              }
            } catch (err) {
              console.warn(`[OBSBrowser] 从 ${envName} 环境获取文件失败:`, err);
              // 继续获取下一个环境
            }
          }

          setFiles(allFiles);
          console.log(`[OBSBrowser] 总共获取 ${allFiles.length} 个文件`);

          if (allFiles.length === 0) {
            setError(t('obsUpload.noFilesFound', { defaultValue: '未找到任何文件' }));
          }
        }
      } else {
        // 无externalId，只从选定的环境拉取
        const prefix = buildPath();
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
            // ========== CUSTOM START: REQ-003 - 2025-11-11 ==========
            // 功能: 有externalId时根据环境变量决定拉取策略
            // 有externalId: 自动使用externalId作为agentType
            // - 如果配置了OBS_DEFAULT_ENV环境变量，只从该环境拉取
            // - 否则从dev/test/prod三个环境拉取文件
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>AgentType:</strong> {agentType}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isValidEnv
                  ? `使用环境变量配置，从 ${defaultEnv} 环境拉取`
                  : '自动从项目中获取，将从所有环境拉取数据'
                }
              </Typography>
            </Alert>
            // ========== CUSTOM END: REQ-003 - 2025-11-11 ==========
          ) : (
            // ========== CUSTOM START: REQ-003 - 2025-11-11 ==========
            // 功能: 无externalId时根据环境变量决定UI显示
            // 无externalId: 根据是否配置环境变量决定UI
            <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
              {isValidEnv ? (
                // 配置了环境变量：只显示提示信息，不显示选择框
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>{t('obsUpload.environment', { defaultValue: '环境' })}:</strong>{' '}
                    {defaultEnv === 'dev' && 'Development (开发环境)'}
                    {defaultEnv === 'test' && 'Test (测试环境)'}
                    {defaultEnv === 'prod' && 'Production (生产环境)'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    使用环境变量配置
                  </Typography>
                </Alert>
              ) : (
                // 未配置环境变量：显示环境选择框
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
              )}

              <TextField
                fullWidth
                label={t('obsUpload.agentType', { defaultValue: 'AgentType' })}
                value={agentType}
                onChange={(e) => setAgentType(e.target.value)}
                placeholder={t('obsUpload.agentTypePlaceholder', { defaultValue: '请输入agentType' })}
                helperText={t('obsUpload.agentTypeHelp', { defaultValue: '请输入agentType，将构建路径' })}
              />
            </Box>
            // ========== CUSTOM END: REQ-003 - 2025-11-11 ==========
          )}

          {/* 显示当前路径 - 在无externalId且有agentType时显示 */}
          {agentType && !project?.externalId && (
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
          onChange={(_, v) => setCurrentFolder(v)}
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
