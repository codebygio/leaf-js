import {
    defaultFlipOptions,
    type FlipOptions,
    type Point2D,
    events,
    PI,
} from "./types";

interface FlipData {
    wrapper?: HTMLElement;
    fwrapper?: HTMLElement;
    fpage?: HTMLElement;
    parent?: HTMLElement;
    fparent?: HTMLElement;
    shadow?: HTMLElement;
    point?: Point2D & { corner: string };
    effect?: {
        handle: number;
    };
    opts: FlipOptions;
}

export class FlipPage {
    private element: HTMLElement;
    private options: FlipOptions;
    private data: FlipData;
    private isTurning: boolean = false;
    private isDisabled: boolean = false;

    constructor(element: HTMLElement, options: Partial<FlipOptions> = {}) {
        this.element = element;
        this.options = { ...defaultFlipOptions, ...options };
        this.data = { opts: this.options };
        this.initialize();
    }

    private initialize(): void {
        this.setupWrapper();
        this.setupEventListeners();
    }

    private setupWrapper(): void {
        const parent = this.element.parentElement;
        if (!parent) throw new Error("Element must have a parent");

        // Create main wrapper
        const wrapper = document.createElement('div');
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = '0';
        parent.appendChild(wrapper);

        // Create flip wrapper
        const fwrapper = document.createElement('div');
        fwrapper.style.position = 'absolute';
        fwrapper.style.zIndex = '0';
        fwrapper.style.visibility = 'hidden';
        parent.appendChild(fwrapper);

        // Create flipping page
        const fpage = document.createElement('div');
        fpage.style.cursor = 'default';
        fwrapper.appendChild(fpage);

        // Store elements
        this.data.wrapper = wrapper;
        this.data.fwrapper = fwrapper;
        this.data.fpage = fpage;
        this.data.parent = parent;

        // Setup gradient if enabled
        if (this.options.gradients) {
            const shadow = document.createElement('div');
            shadow.style.position = 'absolute';
            shadow.style.top = '0';
            shadow.style.left = '0';
            shadow.style.width = '100%';
            shadow.style.height = '100%';
            this.data.shadow = shadow;
            fpage.appendChild(shadow);
        }

        this.resize();
    }

    private setupEventListeners(): void {
        if (!this.data.fpage) return;

        this.data.fpage.addEventListener(events.start, this.handleStart.bind(this));
        document.addEventListener(events.move, this.handleMove.bind(this));
        document.addEventListener(events.end, this.handleEnd.bind(this));
    }

    private handleStart(e: Event): void {
        if (this.isDisabled || this.isTurning) return;

        const point = this.getPoint(e as MouseEvent | TouchEvent);
        const corner = this.detectCorner(point);

        if (corner) {
            this.data.point = { ...point, corner };
            this.isTurning = true;
            this.element.dispatchEvent(new CustomEvent('flipstart', { detail: { point: this.data.point } }));
        }
    }

    private handleMove(e: Event): void {
        if (!this.data.point || !this.isTurning) return;

        const point = this.getPoint(e as MouseEvent | TouchEvent);
        this.updateFlip(point);
    }

    private handleEnd(): void {
        if (!this.data.point || !this.isTurning) return;

        this.isTurning = false;
        this.completeFlip();
        this.data.point = undefined;

        this.element.dispatchEvent(new CustomEvent('flipend'));
    }

