# Viral Scripts

AI-powered viral script generation system for content creators.

## Features

- **Voice Profile Extraction** - Analyze transcripts to extract unique voice patterns
- **Hook Generation** - Generate viral hooks using PCM personality types
- **Script Expansion** - Expand hooks into full scripts with organic CTAs
- **Voice Transformation** - Transform scripts to match creator's voice
- **Shareability Scoring** - Score content for viral potential
- **Validation Pipeline** - Ensure quality and voice fidelity

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL + pgvector)
- **AI**: Claude (Anthropic) + OpenAI Embeddings
- **Styling**: Tailwind CSS

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

## Project Structure

```
src/
├── app/                    # Next.js app router pages & API routes
│   ├── api/               # API endpoints
│   ├── models/            # Model management pages
│   └── scripts/           # Script management pages
├── components/            # React components
│   ├── ui/               # Base UI components
│   └── scripts/          # Script-specific components
└── lib/
    ├── prompts/          # LLM prompt templates
    ├── services/         # Core business logic
    └── supabase/         # Database client & types

scripts/                   # CLI scripts for testing
supabase/migrations/       # Database migrations
docs/                      # Documentation
```

## Pipeline Stages

1. **Corpus Retrieval** - Find relevant examples from the corpus
2. **Hook Generation** - Generate hooks with PCM personality targeting
3. **Shareability Scoring** - Score hooks for viral potential
4. **Script Expansion** - Expand hooks into full scripts
5. **Voice Transformation** - Apply creator's voice patterns
6. **Validation** - Ensure quality standards are met

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ANTHROPIC_API_KEY=your_anthropic_key
OPENAI_API_KEY=your_openai_key
```

## License

Private - All rights reserved.

