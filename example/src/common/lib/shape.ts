type Key = string | number | symbol;
export type StructureKey = Key;
export type Shape = readonly StructureKey[];

const PATH = Symbol("@@path");
const ROOT = Symbol("@@root");
const TYPE = Symbol("@@type");

export type ShapeRef<V> = {
  readonly [PATH]: readonly Key[];
  readonly [ROOT]: unknown;
  readonly [TYPE]: V;
};

type ArrayProxy<T> = ShapeRef<T[]> & { [index: number]: StructureProxy<T> };

export type StructureProxy<T> = T extends (infer U)[]
  ? ArrayProxy<U> & { readonly $type: T }
  : T extends object
    ? ShapeRef<T> &
        { readonly $type: T } & {
          [K in keyof T]: T[K] extends (infer A)[]
            ? ArrayProxy<A> & { readonly $type: T[K] }
            : T[K] extends object
              ? StructureProxy<T[K]> & { readonly $type: T[K] }
              : ShapeRef<T[K]> & { readonly $type: T[K] };
        }
    : ShapeRef<T> & { readonly $type: T };

export function createShape<T>(root: T): StructureProxy<T> {
  return buildProxy(root, []) as StructureProxy<T>;
}

function buildProxy<T>(root: T, path: Key[]): any {
  const base = { [ROOT]: root, [PATH]: path } as any;
  Object.defineProperty(base, "$type", {
    get() {
      return undefined;
    },
  });
  return new Proxy(base, {
    get(target, prop: Key) {
      if (prop === ROOT || prop === PATH || prop === "$type") {
        return target[prop];
      }
      return buildProxy(root, [...path, prop]);
    },
  });
}

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function access(root: any, path: Key[]) {
  return path.reduce((acc, key) => (acc == null ? acc : acc[key as any]), root);
}

function assignMutable(root: any, path: Key[], value: unknown) {
  let cursor = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (cursor[key] == null) {
      cursor[key] = typeof path[i + 1] === "number" ? [] : {};
    }
    cursor = cursor[key];
  }
  cursor[path[path.length - 1]] = value;
}

function assignImmutable<T>(root: T, path: Key[], value: unknown): T {
  const cloned: any = Array.isArray(root) ? [...(root as any)] : { ...(root as any) };
  let cursor: any = cloned;
  let original: any = root;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    cursor[key] = Array.isArray(original[key]) ? [...original[key]] : { ...original[key] };
    cursor = cursor[key];
    original = original[key];
  }

  cursor[path[path.length - 1]] = value;
  return cloned;
}

export function readValue<V>(ref: ShapeRef<V>): V {
  return access((ref as any)[ROOT], (ref as any)[PATH]);
}

export function writeValue<V>(ref: ShapeRef<V>, next: V): void;
export function writeValue<V>(ref: ShapeRef<V>, fn: (prev: V) => V): void;
export function writeValue<V, T>(ref: ShapeRef<V>, next: V, root: T): T;
export function writeValue<V, T>(
  ref: ShapeRef<V>,
  fn: (prev: V) => V,
  root: T
): T;
export function writeValue<V, T>(
  ref: ShapeRef<V>,
  nextOrFn: V | ((prev: V) => V),
  root?: T
): void | T {
  const path = (ref as any)[PATH] as Key[];
  const base = root ?? (ref as any)[ROOT];
  const prev = access(base, path) as V;
  const next = typeof nextOrFn === "function" ? (nextOrFn as (v: V) => V)(prev) : nextOrFn;

  return root === undefined
    ? assignMutable(base, path, next)
    : assignImmutable(base, path, next);
}

export function mergeValue<V extends object>(
  ref: ShapeRef<V>,
  partial: Partial<V>
): void;
export function mergeValue<V extends object>(
  ref: ShapeRef<V>,
  fn: (prev: V) => Partial<V>
): void;
export function mergeValue<V extends object, T>(
  ref: ShapeRef<V>,
  partial: Partial<V>,
  root: T
): T;
export function mergeValue<V extends object, T>(
  ref: ShapeRef<V>,
  fn: (prev: V) => Partial<V>,
  root: T
): T;
export function mergeValue<V extends object, T>(
  ref: ShapeRef<V>,
  partialOrFn: Partial<V> | ((prev: V) => Partial<V>),
  root?: T
): void | T {
  const path = (ref as any)[PATH] as Key[];
  const base = root ?? (ref as any)[ROOT];
  const prev = access(base, path) as V;

  const patchObject =
    typeof partialOrFn === "function"
      ? (partialOrFn as (p: V) => Partial<V>)(prev)
      : partialOrFn;

  if (!isObject(prev) || !isObject(patchObject)) {
    return root === undefined
      ? assignMutable(base, path, patchObject as any)
      : assignImmutable(root, path, patchObject as any);
  }

  const merged = { ...prev, ...patchObject };
  return root === undefined
    ? assignMutable(base, path, merged)
    : assignImmutable(root, path, merged);
}

export function getShape<V>(ref: ShapeRef<V>): Shape {
  return (ref as any)[PATH];
}

export function setShape<T>(
  root: T,
  path: Shape,
  value: unknown
): T {
  return assignImmutable(root, path as Key[], value);
}
