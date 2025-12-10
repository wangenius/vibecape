/**
 * @fileoverview Shape - 类型安全的嵌套对象路径访问与修改模块
 *
 * 本模块提供了一种类型安全的方式来访问和修改深层嵌套的对象结构。
 * 通过 Proxy 代理机制，它能够追踪属性访问路径，并在编译时提供完整的类型推断。
 *
 * @description
 * 核心概念：
 * - **Shape**: 表示对象中某个位置的路径（键数组）
 * - **ShapeRef**: 包含路径信息和根对象引用的代理对象
 * - **StructureProxy**: 递归代理类型，支持链式属性访问
 *
 * 主要功能：
 * - `createShape`: 创建类型安全的结构代理
 * - `readValue`: 从代理引用读取值
 * - `writeValue`: 写入值（支持可变/不可变模式）
 * - `mergeValue`: 合并对象值
 * - `getShape`/`setShape`: 直接操作路径
 *
 * @example
 * ```typescript
 * interface User {
 *   name: string;
 *   profile: { age: number; city: string };
 *   tags: string[];
 * }
 *
 * const user: User = {
 *   name: "Alice",
 *   profile: { age: 25, city: "Beijing" },
 *   tags: ["dev", "ts"]
 * };
 *
 * // 创建类型安全的代理
 * const shape = createShape(user);
 *
 * // 读取嵌套值 - 完全类型安全
 * const age = readValue(shape.profile.age); // number
 *
 * // 可变写入（直接修改原对象）
 * writeValue(shape.profile.city, "Shanghai");
 *
 * // 不可变写入（返回新对象，原对象不变）
 * const newUser = writeValue(shape.name, "Bob", user);
 *
 * // 合并对象
 * mergeValue(shape.profile, { age: 26 });
 * ```
 *
 * @module shape
 */

/* ============================================================================
 * 类型定义
 * ============================================================================ */

/**
 * 对象键的基础类型
 * 支持字符串、数字和 Symbol 类型的键
 */
type Key = string | number | symbol;

/**
 * 结构键类型（对外导出）
 * 用于表示对象路径中的单个键
 */
export type StructureKey = Key;

/**
 * Shape 类型 - 表示对象中某个位置的完整路径
 * 是一个只读的键数组，例如 ['profile', 'age'] 表示 obj.profile.age
 */
export type Shape = readonly StructureKey[];

/* ============================================================================
 * 内部 Symbol 常量
 * 用于在代理对象中存储元数据，避免与用户属性冲突
 * ============================================================================ */

/** 存储当前代理的访问路径 */
const PATH = Symbol("@@path");

/** 存储原始根对象的引用 */
const ROOT = Symbol("@@root");

/** 存储类型信息（仅用于类型推断，运行时不使用） */
const TYPE = Symbol("@@type");

/* ============================================================================
 * 代理类型定义
 * ============================================================================ */

/**
 * ShapeRef - 形状引用类型
 * 包含路径、根对象引用和类型信息的代理对象基础类型
 *
 * @template V - 该引用指向的值的类型
 *
 * @property {readonly Key[]} [PATH] - 从根到当前位置的路径
 * @property {unknown} [ROOT] - 原始根对象的引用
 * @property {V} [TYPE] - 类型标记（仅用于类型推断）
 */
export type ShapeRef<V> = {
  readonly [PATH]: readonly Key[];
  readonly [ROOT]: unknown;
  readonly [TYPE]: V;
};

/**
 * ArrayProxy - 数组代理类型
 * 扩展 ShapeRef 以支持数字索引访问
 *
 * @template T - 数组元素的类型
 */
type ArrayProxy<T> = ShapeRef<T[]> & { [index: number]: StructureProxy<T> };

