# Image Optimization Guide

## Current Issues

The `vybe-logo.png` files are **1.4MB each** - way too large for web use!

## Recommended Actions

### 1. Optimize Existing Images

Use an image optimization tool to reduce file sizes:

**Online Tools:**
- https://squoosh.app/ (Google's image optimizer)
- https://tinypng.com/ (PNG compression)
- https://compressor.io/ (Multiple formats)

**CLI Tools:**
```bash
# Install imagemagick (macOS)
brew install imagemagick

# Optimize PNG (reduce to 80% quality, max width 800px)
convert vybe-logo.png -resize 800x -quality 80 vybe-logo-optimized.png

# Or use sharp-cli
npx sharp-cli -i vybe-logo.png -o vybe-logo-optimized.png --resize 800
```

### 2. Use WebP Format

WebP provides better compression than PNG/JPG:

```bash
# Convert to WebP
npx sharp-cli -i vybe-logo.png -o vybe-logo.webp --format webp --quality 80
```

Then use with fallback:
```tsx
<picture>
  <source srcSet="/vybe-logo.webp" type="image/webp" />
  <img src="/vybe-logo.png" alt="Vybe Logo" />
</picture>
```

### 3. Responsive Images

Serve different sizes based on screen size:

```tsx
<img
  src="/vybe-logo-800.png"
  srcSet="
    /vybe-logo-400.png 400w,
    /vybe-logo-800.png 800w,
    /vybe-logo-1200.png 1200w
  "
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px"
  alt="Vybe Logo"
/>
```

### 4. Lazy Loading

Add lazy loading to images not in viewport:

```tsx
<img src="/vybe-logo.png" alt="Vybe Logo" loading="lazy" />
```

## Target Sizes

| Image Type | Max Size | Format | Quality |
|-----------|----------|--------|---------|
| Hero/Logo | 100-200KB | WebP/PNG | 80-85% |
| Thumbnails | 20-50KB | WebP/JPG | 75-80% |
| Icons | 5-15KB | PNG/SVG | 100% |
| Background | 150-300KB | WebP/JPG | 70-80% |

## Automated Optimization (Recommended)

Install vite-plugin-imagemin for automatic optimization:

```bash
npm install -D vite-plugin-imagemin
```

Then add to `vite.config.ts`:

```typescript
import viteImagemin from 'vite-plugin-imagemin'

export default defineConfig({
  plugins: [
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      mozjpeg: { quality: 80 },
      pngquant: { quality: [0.8, 0.9] },
      svgo: { plugins: [{ name: 'removeViewBox' }] },
      webp: { quality: 80 }
    })
  ]
})
```

## Current Images to Optimize

- ❌ `public/vybe-logo.png` - 1.4MB → Target: <100KB
- ❌ `src/assets/vybe-logo.png` - 1.4MB → Target: <100KB
- ⚠️ `src/assets/logo-concept-2.png` - 50KB → OK
- ⚠️ `src/assets/logo-concept-3.png` - 40KB → OK
- ✅ `src/assets/logo-concept-1.png` - 26KB → Good

## Priority Actions

1. **Immediate:** Use squoosh.app to compress both vybe-logo.png files to <100KB
2. **Short-term:** Convert to WebP format
3. **Long-term:** Set up automated optimization in build pipeline
