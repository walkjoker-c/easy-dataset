# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Easy Dataset is a full-stack application for creating LLM fine-tuning datasets from unstructured documents. It provides a complete workflow: document upload → intelligent text splitting → question generation → answer generation → dataset export. The application runs as both a web app (Next.js) and desktop app (Electron).

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, Material-UI v5
- **Backend**: Node.js with Next.js API Routes
- **Database**: Prisma ORM with SQLite
- **AI Integration**: Unified API supporting OpenAI, Ollama, Zhipu AI, OpenRouter, and custom providers
- **Desktop**: Electron with electron-builder
- **Internationalization**: i18next (English and Chinese)
- **Package Manager**: pnpm (preferred) or npm

## Common Commands

### Development
```bash
# Install dependencies
npm install  # or pnpm install

# Initialize database (required before first run)
npm run db:push

# Start development server (includes db:push)
npm run dev

# Access at http://localhost:1717
```

### Database Management
```bash
# Open Prisma Studio (database GUI)
npm run db:studio

# Push schema changes to database
npm run db:push

# Generate database template for Electron builds
npm run db:template
```

### Building
```bash
# Build Next.js application
npm run build

# Start production server
npm run start
```

### Electron Desktop App
```bash
# Development mode (auto-opens Electron)
npm run electron-dev

# Build for all platforms
npm run electron-build

# Build for specific platforms
npm run electron-build-mac
npm run electron-build-win
npm run electron-build-linux
```

### Docker
```bash
# Build Docker image
npm run docker

# Run with docker-compose
docker-compose up -d
```

### Code Quality
```bash
# Lint code
npm run lint

# Format code with Prettier
npm run prettier
```

## Architecture

### Data Flow Pipeline

The application follows a sequential data processing pipeline:

1. **Document Upload** → Files stored in `local-db/projects/{projectId}/uploads/`
2. **Text Splitting** → Intelligent chunking with configurable algorithms → Creates `Chunks`
3. **GA Pair Generation** (optional) → Generates Genre-Audience pairs for targeted questions
4. **Question Generation** → LLM generates questions from chunks → Creates `Questions`
5. **Answer Generation** → LLM generates answers (with optional COT) → Creates `Datasets`
6. **Export** → Multiple formats (Alpaca, ShareGPT, multilingual-thinking) as JSON/JSONL

### Core Module Structure

```
lib/
├── api/          # Shared API utilities and helpers
├── db/           # Prisma database access layer (one file per model)
│   ├── base.js               # Core Prisma client initialization
│   ├── projects.js           # Project CRUD
│   ├── chunks.js             # Text chunk management
│   ├── questions.js          # Question generation and management
│   ├── datasets.js           # Dataset/answer management
│   ├── dataset-conversations.js  # Multi-turn conversation datasets
│   ├── custom-prompts.js     # User-customizable prompt templates
│   ├── ga-pairs.js           # Genre-Audience pair management
│   ├── images.js             # Image upload and management
│   ├── imageDatasets.js      # Image-based Q&A datasets
│   └── questionTemplates.js  # Reusable question templates
├── file/         # Document processing and parsing
│   └── file-process/  # Format-specific processors (PDF, DOCX, MD, EPUB)
├── llm/          # LLM integration layer
│   ├── core/           # Provider implementations
│   │   └── providers/  # OpenAI, Ollama, Zhipu, OpenRouter adapters
│   ├── prompts/        # Multilingual prompt templates
│   └── common/         # Shared LLM utilities
├── services/     # Business logic layer
│   ├── tasks/          # Background task processing
│   ├── questions/      # Question generation service
│   ├── datasets/       # Answer generation service
│   ├── ga/             # Genre-Audience pair generation
│   ├── images/         # Image dataset generation
│   └── multi-turn/     # Multi-turn conversation generation
└── util/         # General utilities
```

### API Routes Structure

API routes follow RESTful patterns under `app/api/`:

