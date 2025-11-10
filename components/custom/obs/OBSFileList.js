/**
 * OBS文件列表组件
 * 显示OBS文件列表,支持选择(单选/全选)
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-003 OBS文件浏览器组件
 */

'use client';

import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Checkbox,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useTranslation } from 'react-i18next';

export default function OBSFileList({ files, selectedFiles, onSelectionChange }) {
  const { t } = useTranslation();

  // 切换单个文件选择
  const handleToggle = (file) => {
    const isSelected = selectedFiles.some(f => f.key === file.key);
    if (isSelected) {
      onSelectionChange(selectedFiles.filter(f => f.key !== file.key));
    } else {
      onSelectionChange([...selectedFiles, file]);
    }
  };

  // 切换全选
  const handleToggleAll = () => {
    if (selectedFiles.length === files.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange([...files]);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 提取文件名(去掉路径前缀)
  const getFileName = (key) => {
    const parts = key.split('/');
    return parts[parts.length - 1] || key;
  };

  if (files.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          color: 'text.secondary',
        }}
      >
        <InsertDriveFileIcon sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="body1">
          {t('obsUpload.noFiles', { defaultValue: '暂无文件' })}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 全选控制 */}
      <ListItem
        sx={{
          bgcolor: 'action.hover',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Checkbox
          checked={files.length > 0 && selectedFiles.length === files.length}
          indeterminate={selectedFiles.length > 0 && selectedFiles.length < files.length}
          onChange={handleToggleAll}
        />
        <ListItemText
          primary={
            <Typography variant="subtitle2">
              {t('obsUpload.selectAll', { defaultValue: '全选' })} ({files.length} {t('obsUpload.files', { defaultValue: '个文件' })})
            </Typography>
          }
        />
      </ListItem>

      {/* 文件列表 */}
      <List sx={{ maxHeight: 400, overflow: 'auto' }}>
        {files.map((file, index) => {
          const isSelected = selectedFiles.some(f => f.key === file.key);

          return (
            <React.Fragment key={file.key}>
              <ListItemButton
                onClick={() => handleToggle(file)}
                selected={isSelected}
                sx={{
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Checkbox
                  checked={isSelected}
                  tabIndex={-1}
                  disableRipple
                />
                <InsertDriveFileIcon
                  sx={{
                    mr: 2,
                    color: 'primary.main',
                    fontSize: 24,
                  }}
                />
                <ListItemText
                  primary={
                    <Typography variant="body1" noWrap>
                      {getFileName(file.key)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(file.size)} · {formatTime(file.lastModified)}
                    </Typography>
                  }
                />
              </ListItemButton>
              {index < files.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>

      {/* 选中数量提示 */}
      {selectedFiles.length > 0 && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: 'primary.light',
            color: 'primary.contrastText',
            borderRadius: 1,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2">
            {t('obsUpload.selectedCount', {
              defaultValue: '已选择 {{count}} 个文件',
              count: selectedFiles.length,
            })}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