/**
 * StructureProxy - 结构代理类型（核心类型）
 *
 * 递归类型定义，为任意嵌套对象结构提供完整的类型推断：
 * - 数组类型 → ArrayProxy（支持索引访问）
 * - 对象类型 → 递归代理（支持属性访问）
 * - 基础类型 → ShapeRef（叶子节点）
 *
 * @template T - 被代理的对象类型
 *
 * @example
 * ```typescript
 * interface Data { items: { id: number }[] }
 * const proxy: StructureProxy<Data>;
 * // proxy.items → ArrayProxy<{ id: number }>
 * // proxy.items[0] → StructureProxy<{ id: number }>
 * // proxy.items[0].id → ShapeRef<number>
 * ```
 */
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

/* ============================================================================
 * 代理创建函数
 * ============================================================================ */

/**
 * 创建类型安全的结构代理
 *
 * 返回一个代理对象，可以通过链式属性访问来构建路径引用。
 * 每次属性访问都会返回一个新的代理，记录完整的访问路径。
 *
 * @template T - 根对象的类型
 * @param root - 要创建代理的根对象
 * @returns 类型安全的结构代理
 *
 * @example
 * ```typescript
 * const data = { user: { name: "Alice" } };
 * const shape = createShape(data);
 *
 * // shape.user.name 是一个 ShapeRef<string>
 * // 它记录了路径 ['user', 'name'] 和根对象引用
 * ```
 */
export function createShape<T>(root: T): StructureProxy<T> {
  return buildProxy(root, []) as StructureProxy<T>;
}

/**
 * 内部函数：递归构建代理对象
 *
 * 使用 Proxy 拦截属性访问，每次访问都返回一个新的代理，
 * 并将访问的属性名追加到路径中。
 *
 * @param root - 根对象引用
 * @param path - 当前累积的路径
 * @returns Proxy 代理对象
 */
function buildProxy<T>(root: T, path: Key[]): any {
  // 创建基础对象，存储根引用和当前路径
  const base = { [ROOT]: root, [PATH]: path } as any;

  // 定义 $type 属性（仅用于类型推断，运行时返回 undefined）
  Object.defineProperty(base, "$type", {
    get() {
      return undefined;
    },
  });

  // 返回 Proxy，拦截所有属性访问
  return new Proxy(base, {
    get(target, prop: Key) {
      // 内部属性直接返回
      if (prop === ROOT || prop === PATH || prop === "$type") {
        return target[prop];
      }
      // 其他属性访问：返回新代理，路径追加当前属性名
      return buildProxy(root, [...path, prop]);
    },
  });
}

/* ============================================================================
 * 工具函数
 * ============================================================================ */

/**
 * 判断值是否为普通对象（非数组、非 null）
 *
 * @param value - 要检查的值
 * @returns 是否为普通对象
 */
const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * 根据路径访问对象中的值
 *
 * @param root - 根对象
 * @param path - 访问路径
 * @returns 路径指向的值，如果路径中任何部分为 null/undefined 则返回该值
 *
 * @example
 * ```typescript
 * access({ a: { b: 1 } }, ['a', 'b']) // => 1
 * access({ a: null }, ['a', 'b'])     // => null
 * ```
 */
function access(root: any, path: Key[]) {
  return path.reduce((acc, key) => (acc == null ? acc : acc[key as any]), root);
}

/**
 * 可变赋值：直接修改原对象
 *
 * 沿路径遍历，如果中间节点不存在则自动创建（数组或对象），
 * 最后将值赋给目标位置。
 *
 * @param root - 根对象（会被直接修改）
 * @param path - 赋值路径
 * @param value - 要赋的值
 *
 * @example
 * ```typescript
 * const obj = { a: {} };
 * assignMutable(obj, ['a', 'b', 'c'], 1);
 * // obj => { a: { b: { c: 1 } } }
 * ```
 */