```
api/
├── projects/
│   ├── route.js                    # GET (list), POST (create)
│   └── [projectId]/
│       ├── route.js                # GET, PUT, DELETE project
│       ├── split/route.js          # POST - trigger text splitting
│       ├── custom-split/route.js   # POST - custom delimiter splitting
│       ├── tasks/                  # Task management endpoints
│       ├── chunks/                 # Chunk CRUD
│       ├── questions/              # Question generation and CRUD
│       ├── datasets/               # Answer generation and CRUD
│       ├── dataset-conversations/  # Multi-turn conversation datasets
│       ├── ga-pairs/               # Genre-Audience pair management
│       ├── images/                 # Image upload and management
│       └── llamaFactory/           # LLaMA Factory integration
└── llm/
    ├── providers/route.js          # List available LLM providers
    ├── model/route.js              # Model configuration CRUD
    └── fetch-models/route.js       # Fetch models from provider APIs
```

### Database Schema Key Points

- **Projects**: Top-level entity. Each project has its own model configurations, custom prompts, and all related data.
- **Chunks**: Text segments extracted from uploaded files. Questions are generated from chunks.
- **Questions**: Generated from chunks or GA pairs. Linked to specific chunks and optionally to images.
- **Datasets**: Question-answer pairs. Contains question, answer, COT (chain of thought), model used, and metadata.
- **DatasetConversations**: Multi-turn conversational datasets with role definitions and scenario settings.
- **GaPairs**: Genre-Audience pairs for targeted question generation (5 pairs per file).
- **Images/ImageDatasets**: Support for vision-based question generation.
- **QuestionTemplates**: Reusable question templates for consistent dataset generation.
- **Tags**: Hierarchical label tree for organizing questions and datasets.
- **Task**: Background task tracking with status, progress, and completion counts.
- **ModelConfig**: Project-specific LLM configurations (API keys, endpoints, model parameters).
- **CustomPrompts**: Project-specific prompt template overrides.

All project-related tables use `onDelete: Cascade` for automatic cleanup.

### LLM Integration Architecture

The LLM system in `lib/llm/` provides a unified interface across multiple providers:

- **Provider Pattern**: Each provider (OpenAI, Ollama, etc.) implements a common interface
- **Streaming Support**: All providers support streaming responses for real-time feedback
- **Prompt Management**: Multilingual prompts in `lib/llm/prompts/` with i18n support
- **Configuration**: Project-level model configs stored in `ModelConfig` table
- **Error Handling**: Automatic retry logic with exponential backoff

Key files:
- `lib/llm/core/index.js`: Main LLM orchestration logic
- `lib/llm/core/providers/`: Individual provider implementations
- `lib/llm/prompts/`: Organized by task type (question, answer, clean, domain-tree, etc.)

### Task System

Background tasks are managed through `lib/services/tasks/` and tracked in the `Task` table:

- **Task Types**: text-processing, question-generation, answer-generation, data-distillation, ga-generation, image-generation
- **Status Codes**: 0 (processing), 1 (completed), 2 (failed), 3 (interrupted)
- **Progress Tracking**: `completedCount` / `totalCount` for UI progress bars
- **Cancellation**: Tasks can be interrupted mid-processing

Tasks are executed via API endpoints and update progress in real-time.

### File Processing

Document processing in `lib/file/` supports multiple formats:

- **PDF**: Extracted using `@opendocsg/pdf2md` and `pdf2md-js`
- **DOCX**: Parsed with `mammoth`
- **Markdown**: Native support with structure preservation
- **EPUB**: Extracted and converted to markdown
- **TXT**: Plain text processing

Text splitting algorithms:
- **Intelligent splitting**: Uses heading-based segmentation
- **Custom delimiter**: User-defined split characters
- **Size-based**: Max chunk size with overlap support

### Component Organization

```
components/
├── home/               # Landing page components
├── text-split/         # Document upload and chunk visualization
├── questions/          # Question list, editing, and generation UI
├── datasets/           # Dataset list, editing, and export UI
├── dataset-conversations/  # Multi-turn conversation UI
├── export/             # Export dialog and format selection
├── settings/           # Project configuration and model setup
├── tasks/              # Task progress and history
├── playground/         # LLM testing playground
├── mga/                # Multi-generational answer comparison
├── distill/            # Dataset quality improvement
├── dataset-square/     # Community dataset sharing
└── common/             # Shared UI components (Navbar, dialogs, etc.)
```

