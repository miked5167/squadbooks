# Performance Testing and Optimization

## Core Web Vitals

### Largest Contentful Paint (LCP)
**What**: Time to render largest visible element
**Target**: < 2.5 seconds
**Common causes**:
- Slow server response
- Render-blocking CSS/JS
- Large images
- Client-side rendering

**Fixes**:
- Optimize images (WebP, compression, sizing)
- Use CDN
- Preload critical resources
- Server-side rendering

### First Input Delay (FID)
**What**: Time from user interaction to browser response
**Target**: < 100 milliseconds
**Common causes**:
- Long JavaScript tasks
- Heavy third-party scripts
- Large bundles

**Fixes**:
- Break up long tasks
- Use web workers
- Defer non-critical JavaScript
- Code splitting

### Cumulative Layout Shift (CLS)
**What**: Visual stability during page load
**Target**: < 0.1
**Common causes**:
- Images without dimensions
- Ads/embeds/iframes without reserved space
- FOIT/FOUT (flash of invisible/unstyled text)
- Dynamic content injection

**Fixes**:
- Set width/height on images and video
- Reserve space for dynamic content
- Use font-display: swap
- Avoid inserting content above existing

## Performance Metrics

### Page Load Metrics
- **TTFB** (Time to First Byte): < 600ms
- **FCP** (First Contentful Paint): < 1.8s
- **TTI** (Time to Interactive): < 3.8s
- **Total Blocking Time**: < 200ms

### Resource Metrics
- **JavaScript bundle size**: < 200KB (gzipped)
- **CSS bundle size**: < 50KB (gzipped)
- **Images per page**: Optimize all, lazy load below fold
- **Total page weight**: < 1MB ideal, < 2MB maximum

## Testing Tools

### Browser DevTools
- Network panel: Waterfall chart
- Performance panel: Flame chart
- Lighthouse: Automated audits
- Coverage: Unused code detection

### Online Tools
- PageSpeed Insights
- WebPageTest
- GTmetrix
- Chrome User Experience Report

## Optimization Strategies

### Images
- Use next-gen formats (WebP, AVIF)
- Responsive images with srcset
- Lazy loading for below-fold images
- Compress images (TinyPNG, ImageOptim)
- Use appropriate dimensions
- Consider using CDN

### JavaScript
- Code splitting
- Tree shaking
- Minification and compression
- Defer non-critical scripts
- Use dynamic imports
- Remove unused dependencies

### CSS
- Critical CSS inline
- Defer non-critical CSS
- Remove unused CSS
- Minimize specificity
- Use CSS containment
- Avoid @import

### Fonts
- Use system fonts when possible
- Limit font weights and styles
- Use font-display: swap
- Self-host fonts
- Subset fonts
- Preload critical fonts

### Rendering
- Server-side rendering (SSR)
- Static site generation (SSG)
- Incremental static regeneration
- Edge rendering
- Progressive enhancement

### Caching
- Set proper cache headers
- Use service workers
- Implement offline support
- Version assets
- Use CDN

### Third-Party Scripts
- Audit necessity
- Async/defer loading
- Self-host when possible
- Use resource hints (dns-prefetch, preconnect)
- Monitor impact

## Performance Budget

### Example Budget
```
JavaScript: 170KB (gzipped)
CSS: 50KB (gzipped)
Fonts: 30KB (WOFF2)
Images: 200KB total
Total: 450KB
Time to Interactive: < 3.5s
Lighthouse Performance: > 90
```

### Monitoring
- Set up alerts for budget violations
- Track metrics over time
- Test on various devices/networks
- Regular performance audits

## Mobile Optimization

### Considerations
- Test on real devices
- Throttle CPU and network
- Optimize for 3G networks
- Reduce battery drain
- Minimize data usage

### Mobile-Specific Issues
- Touch target sizes (44x44px minimum)
- Viewport configuration
- Avoid hover-only interactions
- Optimize form inputs for mobile keyboards

## Common Performance Killers

1. **Unoptimized images**: Biggest cause of bloat
2. **Too much JavaScript**: Blocks rendering and interaction
3. **Render-blocking resources**: CSS and synchronous scripts
4. **No caching strategy**: Repeated downloads
5. **Third-party scripts**: Ad networks, analytics, social widgets
6. **Web fonts**: FOIT/FOUT issues
7. **No lazy loading**: Loading everything upfront
8. **Layout shifts**: Images/ads without dimensions

## Performance Testing Checklist

- [ ] Lighthouse score > 90
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] JavaScript bundle < 200KB
- [ ] Images optimized and lazy loaded
- [ ] Critical CSS inlined
- [ ] Fonts optimized
- [ ] Caching configured
- [ ] Tested on 3G network
- [ ] Tested on low-end devices
- [ ] No console errors
- [ ] Service worker configured (if applicable)
