# Bidirectional Scroll Animations

This project now includes a comprehensive bidirectional scroll animation system that makes components fade in when scrolling down and fade out when scrolling up.

## Components Created

### 1. `useBidirectionalScrollAnimation` Hook
- **Location**: `src/hooks/useBidirectionalScrollAnimation.ts`
- **Purpose**: Core hook that handles intersection observer logic for bidirectional animations
- **Features**:
  - Fade in when element enters viewport
  - Fade out when element leaves viewport
  - Configurable thresholds, delays, and root margins
  - Staggered animations for multiple items

### 2. `BidirectionalAnimatedSection` Component
- **Location**: `src/components/BidirectionalAnimatedSection.tsx`
- **Purpose**: Main component wrapper for adding scroll animations
- **Props**:
  - `animation`: Animation type ('fade-up', 'fade-down', 'fade-left', 'fade-right', 'scale-up', 'slide-up', 'slide-down')
  - `delay`: Delay before fade-in animation starts (ms)
  - `fadeOutDelay`: Delay before fade-out animation starts (ms)
  - `duration`: Animation duration (ms)
  - `threshold`: Intersection observer threshold (0-1)
  - `rootMargin`: Root margin for intersection observer

### 3. `ScrollAnimationWrapper` Component
- **Location**: `src/components/ScrollAnimationWrapper.tsx`
- **Purpose**: Simple wrapper that can be easily applied to existing components
- **Features**:
  - Can be disabled with `enabled={false}`
  - Same props as BidirectionalAnimatedSection
  - Cleaner API for quick implementation

## Implementation

### Current Implementation
The following components have been updated with bidirectional scroll animations:

1. **Index Page** (`src/pages/Index.tsx`):
   - Hero section
   - Popular destinations section with staggered card animations
   - Offers section with staggered experience cards
   - Why Choose Us section with staggered feature cards
   - Footer section

2. **Hero Component** (`src/components/Hero.tsx`):
   - Main content area
   - Search bar
   - Image gallery

### Animation Types Available

1. **fade-up**: Slides up while fading in/out
2. **fade-down**: Slides down while fading in/out
3. **fade-left**: Slides left while fading in/out
4. **fade-right**: Slides right while fading in/out
5. **scale-up**: Scales up while fading in/out
6. **slide-up**: Larger slide up movement
7. **slide-down**: Larger slide down movement

### Usage Examples

#### Basic Usage
```tsx
import { BidirectionalAnimatedSection } from '@/components/BidirectionalAnimatedSection';

<BidirectionalAnimatedSection animation="fade-up" delay={200} duration={600}>
  <div>Your content here</div>
</BidirectionalAnimatedSection>
```

#### Staggered Animations
```tsx
{items.map((item, index) => (
  <BidirectionalAnimatedSection
    key={item.id}
    animation="fade-up"
    delay={200 + index * 100} // Stagger by 100ms
    duration={600}
  >
    <ItemComponent item={item} />
  </BidirectionalAnimatedSection>
))}
```

#### Using the Wrapper Component
```tsx
import { ScrollAnimationWrapper } from '@/components/ScrollAnimationWrapper';

<ScrollAnimationWrapper animation="fade-up" delay={200}>
  <ExistingComponent />
</ScrollAnimationWrapper>
```

## Configuration Options

### Timing
- **delay**: Time to wait before starting fade-in animation
- **fadeOutDelay**: Time to wait before starting fade-out animation
- **duration**: How long the animation takes

### Intersection Observer
- **threshold**: How much of the element needs to be visible (0.1 = 10%)
- **rootMargin**: Margin around the root element (e.g., '0px 0px -100px 0px' triggers 100px before element is fully visible)

### Animation Behavior
- Elements fade in when entering the viewport
- Elements fade out when leaving the viewport
- Smooth transitions with cubic-bezier easing
- No flash of unstyled content

## Performance Considerations

1. **Intersection Observer**: Uses modern Intersection Observer API for efficient scroll detection
2. **Cleanup**: Properly cleans up observers and timeouts
3. **Throttling**: Built-in throttling through Intersection Observer
4. **Memory Management**: Removes event listeners on component unmount

## Browser Support

- Modern browsers with Intersection Observer support
- Graceful degradation for older browsers (content still visible, just no animations)

## Customization

### Adding New Animation Types
To add new animation types, update the `animationClasses` and `visibleClasses` objects in `BidirectionalAnimatedSection.tsx`:

```tsx
const animationClasses = {
  // existing animations...
  'custom-animation': 'your-hidden-state-classes',
};

const visibleClasses = {
  // existing animations...
  'custom-animation': 'your-visible-state-classes',
};
```

### Global Animation Settings
You can create a configuration file to set default animation settings across your app:

```tsx
// src/config/animations.ts
export const defaultAnimationConfig = {
  duration: 600,
  delay: 0,
  fadeOutDelay: 0,
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px',
};
```

## Troubleshooting

### Animations Not Working
1. Check that the component is properly wrapped
2. Verify intersection observer support
3. Check console for any errors
4. Ensure proper import paths

### Performance Issues
1. Reduce the number of animated elements on a single page
2. Increase threshold values to trigger animations later
3. Use longer delays to stagger animations more

### Content Flashing
1. Ensure proper initial opacity settings
2. Check that CSS transitions are properly applied
3. Verify initialization timing

## Future Enhancements

Potential improvements that could be added:

1. **Parallax Effects**: Add parallax scrolling options
2. **Scroll Progress**: Animations based on scroll progress
3. **Direction Detection**: Different animations for scroll up vs down
4. **Performance Monitoring**: Built-in performance metrics
5. **Animation Presets**: Pre-configured animation combinations
6. **Accessibility**: Respect `prefers-reduced-motion` setting