function assignMutable(root: any, path: Key[], value: unknown) {
  let cursor = root;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    // 如果中间节点不存在，根据下一个键的类型创建数组或对象
    if (cursor[key] == null) {
      cursor[key] = typeof path[i + 1] === "number" ? [] : {};
    }
    cursor = cursor[key];
  }
  // 赋值到最终位置
  cursor[path[path.length - 1]] = value;
}

/**
 * 不可变赋值：返回新对象，原对象不变
 *
 * 沿路径进行浅拷贝，只复制路径上的节点，
 * 其他部分保持引用共享（结构共享）。
 *
 * @template T - 根对象类型
 * @param root - 根对象（不会被修改）
 * @param path - 赋值路径
 * @param value - 要赋的值
 * @returns 新的根对象
 *
 * @example
 * ```typescript
 * const obj = { a: { b: 1 } };
 * const newObj = assignImmutable(obj, ['a', 'b'], 2);
 * // obj.a.b => 1（原对象不变）
 * // newObj.a.b => 2（新对象）
 * // obj !== newObj, obj.a !== newObj.a
 * ```
 */
function assignImmutable<T>(root: T, path: Key[], value: unknown): T {
  // 浅拷贝根对象
  const cloned: any = Array.isArray(root) ? [...(root as any)] : { ...(root as any) };
  let cursor: any = cloned;
  let original: any = root;

  // 沿路径浅拷贝每个中间节点
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    cursor[key] = Array.isArray(original[key]) ? [...original[key]] : { ...original[key] };
    cursor = cursor[key];
    original = original[key];
  }

  // 赋值到最终位置
  cursor[path[path.length - 1]] = value;
  return cloned;
}

/* ============================================================================
 * 公开 API - 读取操作
 * ============================================================================ */

/**
 * 从形状引用读取值
 *
 * 根据代理中存储的路径，从根对象中获取对应位置的值。
 *
 * @template V - 值的类型
 * @param ref - 形状引用（通过 createShape 创建的代理的属性访问链）
 * @returns 路径指向的值
 *
 * @example
 * ```typescript
 * const data = { user: { name: "Alice" } };
 * const shape = createShape(data);
 * const name = readValue(shape.user.name); // "Alice"
 * ```
 */
export function readValue<V>(ref: ShapeRef<V>): V {
  return access((ref as any)[ROOT], (ref as any)[PATH]);
}

/* ============================================================================
 * 公开 API - 写入操作
 * ============================================================================ */

/**
 * 写入值到形状引用指向的位置
 *
 * 支持两种模式：
 * 1. **可变模式**（不传 root）：直接修改原对象
 * 2. **不可变模式**（传入 root）：返回新对象，原对象不变
 *
 * 支持两种赋值方式：
 * - 直接传入新值
 * - 传入更新函数 `(prev) => next`
 *
 * @template V - 值的类型
 * @template T - 根对象类型（不可变模式）
 *
 * @overload 可变模式 - 直接赋值
 * @param ref - 形状引用
 * @param next - 新值
 *
 * @overload 可变模式 - 函数更新
 * @param ref - 形状引用
 * @param fn - 更新函数
 *
 * @overload 不可变模式 - 直接赋值
 * @param ref - 形状引用
 * @param next - 新值
 * @param root - 根对象
 * @returns 新的根对象
 *
 * @overload 不可变模式 - 函数更新
 * @param ref - 形状引用
 * @param fn - 更新函数
 * @param root - 根对象
 * @returns 新的根对象
 *
 * @example
 * ```typescript
 * const data = { count: 0 };
 * const shape = createShape(data);
 *
 * // 可变模式
 * writeValue(shape.count, 1);
 * console.log(data.count); // 1
 *
 * // 可变模式 - 函数更新
 * writeValue(shape.count, (prev) => prev + 1);
 * console.log(data.count); // 2
 *
 * // 不可变模式
 * const newData = writeValue(shape.count, 10, data);
 * console.log(data.count);    // 2（原对象不变）
 * console.log(newData.count); // 10（新对象）
 * ```
 */
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
  // 如果是函数则调用获取新值，否则直接使用
  const next = typeof nextOrFn === "function" ? (nextOrFn as (v: V) => V)(prev) : nextOrFn;

  // 根据是否传入 root 决定使用可变还是不可变赋值
  return root === undefined
    ? assignMutable(base, path, next)
    : assignImmutable(base, path, next);
}

