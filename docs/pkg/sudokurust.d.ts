/* tslint:disable */
/* eslint-disable */

/**
 * 0はNone、1-9は0-8としてエンコードされた81バイトの入力を受け取り、
 * 解決された場合は同様にエンコードされた81バイトのベクターを返す。
 */
export class SolveResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly board: Uint8Array | undefined;
    readonly call_cnt: number;
    readonly solved: boolean;
}

export function solve_wasm(input: Uint8Array): SolveResult;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_solveresult_free: (a: number, b: number) => void;
    readonly solve_wasm: (a: number, b: number) => number;
    readonly solveresult_board: (a: number) => [number, number];
    readonly solveresult_call_cnt: (a: number) => number;
    readonly solveresult_solved: (a: number) => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
