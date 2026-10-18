# LessBusy design system

Use the existing `packages/twenty-front/src/config/branding.ts` for product identity, upstream Inter typography, `twenty-ui/theme` variables for both color modes, `twenty-ui/icon` for icons and Lingui for text. Retain existing workspace logo and selector.

Spacing scale: 4, 8, 12, 16, 24, 32, 48 pixels. Overview body text 16px, headline 32px, section headings 20px, comfortable 44px actions. Use a restrained blue accent, theme-aware surfaces, fine borders and clear focus outlines. No decorative gradients or fake charts.

Responsive: auto-fit summary columns, stacked content under 760px, wrapping actions, no minimum desktop width. Main content scrolls independently; side panel keeps the main route mounted. Reduced motion is handled by existing shell; new overview has no animation.

Primitives: existing PageCardLayout/PageHeader/navigation item, plus shared LessBusy content, section, link and summary styles. Empty, loading and error states use clear words, preserve unknown values and offer retry. Unknown counts must never render as zero.

Global resizing of dense record controls is deferred until record-view regression tests pass. M1 improves the new landing page and workflow shortcut touch targets without destabilizing inline editors.