/* ============================================================================
 * 公开 API - 合并操作
 * ============================================================================ */

/**
 * 合并对象值到形状引用指向的位置
 *
 * 类似 writeValue，但专门用于对象的部分更新（浅合并）。
 * 只会更新传入的字段，其他字段保持不变。
 *
 * @template V - 值的类型（必须是对象）
 * @template T - 根对象类型（不可变模式）
 *
 * @overload 可变模式 - 直接合并
 * @param ref - 形状引用
 * @param partial - 要合并的部分对象
 *
 * @overload 可变模式 - 函数更新
 * @param ref - 形状引用
 * @param fn - 返回部分对象的函数
 *
 * @overload 不可变模式 - 直接合并
 * @param ref - 形状引用
 * @param partial - 要合并的部分对象
 * @param root - 根对象
 * @returns 新的根对象
 *
 * @overload 不可变模式 - 函数更新
 * @param ref - 形状引用
 * @param fn - 返回部分对象的函数
 * @param root - 根对象
 * @returns 新的根对象
 *
 * @example
 * ```typescript
 * const data = { user: { name: "Alice", age: 25, city: "Beijing" } };
 * const shape = createShape(data);
 *
 * // 可变模式 - 只更新 age，其他字段不变
 * mergeValue(shape.user, { age: 26 });
 * console.log(data.user); // { name: "Alice", age: 26, city: "Beijing" }
 *
 * // 不可变模式
 * const newData = mergeValue(shape.user, { city: "Shanghai" }, data);
 * ```
 */
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

  // 如果是函数则调用获取部分对象，否则直接使用
  const patchObject =
    typeof partialOrFn === "function"
      ? (partialOrFn as (p: V) => Partial<V>)(prev)
      : partialOrFn;

  // 如果原值或补丁不是对象，直接替换
  if (!isObject(prev) || !isObject(patchObject)) {
    return root === undefined
      ? assignMutable(base, path, patchObject as any)
      : assignImmutable(root, path, patchObject as any);
  }

  // 浅合并对象
  const merged = { ...prev, ...patchObject };
  return root === undefined
    ? assignMutable(base, path, merged)
    : assignImmutable(root, path, merged);
}

/* ============================================================================
 * 公开 API - 路径操作
 * ============================================================================ */

/**
 * 获取形状引用的路径
 *
 * 返回代理中存储的访问路径数组。
 *
 * @template V - 值的类型
 * @param ref - 形状引用
 * @returns 路径数组
 *
 * @example
 * ```typescript
 * const shape = createShape({ a: { b: { c: 1 } } });
 * const path = getShape(shape.a.b.c); // ['a', 'b', 'c']
 * ```
 */
export function getShape<V>(ref: ShapeRef<V>): Shape {
  return (ref as any)[PATH];
}

/**
 * 根据路径设置值（不可变）
 *
 * 直接使用路径数组进行不可变赋值，不需要创建代理。
 * 适用于动态路径或从 getShape 获取的路径。
 *
 * @template T - 根对象类型
 * @param root - 根对象
 * @param path - 路径数组
 * @param value - 要设置的值
 * @returns 新的根对象
 *
 * @example
 * ```typescript
 * const data = { a: { b: 1 } };
 * const newData = setShape(data, ['a', 'b'], 2);
 * console.log(data.a.b);    // 1（原对象不变）
 * console.log(newData.a.b); // 2（新对象）
 * ```
 */
export function setShape<T>(
  root: T,
  path: Shape,
  value: unknown
): T {
  return assignImmutable(root, path as Key[], value);
}
