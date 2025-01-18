# Leaf Flip

A modern TypeScript library for creating realistic page turn effects in web applications. Inspired by turn.js, but rebuilt from the ground up with TypeScript and modern web standards.

## Installation

```bash
npm install leaf-flip
```

## Basic Usage

### HTML Structure
```html
<div id="book">
    <div>Page 1</div>
    <div>Page 2</div>
    <div>Page 3</div>
    <div>Page 4</div>
</div>
```

### JavaScript/TypeScript
```typescript
import { createTurnPage } from 'leaf-flip';

const element = document.getElementById('book');
const book = createTurnPage(element, {
    display: 'double',
    gradients: true,
    acceleration: true
});
```

## API Reference

### TurnPage Options

```typescript
interface LeafOptions {
    page?: number;           // Initial page number
    pages?: number;          // Total number of pages
    width?: number;          // Container width
    height?: number;         // Container height
    gradients?: boolean;     // Enable shadow gradients
    duration?: number;       // Animation duration (ms)
    acceleration?: boolean;  // Enable hardware acceleration
    display?: 'single' | 'double'; // Page display mode
    when?: Record<string, (event: Event) => void>; // Event handlers
    corners?: {             // Custom corner configuration
        backward?: Corner[];
        forward?: Corner[];
        all?: Corner[];
    };
}
```

### FlipPage Options

```typescript
interface FlipOptions {
    folding?: HTMLElement | null;  // Element to fold
    corners?: 'backward' | 'forward' | 'all';  // Allowed corners
    cornerSize?: number;    // Corner sensitivity size
    gradients?: boolean;    // Enable shadow gradients
    duration?: number;      // Animation duration
    acceleration?: boolean; // Enable hardware acceleration
}
```

### Methods

#### TurnPage Methods
```typescript
book.next();               // Go to next page
book.previous();           // Go to previous page
book.setPage(number);      // Go to specific page
book.setDisplay('single'); // Change display mode
book.destroy();            // Clean up resources
```

#### FlipPage Methods
```typescript
page.flip('tr');          // Flip top-right corner
page.disable(true);       // Disable interactions
page.resize();            // Update dimensions
page.destroy();           // Clean up resources
```

### Events

```typescript
book.element.addEventListener('pageChanged', (e) => {
    console.log('Current page:', e.detail.current);
    console.log('Previous page:', e.detail.previous);
});

page.element.addEventListener('flipStart', (e) => {
    console.log('Flip started:', e.detail);
});
```

## Examples

### Double Page Book
```typescript
import { createTurnPage } from 'leaf-flip';

const book = createTurnPage(element, {
    display: 'double',
    gradients: true,
    duration: 600,
    when: {
        turned: (event) => {
            console.log('Page turned!');
        }
    }
});
```

### Single Page Flip
```typescript
import { createFlipPage } from 'leaf-flip';

const page = createFlipPage(element, {
    corners: 'all',
    cornerSize: 100,
    gradients: true
});
```

## License

MIT © [Giovani Rodriguez](https://github.com/codebygio)