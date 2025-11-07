'use client';

import { Box, Typography, Chip, Tooltip, alpha, CircularProgress, Select, MenuItem, FormControl, IconButton } from '@mui/material';
import { Edit as EditIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';
import { useState, useEffect } from 'react';

// CUSTOM: 标签编辑功能 - 增强原组件支持标签编辑 (迁移自1.4.0)
// 功能说明: 允许用户在数据集详情页直接编辑questionLabel字段
// 业务场景: 用户需要批量修正或更新数据集的分类标签
/**
 * 数据集元数据展示组件
 * CUSTOM: 增加了标签编辑功能,支持从下拉列表选择标签并保存
 */
export default function DatasetMetadata({ currentDataset, onViewChunk, onLabelChange }) {
  const { t } = useTranslation();
  const theme = useTheme();

  // CUSTOM: 标签编辑状态管理 (迁移自1.4.0)
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelValue, setLabelValue] = useState(currentDataset?.questionLabel || '');
  const [availableLabels, setAvailableLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);

  // CUSTOM: 获取可用标签列表 (迁移自1.4.0)
  const fetchAvailableLabels = async () => {
    try {
      setLoadingLabels(true);
      const response = await fetch(`/api/projects/${currentDataset.projectId}/tags`);
      if (response.ok) {
        const data = await response.json();

        // 提取所有标签名称，包括嵌套的标签
        const extractLabels = (tags) => {
          let labels = [];
          if (!tags || !Array.isArray(tags)) return labels;

          tags.forEach(tag => {
            if (tag && tag.label) {
              labels.push(tag.label);
              // 递归处理子标签
              if (tag.child && Array.isArray(tag.child) && tag.child.length > 0) {
                labels = labels.concat(extractLabels(tag.child));
              }
            }
          });
          return labels;
        };
        const allLabels = extractLabels(data.tags || []);

        // 去重并排序
        const uniqueLabels = [...new Set(allLabels)].sort();
        setAvailableLabels(uniqueLabels);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setLoadingLabels(false);
    }
  };

  // CUSTOM: 当组件挂载时获取标签列表 (迁移自1.4.0)
  useEffect(() => {
    if (currentDataset?.projectId) {
      fetchAvailableLabels();
    }
  }, [currentDataset?.projectId]);

  // CUSTOM: 当数据集变化时更新标签值 (迁移自1.4.0)
  useEffect(() => {
    setLabelValue(currentDataset?.questionLabel || '');
  }, [currentDataset?.questionLabel]);

  // CUSTOM: 处理标签编辑 (迁移自1.4.0)
  const handleLabelEdit = () => {
    setEditingLabel(true);
  };

  // CUSTOM: 处理标签保存 (迁移自1.4.0)
  const handleLabelSave = async () => {
    try {
      if (onLabelChange) {
        await onLabelChange(labelValue);
      }
      setEditingLabel(false);
    } catch (error) {
      console.error('保存标签失败:', error);
    }
  };

  // CUSTOM: 处理标签取消 (迁移自1.4.0)
  const handleLabelCancel = () => {
    setLabelValue(currentDataset?.questionLabel || '');
    setEditingLabel(false);
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1 }}>
        {t('datasets.metadata')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Chip label={`${t('datasets.model')}: ${currentDataset.model}`} variant="outlined" />

        {/* CUSTOM: 可编辑的标签 (迁移自1.4.0) */}
        {editingLabel ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                displayEmpty
                disabled={loadingLabels}
              >
                <MenuItem value="">
                  <em>选择标签</em>
                </MenuItem>
                {availableLabels.map((label) => (
                  <MenuItem key={label} value={label}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <IconButton size="small" onClick={handleLabelSave} color="primary">
              <CheckIcon />
            </IconButton>
            <IconButton size="small" onClick={handleLabelCancel} color="secondary">
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${t('common.label')}: ${currentDataset.questionLabel || '无标签'}`}
              color={currentDataset.questionLabel ? "primary" : "default"}
              variant="outlined"
              onClick={handleLabelEdit}
              sx={{ cursor: 'pointer' }}
            />
            <IconButton size="small" onClick={handleLabelEdit} color="primary">
              <EditIcon fontSize="small" />
            </IconButton>
          </Box>
        )}

        <Chip
          label={`${t('datasets.createdAt')}: ${new Date(currentDataset.createAt).toLocaleString('zh-CN')}`}
          variant="outlined"
        />
        <Tooltip title={t('textSplit.viewChunk')}>
          <Chip
            label={`${t('datasets.chunkId')}: ${currentDataset.chunkName}`}
            variant="outlined"
            color="info"
            onClick={async () => {
              try {
                // 使用新API接口获取文本块内容
                const response = await fetch(
                  `/api/projects/${currentDataset.projectId}/chunks/name?chunkName=${encodeURIComponent(currentDataset.chunkName)}`
                );

                if (!response.ok) {
                  throw new Error(`获取文本块失败: ${response.statusText}`);
                }

                const chunkData = await response.json();

                // 调用父组件的方法显示文本块
                onViewChunk({
                  name: currentDataset.chunkName,
                  content: chunkData.content
                });
              } catch (error) {
                console.error('获取文本块内容失败:', error);
                // 即使API请求失败，也尝试调用查看方法
                onViewChunk({
                  name: currentDataset.chunkName,
                  content: '内容加载失败，请重试'
                });
              }
            }}
            sx={{ cursor: 'pointer' }}
          />
        </Tooltip>
        {currentDataset.confirmed && (
          <Chip
            label={t('datasets.confirmed')}
            sx={{
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              color: theme.palette.success.dark,
              fontWeight: 'medium'
            }}
          />
        )}
      </Box>
    </Box>
  );
}
