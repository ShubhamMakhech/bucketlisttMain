/**
 * Centralized color theme system
 * All colors are defined as CSS variables and can be used throughout the application
 */

// Brand Colors
export const brandColors = {
  primary: 'hsl(var(--brand-primary))',
  primaryLight: 'hsl(var(--brand-primary-light))',
  primaryDark: 'hsl(var(--brand-primary-dark))',
  secondary: 'hsl(var(--brand-secondary))',
  accent: 'hsl(var(--brand-accent))',
} as const;

// Semantic Colors
export const semanticColors = {
  success: 'hsl(var(--success))',
  successLight: 'hsl(var(--success-light))',
  successDark: 'hsl(var(--success-dark))',
  warning: 'hsl(var(--warning))',
  warningLight: 'hsl(var(--warning-light))',
  warningDark: 'hsl(var(--warning-dark))',
  error: 'hsl(var(--error))',
  errorLight: 'hsl(var(--error-light))',
  errorDark: 'hsl(var(--error-dark))',
  info: 'hsl(var(--info))',
  infoLight: 'hsl(var(--info-light))',
  infoDark: 'hsl(var(--info-dark))',
} as const;

// Neutral Colors
export const neutralColors = {
  50: 'hsl(var(--neutral-50))',
  100: 'hsl(var(--neutral-100))',
  200: 'hsl(var(--neutral-200))',
  300: 'hsl(var(--neutral-300))',
  400: 'hsl(var(--neutral-400))',
  500: 'hsl(var(--neutral-500))',
  600: 'hsl(var(--neutral-600))',
  700: 'hsl(var(--neutral-700))',
  800: 'hsl(var(--neutral-800))',
  900: 'hsl(var(--neutral-900))',
} as const;

// Gradient Colors
export const gradientColors = {
  primaryStart: 'hsl(var(--gradient-primary-start))',
  primaryEnd: 'hsl(var(--gradient-primary-end))',
  secondaryStart: 'hsl(var(--gradient-secondary-start))',
  secondaryEnd: 'hsl(var(--gradient-secondary-end))',
  accentStart: 'hsl(var(--gradient-accent-start))',
  accentEnd: 'hsl(var(--gradient-accent-end))',
} as const;

// Common gradient combinations
export const gradients = {
  primary: `linear-gradient(135deg, ${gradientColors.primaryStart}, ${gradientColors.primaryEnd})`,
  secondary: `linear-gradient(135deg, ${gradientColors.secondaryStart}, ${gradientColors.secondaryEnd})`,
  accent: `linear-gradient(135deg, ${gradientColors.accentStart}, ${gradientColors.accentEnd})`,
  brandPrimary: `linear-gradient(135deg, ${brandColors.primary}, ${brandColors.secondary})`,
  brandAccent: `linear-gradient(135deg, ${brandColors.accent}, ${brandColors.primary})`,
} as const;

// Tailwind class name helpers
export const twColors = {
  // Brand colors
  brandPrimary: 'bg-brand-primary text-white',
  brandPrimaryLight: 'bg-brand-primary-light text-white',
  brandPrimaryDark: 'bg-brand-primary-dark text-white',
  brandSecondary: 'bg-brand-secondary text-white',
  brandAccent: 'bg-brand-accent text-white',
  
  // Semantic colors
  success: 'bg-success text-white',
  successLight: 'bg-success-light text-white',
  successDark: 'bg-success-dark text-white',
  warning: 'bg-warning text-white',
  warningLight: 'bg-warning-light text-white',
  warningDark: 'bg-warning-dark text-white',
  error: 'bg-error text-white',
  errorLight: 'bg-error-light text-white',
  errorDark: 'bg-error-dark text-white',
  info: 'bg-info text-white',
  infoLight: 'bg-info-light text-white',
  infoDark: 'bg-info-dark text-white',
  
  // Neutral colors
  neutral50: 'bg-neutral-50 text-neutral-900',
  neutral100: 'bg-neutral-100 text-neutral-900',
  neutral200: 'bg-neutral-200 text-neutral-900',
  neutral300: 'bg-neutral-300 text-neutral-900',
  neutral400: 'bg-neutral-400 text-neutral-900',
  neutral500: 'bg-neutral-500 text-white',
  neutral600: 'bg-neutral-600 text-white',
  neutral700: 'bg-neutral-700 text-white',
  neutral800: 'bg-neutral-800 text-white',
  neutral900: 'bg-neutral-900 text-white',
} as const;

// Status badge colors
export const statusColors = {
  available: twColors.success,
  fewLeft: twColors.warning,
  notEnough: twColors.warning,
  fullyBooked: twColors.error,
  selected: twColors.brandPrimary,
} as const;

// Export all colors for easy access
export const colors = {
  brand: brandColors,
  semantic: semanticColors,
  neutral: neutralColors,
  gradient: gradientColors,
  gradients,
  tw: twColors,
  status: statusColors,
} as const;

export default colors;