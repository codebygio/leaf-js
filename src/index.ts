import { FlipPage } from "./flip-page";
import { TurnPage } from "./leaf-page";
import type { FlipOptions, LeafOptions } from "./types";

export function createTurnPage(element: HTMLElement, options?: Partial<LeafOptions>): TurnPage {
    return new TurnPage(element, options);
}

export function createFlipPage(element: HTMLElement, options?: Partial<FlipOptions>): FlipPage {
    return new FlipPage(element, options);
}