## Key Development Patterns

### Adding a New LLM Provider

1. Create provider file in `lib/llm/core/providers/my-provider.js`
2. Implement required methods:
   - `createModel(config)` - Initialize provider SDK
   - `generate(model, prompt, options)` - Synchronous generation
   - `streamGenerate(model, prompt, options)` - Streaming generation
3. Register in `lib/llm/core/index.js` provider map
4. Add to `LlmProviders` table via `lib/db/llm-providers.js`
5. Update UI in `components/settings/ModelConfig.js`

### Adding a New File Format

1. Create parser in `lib/file/file-process/my-format.js`
2. Implement `extractContent(filePath)` returning text
3. Register in `lib/file/index.js` format dispatcher
4. Update file upload validation in `app/api/projects/[projectId]/files/route.js`
5. Add MIME type to allowed extensions

### Customizing Prompts

Prompts are in `lib/llm/prompts/` organized by function:

- `question.js` - Question generation prompts
- `answer.js` - Answer generation prompts
- `clean.js` - Dataset cleaning/improvement prompts
- `domain-tree.js` - Domain label tree generation
- `ga.js` - Genre-Audience pair generation
- `multi-turn.js` - Multi-turn conversation generation

Each file exports constants like `QUESTION_PROMPT` (Chinese) and `QUESTION_PROMPT_EN` (English). Users can override these per-project via the `CustomPrompts` table.

### Adding Export Formats

1. Create format transformer in `components/export/formats/my-format.js`
2. Implement `transform(datasets, config)` returning formatted data
3. Add format option to `components/export/ExportDialog.js`
4. Update validation logic for format-specific requirements

## Important Considerations

### Database Migrations

- Always run `npm run db:push` after pulling schema changes
- Prisma migrations are NOT used (db push only)
- For Electron builds, run `npm run db:template` to create template SQLite file

### File Storage

- All project files stored in `local-db/projects/{projectId}/`
- Uploaded files: `local-db/projects/{projectId}/uploads/`
- Images: `local-db/projects/{projectId}/images/`
- Database: `prisma/db.sqlite` (or path in DATABASE_URL env var)
- For Docker: Mount `./local-db` volume to persist data

### LLM API Considerations

- All LLM calls should handle timeouts and network errors gracefully
- Use streaming when possible for better UX (especially for long answers)
- Model configs are per-project, not global
- API keys stored in database (consider encryption for production)

### Internationalization

- All UI strings use i18n via `react-i18next`
- Translation files in `locales/{lang}/translation.json`
- LLM prompts have separate versions: `*_PROMPT` (Chinese), `*_PROMPT_EN` (English)
- Language detection is automatic based on browser settings

### Electron-specific Notes

- Main process: `electron/main.js`
- Preload script: `electron/preload.js`
- Next.js server runs in Electron's main process
- Database path must be in `userData` directory for write access
- Native modules (sharp, sqlite3) require special asar unpacking config

### Performance Optimization

- Large file processing should use streaming to avoid memory issues
- Batch LLM requests when generating multiple Q&A pairs
- Use virtual scrolling for long lists (questions, datasets)
- Consider pagination for projects with >1000 items

## Troubleshooting

### Database Issues

- "Database locked" errors: Ensure only one instance is running
- "Table does not exist": Run `npm run db:push`
- Electron db issues: Check write permissions in userData directory

### LLM API Issues

- Timeout errors: Increase timeout in model config or use streaming
- API key errors: Verify key in project settings
- CORS errors: Only applies to browser-based deployments (not Electron)

### Build Issues

- Electron builds failing: Check native module binary targets in package.json
- Next.js build errors: Clear `.next` folder and rebuild
- Docker issues: Ensure mounted volumes have correct permissions

## Related Documentation

- Full documentation: https://docs.easy-dataset.com/ed/en
- Architecture doc: `ARCHITECTURE.md`
- Agent guide: `AGENTS.md`
- README: `README.md`
