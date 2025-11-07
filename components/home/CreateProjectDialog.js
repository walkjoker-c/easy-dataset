'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  useTheme,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function CreateProjectDialog({ open, onClose }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    reuseConfigFrom: ''
  });
  const [error, setError] = useState(null);

  // 获取项目列表
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (error) {
        console.error('获取项目列表失败:', error);
      }
    };

    fetchProjects();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(t('projects.createFailed'));
      }

      const data = await response.json();

      // CUSTOM: 智能跳转逻辑 (批次3新增特性)
      // 检查新项目是否有完整的模型配置,如果有则跳转到text-split,否则跳转到settings
      try {
        const modelConfigResponse = await fetch(`/api/projects/${data.id}/model-config`);
        if (modelConfigResponse.ok) {
          const modelConfigData = await modelConfigResponse.json();
          const hasCompleteModel = modelConfigData.data &&
            modelConfigData.data.length > 0 &&
            modelConfigData.data.some(config =>
              config.apiKey && config.endpoint && config.modelName
            );

          // 如果有完整模型配置,跳转到text-split;否则跳转到settings
          if (hasCompleteModel) {
            router.push(`/projects/${data.id}/text-split`);
          } else {
            router.push(`/projects/${data.id}/settings?tab=model`);
          }
        } else {
          // 如果获取模型配置失败,默认跳转到settings
          router.push(`/projects/${data.id}/settings?tab=model`);
        }
      } catch (modelConfigError) {
        // 如果检查模型配置出错,默认跳转到settings
        console.error('检查模型配置失败:', modelConfigError);
        router.push(`/projects/${data.id}/settings?tab=model`);
      }
    } catch (err) {
      console.error(t('projects.createError'), err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          {t('projects.createNew')}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              name="name"
              label={t('projects.name')}
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
            <TextField
              name="description"
              label={t('projects.description')}
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={handleChange}
            />
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="reuse-config-label">{t('projects.reuseConfig')}</InputLabel>
              <Select
                labelId="reuse-config-label"
                name="reuseConfigFrom"
                value={formData.reuseConfigFrom}
                onChange={handleChange}
                label={t('projects.reuseConfig')}
              >
                <MenuItem value="">{t('projects.noReuse')}</MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {error && (
            <Typography color="error" variant="body2" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.name}
            sx={{
              background: theme.palette.gradient.primary,
              '&:hover': {
                boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            {loading ? <CircularProgress size={24} /> : t('home.createProject')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
