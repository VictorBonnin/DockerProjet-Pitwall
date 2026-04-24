# Home Luxury Design

## Goal

Replace the current minimal `/` page with a faithful Next.js recreation of `theme3-luxury.html`.

## Scope

- Full-screen landing page only
- No header or extra navigation
- Same luxury-gold visual language as the provided HTML prototype
- Orbital image carousel, centered countdown, noise canvas, decorative corners

## Implementation Notes

- Keep `/` as a thin server page
- Move interactive behavior into a dedicated client component
- Use local images from `public/img`
- Recreate the CSS and animation timing as closely as possible
- Keep the rest of the data logic and API routes untouched

## Acceptance

- Opening `/` shows the luxury hero only
- The orbit animates continuously
- The countdown updates every second
- The page matches the provided prototype as closely as possible within the app
