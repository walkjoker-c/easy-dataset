'use client';

import {
  Box,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { alpha } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import React, { useRef, useState } from 'react';
// CUSTOM: REQ-003 - 添加OBS文件上传支持
import UploadSourceSelectDialog from '@/components/custom/obs/UploadSourceSelectDialog';
// CUSTOM: REQ-003 - TASK-003 - 添加OBS文件浏览器
import OBSBrowserDialog from '@/components/custom/obs/OBSBrowserDialog';
// CUSTOM: REQ-003 - TASK-004 - 添加OBS文件下载功能
import { downloadAndConvertFiles } from '@/lib/custom/obs/file-import';
import { toast } from 'sonner';

export default function UploadArea({
  theme,
  files,
  uploading,
  uploadedFiles,
  onFileSelect,
  onRemoveFile,
  onUpload,
  selectedModel,
  // CUSTOM: REQ-003 - TASK-003 - 添加project参数
  project
}) {
  const { t } = useTranslation();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  // CUSTOM: REQ-003 - 添加上传源选择对话框状态
  const [sourceDialogOpen, setSourceDialogOpen] = useState(false);
  // CUSTOM: REQ-003 - TASK-003 - 添加OBS文件浏览器对话框状态
  const [obsBrowserOpen, setObsBrowserOpen] = useState(false);

  // 拖拽进入
  const handleDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };
  // 拖拽离开
  const handleDragLeave = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  // 拖拽释放
  const handleDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (!selectedModel?.id || uploading) return;
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // 构造一个模拟的 event 以复用 onFileSelect
      const event = { target: { files } };
      onFileSelect(event);
    }
  };

  // CUSTOM: REQ-003 - 点击选择文件按钮,弹出上传源选择对话框
  const handleSelectButtonClick = () => {
    setSourceDialogOpen(true);
  };

  // CUSTOM: REQ-003 - 选择本地文件
  const handleSelectLocal = () => {
    setSourceDialogOpen(false);
    // 触发原有的文件选择器
    inputRef.current?.click();
  };

  // CUSTOM: REQ-003 - 选择OBS文件
  const handleSelectOBS = () => {
    setSourceDialogOpen(false);
    // CUSTOM: REQ-003 - TASK-003 - 打开OBS文件浏览器
    setObsBrowserOpen(true);
  };

  // CUSTOM: REQ-003 - TASK-003 - 添加下载状态
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });

  // CUSTOM: REQ-003 - TASK-004 - 处理OBS文件下载和导入
  const handleOBSFilesConfirm = async (obsData) => {
    console.log('[UploadArea] 用户从OBS选择了文件:', obsData);

    const { files: selectedFiles, env, agentType, folder } = obsData;

    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    setDownloading(true);
    setDownloadProgress({ current: 0, total: selectedFiles.length });

    try {
      toast.info(t('textSplit.obsDownloadStarted', {
        defaultValue: `开始下载 ${selectedFiles.length} 个文件...`,
        count: selectedFiles.length
      }));

      // CUSTOM: REQ-003 - TASK-005 - 传递OBS元信息用于后续文件移动
      // 批量下载并转换为File对象
      const result = await downloadAndConvertFiles(
        selectedFiles,
        (current, total) => {
          setDownloadProgress({ current, total });
        },
        { env, agentType, folder }
      );

      if (result.failures.length > 0) {
        toast.error(t('textSplit.obsDownloadPartialFailed', {
          defaultValue: `${result.failures.length} 个文件下载失败`,
          count: result.failures.length
        }));
        console.error('[UploadArea] 下载失败的文件:', result.failures);
      }

      if (result.successes.length > 0) {
        // 模拟文件选择事件,将File对象传递给现有的处理流程
        const event = {
          target: {
            files: result.files
          }
        };

        onFileSelect(event);

        toast.success(t('textSplit.obsDownloadSuccess', {
          defaultValue: `成功导入 ${result.successes.length} 个文件`,
          count: result.successes.length
        }));

        // CUSTOM: REQ-003 - TASK-005 - 文件导入成功后,自动移动OBS文件从pending到completed
        // 过滤出从OBS导入且在pending目录的文件
        const filesToMove = result.files
          .filter(file => file._fromOBS && file._obsKey && file._obsFolder === 'pending')
          .map(file => ({
            fileName: file.name,
            obsKey: file._obsKey
          }));

        if (filesToMove.length > 0) {
          console.log(`[UploadArea] 准备移动 ${filesToMove.length} 个文件从pending到completed`);

          // 异步调用移动API,不阻塞主流程
          fetch('/api/obs/move', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: filesToMove })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.summary.succeeded > 0) {
              console.log(`[UploadArea] 成功移动 ${data.summary.succeeded} 个文件到completed`);
              toast.info(t('textSplit.obsFileMoved', {
                defaultValue: `已将 ${data.summary.succeeded} 个文件移动到completed目录`,
                count: data.summary.succeeded
              }));
            }
            if (data.summary.failed > 0) {
              console.warn(`[UploadArea] ${data.summary.failed} 个文件移动失败`);
            }
          })
          .catch(error => {
            console.error('[UploadArea] 移动文件失败:', error);
            // 移动失败不影响主流程,仅记录日志
          });
        }
      }
    } catch (error) {
      console.error('[UploadArea] OBS文件下载失败:', error);
      toast.error(t('textSplit.obsDownloadFailed', {
        defaultValue: '文件下载失败',
        error: error.message
      }));
    } finally {
      setDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        height: '100%',
        border: `2px dashed ${dragActive ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
        borderRadius: 2,
        bgcolor: dragActive ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.05),
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderColor: alpha(theme.palette.primary.main, 0.3)
        },
        cursor: uploading || !selectedModel?.id ? 'not-allowed' : 'pointer',
        position: 'relative'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {dragActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: alpha(theme.palette.primary.main, 0.3),
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            borderRadius: 2,
            border: `3px solid ${theme.palette.primary.main}`,
            backdropFilter: 'blur(2px)'
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              p: 3,
              borderRadius: 1,
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              border: `1px solid ${theme.palette.primary.main}`
            }}
          >
            <UploadFileIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              {t('textSplit.dragToUpload', { defaultValue: '拖拽文件到此处上传' })}
            </Typography>
          </Box>
        </Box>
      )}
      <Typography variant="subtitle1" gutterBottom>
        {t('textSplit.uploadNewDocument')}
      </Typography>

      <Tooltip
        title={!selectedModel?.id ? t('textSplit.selectModelFirst', { defaultValue: '请先在右上角选择模型' }) : ''}
      >
        <span>
          {/* CUSTOM: REQ-003 - 修改按钮点击行为,弹出上传源选择对话框 */}
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            sx={{ mb: 2, mt: 2 }}
            disabled={!selectedModel?.id || uploading}
            onClick={handleSelectButtonClick}
          >
            {t('textSplit.selectFile')}
          </Button>

          {/* CUSTOM: REQ-003 - 保留原有的hidden input用于本地文件选择 */}
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".md,.txt,.docx,.pdf,.epub"
            multiple
            onChange={onFileSelect}
            disabled={!selectedModel?.id || uploading}
          />
        </span>
      </Tooltip>

      <Typography variant="body2" color="textSecondary">
        {uploadedFiles.total > 0 ? t('textSplit.mutilFileMessage') : t('textSplit.supportedFormats')}
      </Typography>

      {files.length > 0 && (
        <Box sx={{ mt: 3, width: '100%' }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('textSplit.selectedFiles', { count: files.length })}
          </Typography>

          <List sx={{ bgcolor: theme.palette.background.paper, borderRadius: 1, maxHeight: '200px', overflow: 'auto' }}>
            {files.map((file, index) => (
              <Box key={index}>
                <ListItem
                  secondaryAction={
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => onRemoveFile(index)}
                      disabled={uploading}
                    >
                      {t('common.delete')}
                    </Button>
                  }
                >
                  <ListItemText primary={file.name} secondary={`${(file.size / 1024).toFixed(2)} KB`} />
                </ListItem>
                {index < files.length - 1 && <Divider />}
              </Box>
            ))}
          </List>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Tooltip
              title={
                !selectedModel?.id ? t('textSplit.selectModelFirst', { defaultValue: '请先在右上角选择模型' }) : ''
              }
            >
              <span>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={onUpload}
                  disabled={uploading || !selectedModel?.id}
                  sx={{ minWidth: 120 }}
                >
                  {uploading ? <CircularProgress size={24} /> : t('textSplit.uploadAndProcess')}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* CUSTOM: REQ-003 - 添加上传源选择对话框 */}
      <UploadSourceSelectDialog
        open={sourceDialogOpen}
        onClose={() => setSourceDialogOpen(false)}
        onSelectLocal={handleSelectLocal}
        onSelectOBS={handleSelectOBS}
      />

      {/* CUSTOM: REQ-003 - TASK-003 - OBS文件浏览器对话框 */}
      <OBSBrowserDialog
        open={obsBrowserOpen}
        onClose={() => setObsBrowserOpen(false)}
        project={project}
        onConfirm={handleOBSFilesConfirm}
      />

      {/* CUSTOM: REQ-003 - TASK-004 - 下载进度提示 */}
      {downloading && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            px: 3,
            py: 2,
            borderRadius: 2,
            boxShadow: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 1300,
          }}
        >
          <CircularProgress size={24} color="inherit" />
          <Typography variant="body2">
            {t('textSplit.obsDownloading', {
              defaultValue: `正在下载文件: ${downloadProgress.current}/${downloadProgress.total}`,
              current: downloadProgress.current,
              total: downloadProgress.total
            })}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
