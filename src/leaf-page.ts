import { defaultLeafOptions, displays, events } from "./constants";
import type { LeafOptions } from "./types";
import { Utils } from "./utils";

interface PageData {
    pageObjs: Record<number, HTMLElement>;
    pages: Record<number, any>;  // Will hold FlipPage instances
    pageWrap: Record<number, HTMLElement>;
    pagePlace: Record<number, number>;
    pageMv: number[];
    totalPages: number;
    tpage?: number;
    page: number;
    display: 'single' | 'double';
    disabled: boolean;
    done: boolean;
}

interface PagePosition {
    top: number;
    left: number | 'auto';
    right: number | 'auto';
    bottom: number | 'auto';
}

const pagePositions: Record<number, PagePosition> = {
    0: { top: 0, left: 0, right: 'auto', bottom: 'auto' },
    1: { top: 0, right: 0, left: 'auto', bottom: 'auto' }
};

const PAGES_IN_DOM = 6;

export class TurnPage {
    private element: HTMLElement;
    private options: LeafOptions;
    private data: PageData;

    constructor(element: HTMLElement, options: Partial<LeafOptions> = {}) {
        this.element = element;
        this.options = { ...defaultLeafOptions, ...options };
        this.data = {
            pageObjs: {},
            pages: {},
            pageWrap: {},
            pagePlace: {},
            pageMv: [],
            totalPages: 0,
            page: this.options.page || 1,
            display: this.options.display || 'double',
            disabled: false,
            done: false
        };

        this.initialize();
    }

    private initialize(): void {
        Utils.getVendorPrefix();
        const has3d = Utils.has3DSupport();

        this.element.style.position = 'relative';
        this.element.style.width = `${this.options.width || this.element.offsetWidth}px`;
        this.element.style.height = `${this.options.height || this.element.offsetHeight}px`;

        // Set up event handlers
        this.setupEventListeners();

        // Initialize display mode
        this.setDisplay(this.options.display || 'double');

        // Apply 3D transform if supported and acceleration is enabled
        if (has3d && !('ontouchstart' in window) && this.options.acceleration) {
            this.element.style.transform = Utils.translate(0, 0, true);
        }

        // Add initial pages
        const children = Array.from(this.element.children);
        for (let i = 0; i < children.length; i++) {
            this.addPage(children[i] as HTMLElement, i + 1);
        }

        // Set initial page
        this.setPage(this.options.page || 1);

        this.data.done = true;
    }

    private setupEventListeners(): void {
        this.element.addEventListener(events.start, this.handleStart.bind(this));
        document.addEventListener(events.move, this.handleMove.bind(this));
        document.addEventListener(events.end, this.handleEnd.bind(this));
    }

    private handleStart(e: Event): void {
        if (this.data.disabled) return;

        const point = this.getEventPoint(e);
        const corner = this.detectCorner(point);

        if (corner) {
            this.startFlip(corner);
        }
    }

    private handleMove(e: Event): void {
        if (this.data.disabled || !this.data.pageMv.length) return;

        const point = this.getEventPoint(e);
        this.updateFlip(point);
    }

    private handleEnd(): void {
        if (this.data.disabled || !this.data.pageMv.length) return;

        this.completeFlip();
    }

