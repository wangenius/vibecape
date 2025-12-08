/**
 * Result 模式工具
 * 提供类型安全的错误处理，避免 try-catch 和 null 检查的混乱
 */

/**
 * Result 类型：成功或失败
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * 创建成功结果
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * 创建失败结果
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * 从 Result 中解包数据，失败时抛出异常
 */
export function unwrap<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

/**
 * 从 Result 中解包数据，失败时返回默认值
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.success ? result.data : defaultValue;
}

/**
 * 从 Result 中解包数据，失败时调用函数获取默认值
 */
export function unwrapOrElse<T, E>(
  result: Result<T, E>,
  fn: (error: E) => T
): T {
  return result.success ? result.data : fn(result.error);
}

/**
 * 检查是否成功
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * 检查是否失败
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * 映射成功值
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * 映射失败值
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * 链式操作（flatMap）
 */
export function andThen<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.data);
  }
  return result;
}

/**
 * 将可能抛出异常的函数包装为返回 Result 的函数
 */
export function tryCatch<T, A extends unknown[]>(
  fn: (...args: A) => T
): (...args: A) => Result<T, Error> {
  return (...args: A) => {
    try {
      return ok(fn(...args));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * 将可能抛出异常的异步函数包装为返回 Result 的函数
 */
export function tryCatchAsync<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>
): (...args: A) => Promise<Result<T, Error>> {
  return async (...args: A) => {
    try {
      return ok(await fn(...args));
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * 合并多个 Result，全部成功则返回成功数组
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const data: T[] = [];
  for (const result of results) {
    if (!result.success) {
      return result;
    }
    data.push(result.data);
  }
  return ok(data);
}
