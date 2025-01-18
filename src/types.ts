// Define the corner literals
export type Corner = 'tl' | 'tr' | 'bl' | 'br';

// Define the direction literals
export type CornerDirection = 'backward' | 'forward' | 'all';

// Define corners array type
export type CornerArray = Corner[];

export interface LeafOptions {
    // First page
    page?: number;

    // Pages count
    pages?: number;

    // Element dimensions
    width?: number;
    height?: number;

    // Enables gradients
    gradients?: boolean;

    // Duration of transition in milliseconds
    duration?: number;

    // Enables hardware acceleration
    acceleration?: boolean;

    // Display mode: 'single' or 'double'
    display?: 'single' | 'double';

    // Event handlers
    when?: Record<string, (event: Event) => void>;

    // Custom corners configuration
    corners?: {
        [key in CornerDirection]?: CornerArray;
    };
}

export interface FlipOptions {
    // Back page
    folding?: HTMLElement | null;

    // Corners: 'backward', 'forward', or 'all'
    corners?: 'backward' | 'forward' | 'all';

    // Size of the active zone of each corner
    cornerSize?: number;

    // Enables gradients
    gradients?: boolean;

    // Duration of transition in milliseconds
    duration?: number;

    // Enables hardware acceleration
    acceleration?: boolean;
}

export interface Point2D {
    x: number;
    y: number;
}

