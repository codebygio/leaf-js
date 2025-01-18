import type { Corner, CornerDirection, FlipOptions, LeafOptions } from "./types";

export const PI = Math.PI;
export const A90 = PI / 2;
export const isTouch = 'ontouchstart' in window;

export const events: {
    readonly start: string;
    readonly move: string;
    readonly end: string;
} = isTouch
        ? { start: 'touchstart', move: 'touchmove', end: 'touchend' }
        : { start: 'mousedown', move: 'mousemove', end: 'mouseup' };

export const defaultCorners: Record<CornerDirection, Corner[]> = {
    backward: ['bl', 'tl'],
    forward: ['br', 'tr'],
    all: ['tl', 'bl', 'tr', 'br']
} as const;

export const displays = ['single', 'double'] as const;


export const defaultLeafOptions: LeafOptions = {
    page: 1,
    gradients: true,
    duration: 600,
    acceleration: true,
    display: 'double',
    when: undefined
};

export const defaultFlipOptions: FlipOptions = {
    folding: null,
    corners: 'forward',
    cornerSize: 100,
    gradients: true,
    duration: 600,
    acceleration: true
};