    private getEventPoint(e: Event): { x: number, y: number } {
        const event = e as MouseEvent | TouchEvent;
        const rect = this.element.getBoundingClientRect();

        if ('touches' in event) {
            const touch = event.touches[0];
            if (!touch) return { x: 0, y: 0 };
            return {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
        }

        return {
            x: (event as MouseEvent).clientX - rect.left,
            y: (event as MouseEvent).clientY - rect.top
        };
    }

    private detectCorner(point: { x: number; y: number }): string | null {
        const width = this.element.offsetWidth;
        const height = this.element.offsetHeight;
        const cornerSize = 50; // Default corner size

        // Detect which corner was clicked
        if (point.y < cornerSize) {
            if (point.x < cornerSize) return 'tl';
            if (point.x > width - cornerSize) return 'tr';
        } else if (point.y > height - cornerSize) {
            if (point.x < cornerSize) return 'bl';
            if (point.x > width - cornerSize) return 'br';
        }

        return null;
    }

    public addPage(element: HTMLElement, page?: number): this {
        if (!element) return this;

        let incPages = false;
        page = page || this.data.totalPages + 1;

        if (page > this.data.totalPages) {
            this.data.totalPages = page;
            incPages = true;
        }

        // Create page wrapper
        const pageWrapper = document.createElement('div');
        pageWrapper.className = 'turn-page-wrapper';
        pageWrapper.style.position = 'absolute';
        pageWrapper.style.overflow = 'hidden';
        pageWrapper.style.width = `${this.getPageWidth()}px`;
        pageWrapper.style.height = `${this.element.offsetHeight}px`;

        // Add page element to wrapper
        element.style.width = `${this.getPageWidth()}px`;
        element.style.height = `${this.element.offsetHeight}px`;
        pageWrapper.appendChild(element);

        // Store page data
        this.data.pageObjs[page] = element;
        this.data.pageWrap[page] = pageWrapper;
        this.data.pagePlace[page] = page;

        // Add wrapper to DOM
        this.element.appendChild(pageWrapper);

        return this;
    }

    private getPageWidth(): number {
        return this.data.display === 'double'
            ? this.element.offsetWidth / 2
            : this.element.offsetWidth;
    }

    public setDisplay(display: 'single' | 'double'): void {
        if (!displays.includes(display)) {
            throw new Error(`Invalid display mode: ${display}`);
        }

        if (this.data.display === display) return;

        const previousDisplay = this.data.display;
        this.data.display = display;

        if (this.data.done) {
            // Resize pages
            const width = this.getPageWidth();
            Object.values(this.data.pageWrap).forEach(wrapper => {
                wrapper.style.width = `${width}px`;
            });
            Object.values(this.data.pageObjs).forEach(page => {
                page.style.width = `${width}px`;
            });

            // Update page positions
            this.updatePagesPosition();
        }

        this.dispatchEvent('displayChanged', {
            previous: previousDisplay,
            current: display
        });
    }

    private updatePagesPosition(): void {
        const view = this.view();
        for (let page = 1; page <= this.data.totalPages; page++) {
            const wrapper = this.data.pageWrap[page];
            if (!wrapper) continue;

            if (view.includes(page)) {
                const index = this.data.display === 'double' ? page % 2 : 0;
                const position = pagePositions[index];

                // Check if position exists
                if (!position) {
                    console.warn(`No position found for page ${page}`);
                    continue;
                }

                wrapper.style.visibility = 'visible';
                wrapper.style.top = `${position.top}px`;

                // Handle left position
                if (position.left === 'auto') {
                    wrapper.style.left = 'auto';
                } else {
                    wrapper.style.left = `${position.left}px`;
                }

                // Handle right position
                if (position.right === 'auto') {
                    wrapper.style.right = 'auto';
                } else {
                    wrapper.style.right = `${position.right}px`;
                }

                // Handle bottom position
                if (position.bottom === 'auto') {
                    wrapper.style.bottom = 'auto';
                } else {
                    wrapper.style.bottom = `${position.bottom}px`;
                }
            } else {
                wrapper.style.visibility = 'hidden';
            }
        }
    }

    public setPage(pageNumber: number): void {
        if (pageNumber < 1 || pageNumber > this.data.totalPages) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }

        if (this.data.page === pageNumber) return;

        const previousPage = this.data.page;
        this.data.page = pageNumber;

        this.updatePagesPosition();
        this.dispatchEvent('pageChanged', {
            previous: previousPage,
            current: pageNumber
        });
    }

    public next(): void {
        const view = this.view();
        const nextPage = Math.max(...view) + 1;

        if (nextPage <= this.data.totalPages) {
            this.setPage(nextPage);
        }
    }

    public previous(): void {
        const view = this.view();
        const prevPage = Math.min(...view) - 1;

        if (prevPage >= 1) {
            this.setPage(prevPage);
        }
    }

    private view(): number[] {
        const page = this.data.page || 1;

        if (this.data.display === 'double') {
            return page % 2 ? [page, page + 1] : [page - 1, page];
        }

        return [page];
    }

    private dispatchEvent(name: string, detail: any): void {
        const event = new CustomEvent(name, { detail });
        this.element.dispatchEvent(event);
    }

    public destroy(): void {
        // Remove event listeners
        this.element.removeEventListener(events.start, this.handleStart);
        document.removeEventListener(events.move, this.handleMove);
        document.removeEventListener(events.end, this.handleEnd);

        // Remove page wrappers
        Object.values(this.data.pageWrap).forEach(wrapper => wrapper.remove());

        // Clear data
        this.data = {
            pageObjs: {},
            pages: {},
            pageWrap: {},
            pagePlace: {},
            pageMv: [],
            totalPages: 0,
            page: 1,
            display: 'double',
            disabled: false,
            done: false
        };
    }

