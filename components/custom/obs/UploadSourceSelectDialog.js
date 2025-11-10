/**
 * 上传源选择对话框
 * 用户选择从本地或OBS上传文件
 *
 * 创建日期: 2025-11-10
 * 所属需求: REQ-003 OBS文件上传集成
 * 所属任务: TASK-002 上传源选择UI组件
 */

'use client';

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
} from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CloudIcon from '@mui/icons-material/Cloud';
import { useTranslation } from 'react-i18next';

export default function UploadSourceSelectDialog({ open, onClose, onSelectLocal, onSelectOBS }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('obsUpload.selectSource', { defaultValue: '选择文件来源' })}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          {/* 本地文件选项 */}
          <Card sx={{ flex: 1 }} elevation={2}>
            <CardActionArea
              onClick={onSelectLocal}
              sx={{
                height: '100%',
                '&:hover': {
                  '& .icon': {
                    transform: 'scale(1.1)',
                  }
                }
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180
                }}
              >
                <FolderOpenIcon
                  className="icon"
                  sx={{
                    fontSize: 56,
                    color: 'primary.main',
                    mb: 2,
                    transition: 'transform 0.2s ease'
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  {t('obsUpload.localFile', { defaultValue: '本地文件' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('obsUpload.localFileDesc', { defaultValue: '从本地计算机选择文件' })}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          {/* OBS文件选项 */}
          <Card sx={{ flex: 1 }} elevation={2}>
            <CardActionArea
              onClick={onSelectOBS}
              sx={{
                height: '100%',
                '&:hover': {
                  '& .icon': {
                    transform: 'scale(1.1)',
                  }
                }
              }}
            >
              <CardContent
                sx={{
                  textAlign: 'center',
                  py: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180
                }}
              >
                <CloudIcon
                  className="icon"
                  sx={{
                    fontSize: 56,
                    color: 'info.main',
                    mb: 2,
                    transition: 'transform 0.2s ease'
                  }}
                />
                <Typography variant="h6" sx={{ fontWeight: 'medium', mb: 1 }}>
                  {t('obsUpload.obsFile', { defaultValue: 'OBS文件' })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('obsUpload.obsFileDesc', { defaultValue: '从OBS对象存储选择文件' })}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel', { defaultValue: '取消' })}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
