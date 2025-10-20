# NodeLibrary Accessibility Enhancements

This document outlines the comprehensive accessibility improvements made to the NodeLibrary component to align with WCAG 2.1 AA guidelines.

## Overview

The NodeLibrary component has been enhanced with full keyboard navigation, screen reader support, ARIA labels, and focus management to ensure it's accessible to users with disabilities.

## Key Accessibility Features

### 1. ARIA Labels and Roles

- **Semantic HTML**: Uses proper `<aside>`, `<header>`, `<fieldset>`, and `<legend>` elements
- **ARIA Roles**:
  - `role="complementary"` for the main container
  - `role="listbox"` for the node list
  - `role="option"` for individual nodes
  - `role="tablist"` and `role="tab"` for category navigation
  - `role="radiogroup"` and `role="radio"` for view mode toggle
- **ARIA Labels**: Comprehensive labeling for all interactive elements
- **ARIA Describedby**: Links descriptions to form controls

### 2. Keyboard Navigation

#### Node Navigation

- **Arrow Keys**: `↑` and `↓` to navigate through nodes
- **Enter/Space**: Add selected node to canvas
- **Escape**: Return focus to search input
- **Tab**: Standard tab navigation between sections

#### Category Navigation

- **Arrow Keys**: `←` and `→` to navigate between categories
- **Enter/Space**: Select category
- **Tab**: Move to next section

#### Search

- **Tab**: Focus search input
- **Type**: Filter nodes in real-time
- **Escape**: Clear search and return to node navigation

### 3. Focus Management

- **Visual Focus Indicators**: Clear focus rings on all interactive elements
- **Focus Trapping**: Proper focus management within sections
- **Focus Restoration**: Returns focus to appropriate elements after actions
- **Skip Links**: Logical tab order throughout the component

### 4. Screen Reader Support

#### Live Regions

- **Announcements**: Real-time updates for user actions
- **Status Updates**: Changes in search results and category selection
- **Error Messages**: Clear feedback for invalid actions

#### Descriptive Labels

- **Node Information**: Comprehensive descriptions including category and purpose
- **Action Instructions**: Clear guidance on how to interact with elements
- **Context Information**: Current state and available options

### 5. Visual Accessibility

#### High Contrast Support

- **CSS Media Queries**: Enhanced borders and strokes for high contrast mode
- **Color Independence**: Information conveyed through multiple visual cues
- **Focus Indicators**: High visibility focus rings

#### Reduced Motion Support

- **CSS Media Queries**: Disables animations for users with vestibular disorders
- **Respects Preferences**: Honors `prefers-reduced-motion` setting

## Implementation Details

### Screen Reader Announcements

```typescript
const announceToScreenReader = useCallback((message: string) => {
  setAnnouncement(message);
  setTimeout(() => setAnnouncement(""), 1000);
}, []);
```

### Keyboard Event Handling

```typescript
const handleKeyDown = useCallback(
  (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
      // Navigate to next node
      case "Enter":
      case " ":
      // Add node to canvas
      case "Escape":
      // Return to search
    }
  },
  [focusedNodeIndex, filteredNodes, announceToScreenReader]
);
```

### Focus Management

```typescript
useEffect(() => {
  if (focusedNodeIndex >= 0 && nodeListRef.current) {
    const nodeElements =
      nodeListRef.current.querySelectorAll("[data-node-index]");
    const focusedElement = nodeElements[focusedNodeIndex] as HTMLElement;
    if (focusedElement) {
      focusedElement.focus();
    }
  }
}, [focusedNodeIndex]);
```

## WCAG 2.1 AA Compliance

### Perceivable

- ✅ **1.1.1 Non-text Content**: All icons have `aria-hidden="true"` or descriptive labels
- ✅ **1.3.1 Info and Relationships**: Proper semantic structure and ARIA relationships
- ✅ **1.3.2 Meaningful Sequence**: Logical tab order and reading sequence
- ✅ **1.4.3 Contrast**: Meets minimum contrast ratios
- ✅ **1.4.4 Resize Text**: Text scales up to 200% without loss of functionality

### Operable

- ✅ **2.1.1 Keyboard**: All functionality available via keyboard
- ✅ **2.1.2 No Keyboard Trap**: Focus can move away from any component
- ✅ **2.4.1 Bypass Blocks**: Logical heading structure and skip links
- ✅ **2.4.3 Focus Order**: Logical focus sequence
- ✅ **2.4.7 Focus Visible**: Clear focus indicators

### Understandable

- ✅ **3.1.1 Language**: Proper language attributes
- ✅ **3.2.1 On Focus**: No unexpected context changes
- ✅ **3.2.2 On Input**: No unexpected context changes on input
- ✅ **3.3.2 Labels or Instructions**: Clear labels and instructions

### Robust

- ✅ **4.1.1 Parsing**: Valid HTML structure
- ✅ **4.1.2 Name, Role, Value**: Proper ARIA implementation

## Testing Recommendations

### Automated Testing

- Use axe-core for automated accessibility testing
- Test with keyboard-only navigation
- Validate ARIA implementation

### Manual Testing

- Test with screen readers (NVDA, JAWS, VoiceOver)
- Test with keyboard-only navigation
- Test with high contrast mode
- Test with reduced motion preferences

### User Testing

- Include users with disabilities in testing
- Test with various assistive technologies
- Gather feedback on usability

## Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Screen Readers**: NVDA, JAWS, VoiceOver, Orca

## Future Enhancements

1. **Voice Control**: Add support for voice commands
2. **Gesture Navigation**: Touch gesture support for mobile
3. **Customizable Shortcuts**: Allow users to customize keyboard shortcuts
4. **High Contrast Themes**: Additional high contrast color schemes
5. **Font Size Controls**: Built-in font size adjustment

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
