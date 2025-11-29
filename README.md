# eiriksm.dev

[![Deploy blog](https://github.com/eiriksm/eiriksm.dev/actions/workflows/deploy.yml/badge.svg)](https://github.com/eiriksm/eiriksm.dev/actions/workflows/deploy.yml)
[![Test](https://github.com/eiriksm/eiriksm.dev/actions/workflows/test.yml/badge.svg)](https://github.com/eiriksm/eiriksm.dev/actions/workflows/test.yml)
[![Violinist enabled](https://img.shields.io/badge/violinist-enabled-brightgreen.svg)](https://violinist.io)

A modern blog built with Next.js 16, Tailwind CSS, and Drupal integration.

## Features

- 🚀 **Next.js 16** with App Router
- 🎨 **Tailwind CSS v4** for styling with modern CSS-first configuration
- 📝 **Drupal Integration** via next-drupal
- 💬 **GitHub Issues Comments** integration
- 🔍 **SEO Optimized** with metadata and structured data
- 📱 **Responsive Design**
- 📊 **Google Analytics** support
- 🗺️ **Sitemap & RSS Feed** generation
- ⚡ **Static Export** for S3 deployment

## Getting Started

### Prerequisites

- Node.js 18+
- A Drupal site with JSON:API enabled
- GitHub repository for comments (optional)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy the environment variables:
```bash
cp .env.example .env.local
```

3. Update the environment variables in `.env.local` with your Drupal site details

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Build for Production

**Important:** The production build requires access to your Drupal API to generate static pages. Make sure your `.env.local` (or environment variables) include:
- `NEXT_PUBLIC_DRUPAL_BASE_URL` - Your Drupal site URL
- `BASIC_AUTH_USERNAME` - Basic auth username (if your Drupal site is protected)
- `BASIC_AUTH_PASSWORD` - Basic auth password (if your Drupal site is protected)

```bash
npm run build
```

This creates a static export in the `out/` directory ready for deployment to S3 or any static hosting.

For local preview of the static build:
```bash
npx serve out
```

## Project Structure

```
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── [...slug]/    # Dynamic blog post pages
│   │   ├── blog/         # Blog pagination
│   │   ├── tag/          # Tag pages
│   │   ├── about/        # About page
│   │   ├── talks/        # Talks page
│   │   ├── api/          # API routes (RSS)
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   └── lib/              # Utilities
├── public/               # Static assets
└── tailwind.config.js    # Tailwind configuration
```

## Drupal Configuration

Your Drupal site should have:

- **Content Type**: `article` (node--article)
- **Fields**:
  - `title` - Article title
  - `body` - Article content
  - `field_tags` - Taxonomy reference (tags)
  - `field_image` - Image field (optional)
  - `field_issue_comment_id` - Text field for GitHub issue ID (optional)
- **JSON:API** module enabled
- **OAuth** configured for authentication

## License

MIT

## Author

Eirik S. Morland - [@orkj](https://twitter.com/orkj)