    private startFlip(corner: string): void {
        if (this.data.disabled || this.data.pageMv.length) return;

        const view = this.view();
        let page: number | undefined;

        if (corner.includes('r')) {
            page = view[0];
        } else {
            page = view[view.length - 1];
        }

        // Early return if no valid page
        if (typeof page !== 'number') return;

        // Get wrapper and check if it exists
        const wrapper = this.data.pageWrap[page];
        if (!wrapper) return;

        const nextPage = corner.includes('r') ? page + 1 : page - 1;

        // Check if next page exists
        if (nextPage < 1 || nextPage > this.data.totalPages) return;

        // Add page to movement array
        this.data.pageMv = [page];

        // Prepare wrapper for animation
        wrapper.style.zIndex = String(this.data.totalPages);
        wrapper.style.visibility = 'visible';

        // Calculate initial fold position
        const width = this.getPageWidth();
        const height = this.element.offsetHeight;
        const initialFold = this.calculateFoldPosition(corner, { x: 0, y: 0 }, width, height);

        // Apply initial transform
        this.applyFoldTransform(wrapper, initialFold);

        // Dispatch event
        this.dispatchEvent('flipStart', { page, corner });
    }

    private calculateFoldPosition(corner: string, point: { x: number; y: number }, width: number, height: number): {
        x: number;
        y: number;
        angle: number;
    } {
        let x = 0, y = 0;
        let angle = 0;

        switch (corner) {
            case 'tl':
                x = point.x || 0;
                y = point.y || 0;
                angle = Math.atan2(y, x);
                break;
            case 'tr':
                x = (point.x || width) - width;
                y = point.y || 0;
                angle = Math.atan2(y, x);
                break;
            case 'bl':
                x = point.x || 0;
                y = (point.y || height) - height;
                angle = Math.atan2(y, x);
                break;
            case 'br':
                x = (point.x || width) - width;
                y = (point.y || height) - height;
                angle = Math.atan2(y, x);
                break;
            default:
                // Default case to handle all possible corner values
                console.warn(`Unexpected corner value: ${corner}`);
        }

        return { x, y, angle };
    }

    private updateFlip(point: { x: number; y: number }): void {
        if (!this.data.pageMv.length) return;

        const page = this.data.pageMv[0];

        // Type guard for page
        if (typeof page !== 'number') return;

        const wrapper = this.data.pageWrap[page];
        if (!wrapper) return;

        const width = this.getPageWidth();
        const height = this.element.offsetHeight;
        const corner = this.detectCorner(point);

        if (!corner) return;

        const fold = this.calculateFoldPosition(corner, point, width, height);
        this.applyFoldTransform(wrapper, fold);

        // Dispatch event
        this.dispatchEvent('flipMove', { page, progress: Math.abs(fold.x) / width });
    }

    private applyFoldTransform(wrapper: HTMLElement, fold: { x: number; y: number; angle: number }): void {
        const rad2deg = (rad: number) => (rad * 180) / Math.PI;

        // Calculate transform origin based on fold position
        const origin = `${fold.x}px ${fold.y}px`;

        // Calculate rotation angle
        const rotation = rad2deg(fold.angle);

        // Apply transforms with proper vendor prefixes
        wrapper.style.transformOrigin = origin;
        wrapper.style.webkitTransformOrigin = origin;

        const transform = `rotate(${rotation}deg)`;

        if (this.options.acceleration) {
            wrapper.style.transform = transform + ' translateZ(0)';
            wrapper.style.webkitTransform = transform + ' translateZ(0)';
        } else {
            wrapper.style.transform = transform;
            wrapper.style.webkitTransform = transform;
        }
    }

    private completeFlip(): void {
        if (!this.data.pageMv.length) return;

        const page = this.data.pageMv[0];

        // Type guard for page
        if (typeof page !== 'number') return;

        const wrapper = this.data.pageWrap[page];
        if (!wrapper) return;

        const duration = this.options.duration || 600;

        // Add transition
        wrapper.style.transition = `all ${duration}ms ease-out`;
        wrapper.style.webkitTransition = `all ${duration}ms ease-out`;

        // Reset transform
        wrapper.style.transform = 'none';
        wrapper.style.webkitTransform = 'none';

        // Update page number if needed
        const nextPage = this.data.display === 'double'
            ? (page % 2 === 0 ? page - 1 : page + 1)
            : page;

        if (nextPage >= 1 && nextPage <= this.data.totalPages) {
            this.setPage(nextPage);
        }

        // Clear movement array
        this.data.pageMv = [];

        // Remove transition after animation
        setTimeout(() => {
            if (wrapper) {
                wrapper.style.transition = '';
                wrapper.style.webkitTransition = '';
            }
        }, duration);

        // Dispatch event
        this.dispatchEvent('flipComplete', { page });
    }
}