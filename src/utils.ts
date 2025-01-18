import type { Point2D } from "./types";

export class Utils {
    private static vendor = '';
    private static has3d?: boolean;

    static getVendorPrefix(): string {
        if (this.vendor) return this.vendor;

        // Use a more reliable check for vendor prefix
        const styles = window.getComputedStyle(document.documentElement, '');
        const vendors = ['-webkit-', '-moz-', '-ms-', '-o-', ''];
        const prefix = Array.from(styles).find(p =>
            styles.getPropertyValue(`${p}transform`) !== undefined
        ) || '';

        this.vendor = prefix;
        return prefix;
    }

    static has3DSupport(): boolean {
        if (this.has3d !== undefined) return this.has3d;

        // More comprehensive 3D support check
        const el = document.createElement('div');
        document.body.appendChild(el);
        el.style.transform = 'translate3d(1px,1px,1px)';

        const has3d = window.getComputedStyle(el).transform.includes('3d');
        document.body.removeChild(el);

        this.has3d = has3d;
        return has3d;
    }

    // Add CSS transform functions
    static translate(x: number, y: number, use3d: boolean): string {
        return this.has3DSupport() && use3d
            ? `translate3d(${x}px, ${y}px, 0px)`
            : `translate(${x}px, ${y}px)`;
    }

    static rotate(degrees: number): string {
        return `rotate(${degrees}deg)`;
    }

    static createPoint2D(x: number, y: number): Point2D {
        return {
            x: Math.round(x * 1000) / 1000,
            y: Math.round(y * 1000) / 1000
        };
    }

    // Add transform combine helper
    static transform(...transforms: string[]): string {
        return transforms.join(' ');
    }

    // Add memoization for expensive calculations
    private static memoizedBezier = new Map<string, Point2D>();

    static bezier(p1: Point2D, p2: Point2D, p3: Point2D, p4: Point2D, t: number): Point2D {
        const key = `${p1.x},${p1.y},${p2.x},${p2.y},${p3.x},${p3.y},${p4.x},${p4.y},${t}`;
        if (this.memoizedBezier.has(key)) {
            return this.memoizedBezier.get(key)!;
        }

        const mum1 = 1 - t;
        const mum13 = mum1 * mum1 * mum1;
        const mu3 = t * t * t;

        const point = this.createPoint2D(
            mum13 * p1.x + 3 * t * mum1 * mum1 * p2.x + 3 * t * t * mum1 * p3.x + mu3 * p4.x,
            mum13 * p1.y + 3 * t * mum1 * mum1 * p2.y + 3 * t * t * mum1 * p3.y + mu3 * p4.y
        );

        this.memoizedBezier.set(key, point);
        return point;
    }

    // Add cleanup method for memoization
    static clearMemoization(): void {
        this.memoizedBezier.clear();
    }
}