    private getPoint(e: MouseEvent | TouchEvent): Point2D {
        if ('touches' in e) {
            const touch = e.touches[0];
            if (!touch) return { x: 0, y: 0 }; // Return default if no touch found

            const rect = this.element.getBoundingClientRect();
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }

        const rect = this.element.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    private detectCorner(point: Point2D): string | null {
        const { cornerSize, corners } = this.options;
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;

        if (!cornerSize) return null;

        // Define allowed corners based on the corners option
        let allowedCorners: string[];
        if (typeof corners === 'string') {
            switch (corners) {
                case 'forward':
                    allowedCorners = ['br', 'tr'];
                    break;
                case 'backward':
                    allowedCorners = ['bl', 'tl'];
                    break;
                case 'all':
                    allowedCorners = ['tl', 'bl', 'tr', 'br'];
                    break;
                default:
                    allowedCorners = ['br', 'tr']; // Default to forward
            }
        } else {
            allowedCorners = ['br', 'tr']; // Default to forward corners
        }

        // Check corners
        if (point.y < cornerSize) {
            if (point.x < cornerSize && allowedCorners.includes('tl')) return 'tl';
            if (point.x > width - cornerSize && allowedCorners.includes('tr')) return 'tr';
        } else if (point.y > height - cornerSize) {
            if (point.x < cornerSize && allowedCorners.includes('bl')) return 'bl';
            if (point.x > width - cornerSize && allowedCorners.includes('br')) return 'br';
        }

        return null;
    }

    private updateFlip(point: Point2D): void {
        if (!this.data.point) return;

        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;
        const corner = this.data.point.corner;

        // Calculate fold angle
        let angle = Math.atan2(point.y - this.data.point.y, point.x - this.data.point.x);

        // Adjust angle based on corner
        if (corner.charAt(0) === 'b') angle += PI;

        // Calculate fold position
        const fold = {
            x: width - (Math.cos(angle) * width),
            y: height - (Math.sin(angle) * height)
        };

        this.applyTransform(fold, angle);
    }

    private applyTransform(fold: Point2D, angle: number): void {
        if (!this.data.fpage) return;

        const matrix = [
            Math.cos(angle), Math.sin(angle),
            -Math.sin(angle), Math.cos(angle),
            fold.x, fold.y
        ];

        const transform = this.options.acceleration
            ? `matrix3d(${matrix.join(',')},0,0,0,0,1)`
            : `matrix(${matrix.join(',')})`;

        this.data.fpage.style.transform = transform;

        // Update shadow if gradients are enabled
        if (this.options.gradients && this.data.shadow) {
            const intensity = 0.5 - Math.abs(angle) / (2 * PI);
            this.data.shadow.style.background =
                `linear-gradient(to right, 
                    rgba(0,0,0,${0.5 - intensity}), 
                    rgba(0,0,0,0) 100%)`;
        }
    }

    private completeFlip(): void {
        if (!this.data.fpage) return;

        const duration = this.options.duration || 600;

        // Animate to final position
        this.data.fpage.style.transition = `transform ${duration}ms ease-out`;
        this.data.fpage.style.transform = 'none';

        setTimeout(() => {
            if (this.data.fpage) {
                this.data.fpage.style.transition = '';
            }
        }, duration);
    }

    public resize(): void {
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;
        const size = Math.sqrt(width * width + height * height);

        if (this.data.wrapper) {
            this.data.wrapper.style.width = `${size}px`;
            this.data.wrapper.style.height = `${size}px`;
        }

        if (this.data.fwrapper) {
            this.data.fwrapper.style.width = `${size}px`;
            this.data.fwrapper.style.height = `${size}px`;
        }
    }

    public flip(corner: string): void {
        if (this.isDisabled || this.isTurning) return;

        const point = this.getDefaultCornerPoint(corner);
        if (!point) return;

        this.data.point = { ...point, corner };
        this.isTurning = true;
        this.updateFlip(point);
    }

    private getDefaultCornerPoint(corner: string): Point2D | null {
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;

        switch (corner) {
            case 'tl': return { x: 0, y: 0 };
            case 'tr': return { x: width, y: 0 };
            case 'bl': return { x: 0, y: height };
            case 'br': return { x: width, y: height };
            default: return null;
        }
    }

    public disable(disabled: boolean): void {
        this.isDisabled = disabled;
    }

    public destroy(): void {
        // Remove event listeners
        if (this.data.fpage) {
            this.data.fpage.removeEventListener(events.start, this.handleStart.bind(this));
        }
        document.removeEventListener(events.move, this.handleMove.bind(this));
        document.removeEventListener(events.end, this.handleEnd.bind(this));

        // Remove elements
        this.data.wrapper?.remove();
        this.data.fwrapper?.remove();
    }
}