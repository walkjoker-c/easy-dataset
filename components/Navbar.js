'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  MenuItem,
  FormControl,
  Select,
  Tabs,
  Tab,
  IconButton,
  useTheme as useMuiTheme,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import ModelSelect from './ModelSelect';
import LanguageSwitcher from './LanguageSwitcher';
import UpdateChecker from './UpdateChecker';
import TaskIcon from './TaskIcon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// 图标
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import GitHubIcon from '@mui/icons-material/GitHub';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import TokenOutlinedIcon from '@mui/icons-material/TokenOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import DatasetOutlinedIcon from '@mui/icons-material/DatasetOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import SourceIcon from '@mui/icons-material/Source';
import { toast } from 'sonner';
import axios from 'axios';
import { useSetAtom } from 'jotai/index';
import { modelConfigListAtom, selectedModelInfoAtom } from '@/lib/store';

export default function Navbar({ projects = [], currentProject }) {
  const [selectedProject, setSelectedProject] = useState(currentProject || '');
  const { t, i18n } = useTranslation();
  const pathname = usePathname();
  const theme = useMuiTheme();
  const { resolvedTheme, setTheme } = useTheme();
  const setConfigList = useSetAtom(modelConfigListAtom);
  const setSelectedModelInfo = useSetAtom(selectedModelInfoAtom);
  // 只在项目详情页显示模块选项卡
  const isProjectDetail = pathname.includes('/projects/') && pathname.split('/').length > 3;
  // 更多菜单状态
  const [moreMenuAnchor, setMoreMenuAnchor] = useState(null);
  const isMoreMenuOpen = Boolean(moreMenuAnchor);

  // 数据集菜单状态
  const [datasetMenuAnchor, setDatasetMenuAnchor] = useState(null);
  const isDatasetMenuOpen = Boolean(datasetMenuAnchor);

  // 数据源菜单状态
  const [sourceMenuAnchor, setSourceMenuAnchor] = useState(null);
  const isSourceMenuOpen = Boolean(sourceMenuAnchor);

  // 处理更多菜单打开
  const handleMoreMenuOpen = event => {
    setMoreMenuAnchor(event.currentTarget);
  };

  // 处理更多菜单悬浮打开
  const handleMoreMenuHover = event => {
    setMoreMenuAnchor(event.currentTarget);
  };

  // 关闭更多菜单
  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  // 处理菜单区域的鼠标离开
  const handleMenuMouseLeave = () => {
    setMoreMenuAnchor(null);
  };

  // 处理数据集菜单悬浮打开
  const handleDatasetMenuHover = event => {
    setDatasetMenuAnchor(event.currentTarget);
  };

  // 关闭数据集菜单
  const handleDatasetMenuClose = () => {
    setDatasetMenuAnchor(null);
  };

  // 处理数据集菜单区域的鼠标离开
  const handleDatasetMenuMouseLeave = () => {
    setDatasetMenuAnchor(null);
  };

  // 处理数据源菜单悬浮打开
  const handleSourceMenuHover = event => {
    setSourceMenuAnchor(event.currentTarget);
  };

  // 关闭数据源菜单
  const handleSourceMenuClose = () => {
    setSourceMenuAnchor(null);
  };

  // 处理数据源菜单区域的鼠标离开
  const handleSourceMenuMouseLeave = () => {
    setSourceMenuAnchor(null);
  };

  // ========== CUSTOM START ==========
  // 定制说明: 修复页面首次加载时模型列表未初始化问题
  // 问题: 创建项目后跳转到text-split页面,Navbar组件渲染但未触发API调用
  //       导致modelConfigListAtom保持localStorage中的旧值(可能为null),引发filter错误
  // 解决: 添加useEffect在currentProject变化时自动加载模型列表
  // 修改日期: 2025-11-26 | 修改人: @amx
  useEffect(() => {
    if (currentProject) {
      axios
        .get(`/api/projects/${currentProject}/model-config`)
        .then(response => {
          setConfigList(response.data.data);
          if (response.data.defaultModelConfigId) {
            setSelectedModelInfo(response.data.data.find(item => item.id === response.data.defaultModelConfigId));
          } else {
            setSelectedModelInfo('');
          }
        })
        .catch(error => {
          console.error('Failed to load model config on mount:', error);
          // 失败时设置为空数组,避免null导致的filter错误
          setConfigList([]);
        });
    }
  }, [currentProject, setConfigList, setSelectedModelInfo]);
  // ========== CUSTOM END ==========

  const handleProjectChange = event => {
    const newProjectId = event.target.value;
    setSelectedProject(newProjectId);
    axios
      .get(`/api/projects/${newProjectId}/model-config`)
      .then(response => {
        setConfigList(response.data.data);
        if (response.data.defaultModelConfigId) {
          setSelectedModelInfo(response.data.data.find(item => item.id === response.data.defaultModelConfigId));
        } else {
          setSelectedModelInfo('');
        }
      })
      .catch(error => {
        toast.error('get model list error');
      });
    // 跳转到新选择的项目页面
    window.location.href = `/projects/${newProjectId}/text-split`;
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      color={theme.palette.mode === 'dark' ? 'transparent' : 'primary'}
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'primary.main'
      }}
      style={{ borderRadius: 0, zIndex: 99000 }}
    >
      <Toolbar
        sx={{
          height: '56px',
          minHeight: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        style={{ zIndex: 99000 }}
      >
        {/* 左侧Logo和项目选择 */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 0 }}>
          {/* CUSTOM: 禁用品牌Logo/名称点击跳转 (批次4定制增强) */}
          {/* 理由: 后续一个项目对应一个用户,主界面是管理员界面,普通用户不能跳转 */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mr: 2
              // CUSTOM: 注释掉hover效果,禁止点击跳转到主界面
              // '&:hover': { opacity: 0.9 }
            }}
            // CUSTOM: 注释掉cursor和onClick,禁止点击跳转到主界面
            // style={{ cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
            // onClick={() => {
            //   window.location.href = '/';
            // }}
          >
            {/* CUSTOM: 自定义Logo和品牌名称 (迁移自1.4.0) */}
            <Box
              component="img"
              src={process.env.NEXT_PUBLIC_BRAND_LOGO || "/imgs/夸夸logo-05.png"}
              alt={process.env.NEXT_PUBLIC_BRAND_NAME || "夸夸Logo"}
              sx={{
                width: 28,
                height: 28,
                mr: 1.5
              }}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 600,
                letterSpacing: '-0.5px'
              }}
              style={{ fontSize: '1.1rem' }}
              className={theme.palette.mode === 'dark' ? 'gradient-text' : ''}
              color={theme.palette.mode === 'dark' ? 'inherit' : 'white'}
            >
              {/* CUSTOM: 使用国际化品牌名称 (迁移自1.4.0) */}
              {t('app.title')}
            </Typography>
          </Box>

          {/* CUSTOM: 项目切换器可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
          {isProjectDetail && process.env.NEXT_PUBLIC_ENABLE_PROJECT_SWITCHER !== 'false' && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={selectedProject}
                onChange={handleProjectChange}
                displayEmpty
                variant="outlined"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  '& .MuiSelect-icon': {
                    color: theme.palette.mode === 'dark' ? 'inherit' : 'white'
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'transparent'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'primary.main'
                  }
                }}
                MenuProps={{
                  PaperProps: {
                    elevation: 2,
                    sx: { mt: 1, borderRadius: 2 }
                  }
                }}
              >
                <MenuItem value="" disabled>
                  {t('projects.selectProject')}
                </MenuItem>
                {projects.map(project => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        {/* 中间的功能模块导航 - 使用Flex布局居中 */}
        {isProjectDetail && (
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', ml: 2, mr: 2 }}>
            <Tabs
              value={
                pathname.includes('/settings') || pathname.includes('/playground') || pathname.includes('/datasets-sq')
                  ? 'more'
                  : pathname.includes('/datasets') ||
                      pathname.includes('/multi-turn') ||
                      pathname.includes('/image-datasets')
                    ? 'datasets'
                    : pathname.includes('/text-split') || pathname.includes('/images')
                      ? 'source'
                      : pathname
              }
              textColor="inherit"
              indicatorColor="secondary"
              sx={{
                '& .MuiTab-root': {
                  minWidth: 100,
                  fontSize: '0.85rem',
                  transition: 'all 0.2s',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  opacity: theme.palette.mode === 'dark' ? 0.7 : 0.8,
                  padding: '6px 16px',
                  minHeight: '48px',
                  '&:hover': {
                    color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                    opacity: 1
                  }
                },
                '& .Mui-selected': {
                  color: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white',
                  opacity: 1,
                  fontWeight: 600
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.secondary.main : 'white'
                }
              }}
            >
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('common.dataSource')}
                value="source"
                onMouseEnter={handleSourceMenuHover}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <TokenOutlinedIcon fontSize="small" />
                  </Box>
                }
                iconPosition="start"
                label={t('distill.title')}
                value={`/projects/${selectedProject}/distill`}
                component={Link}
                href={`/projects/${selectedProject}/distill`}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <QuestionAnswerOutlinedIcon fontSize="small" />
                  </Box>
                }
                iconPosition="start"
                label={t('questions.title')}
                value={`/projects/${selectedProject}/questions`}
                component={Link}
                href={`/projects/${selectedProject}/questions`}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('datasets.management')}
                value="datasets"
                onMouseEnter={handleDatasetMenuHover}
              />
              <Tab
                icon={
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <ArrowDropDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                  </Box>
                }
                iconPosition="start"
                label={t('common.more')}
                onMouseEnter={handleMoreMenuHover}
                value="more"
              />
            </Tabs>
          </Box>
        )}

        {/* 数据源菜单 */}
        <Menu
          anchorEl={sourceMenuAnchor}
          open={isSourceMenuOpen}
          onClose={handleSourceMenuClose}
          PaperProps={{
            elevation: 2,
            sx: { mt: 1.5, borderRadius: 2, minWidth: 180 },
            onMouseLeave: handleSourceMenuMouseLeave
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleSourceMenuMouseLeave
          }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/text-split`}
            onClick={handleSourceMenuClose}
            selected={pathname === `/projects/${selectedProject}/text-split`}
          >
            <ListItemIcon>
              <DescriptionOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('textSplit.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/images`}
            onClick={handleSourceMenuClose}
            selected={pathname === `/projects/${selectedProject}/images`}
          >
            <ListItemIcon>
              <ImageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('images.title')} />
          </MenuItem>
        </Menu>

        {/* 数据集菜单 */}
        <Menu
          anchorEl={datasetMenuAnchor}
          open={isDatasetMenuOpen}
          onClose={handleDatasetMenuClose}
          PaperProps={{
            elevation: 2,
            sx: { mt: 1.5, borderRadius: 2, minWidth: 200 },
            onMouseLeave: handleDatasetMenuMouseLeave
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleDatasetMenuMouseLeave
          }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/datasets`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/datasets`}
          >
            <ListItemIcon>
              <DatasetOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.singleTurn', '单轮问答数据集')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/multi-turn`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/multi-turn`}
          >
            <ListItemIcon>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.multiTurn', '多轮对话数据集')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/image-datasets`}
            onClick={handleDatasetMenuClose}
            selected={pathname === `/projects/${selectedProject}/image-datasets`}
          >
            <ListItemIcon>
              <ImageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasets.imageQA', '图片问答数据集')} />
          </MenuItem>
        </Menu>

        {/* 更多菜单 */}
        <Menu
          anchorEl={moreMenuAnchor}
          open={isMoreMenuOpen}
          onClose={handleMoreMenuClose}
          PaperProps={{
            elevation: 2,
            sx: { mt: 1.5, borderRadius: 2, minWidth: 180 },
            onMouseLeave: handleMenuMouseLeave
          }}
          transformOrigin={{ horizontal: 'center', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
          MenuListProps={{
            dense: true,
            onMouseLeave: handleMenuMouseLeave
          }}
        >
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/settings`}
            onClick={handleMoreMenuClose}
            selected={pathname === `/projects/${selectedProject}/settings`}
          >
            <ListItemIcon>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('settings.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href={`/projects/${selectedProject}/playground`}
            onClick={handleMoreMenuClose}
            selected={pathname === `/projects/${selectedProject}/playground`}
          >
            <ListItemIcon>
              <ScienceOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('playground.title')} />
          </MenuItem>
          <Divider />
          <MenuItem
            component={Link}
            href="/dataset-square"
            onClick={handleMoreMenuClose}
            selected={pathname === `/dataset-square`}
          >
            <ListItemIcon>
              <StorageIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('datasetSquare.title')} />
          </MenuItem>
        </Menu>

        {/* 右侧操作区 - 使用Flex布局 */}
        <Box sx={{ display: 'flex', flexGrow: 0, alignItems: 'center', gap: 1.5 }}>
          {/* 模型选择 */}
          {location.pathname.includes('/projects/') && <ModelSelect projectId={selectedProject} />}
          {/* 任务图标 - 仅在项目页面显示 */}
          {location.pathname.includes('/projects/') && <TaskIcon theme={theme} projectId={selectedProject} />}

          {/* 语言切换器 */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LanguageSwitcher />
          </Box>
          {/* 主题切换按钮 */}
          <Tooltip title={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                p: 1,
                borderRadius: 1.5,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                }
              }}
            >
              {resolvedTheme === 'dark' ? (
                <LightModeOutlinedIcon fontSize="small" />
              ) : (
                <DarkModeOutlinedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>

          {/* CUSTOM: 文档链接可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
          {process.env.NEXT_PUBLIC_ENABLE_DOCS_LINK !== 'false' && (
            <Tooltip title={t('documentation')}>
              <IconButton
                href={
                  i18n.language === 'zh-CN' ? 'https://docs.easy-dataset.com/' : 'https://docs.easy-dataset.com/ed/en'
                }
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  p: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                  },
                  mr: 1,
                  marginRight: 0
                }}
              >
                <HelpOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* CUSTOM: GitHub链接可通过环境变量控制显示/隐藏 (迁移自1.4.0) */}
          {process.env.NEXT_PUBLIC_ENABLE_GITHUB_LINK !== 'false' && (
            <Tooltip title={t('common.visitGitHub')}>
              <IconButton
                onClick={() => window.open('https://github.com/ConardLi/easy-dataset', '_blank')}
                size="small"
                sx={{
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.15)',
                  color: theme.palette.mode === 'dark' ? 'inherit' : 'white',
                  p: 1,
                  borderRadius: 1.5,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.25)'
                  }
                }}
              >
                <GitHubIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* 更新检查器 */}
          <UpdateChecker />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
