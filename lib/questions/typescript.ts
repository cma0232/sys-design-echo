export interface TypeScriptQuestion {
  id: string;
  title: string;
  description: string;
  code: string;
  solution: string;
  bugs: string[];
  explanation: string;
  tags?: string[];
}

export const typescriptQuestions: TypeScriptQuestion[] = [
  {
    id: 'ts-01',
    title: 'Union Type Narrowing',
    description: 'This function handles different response types but TypeScript errors on the property access. Fix the type errors.',
    code: `type SuccessResponse = { status: 'success'; data: string[] };
type ErrorResponse = { status: 'error'; message: string };
type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(res: ApiResponse) {
  if (res.status === 'success') {
    console.log(res.data.join(', '));
    console.log(res.message); // accessing wrong property
  } else {
    console.log(res.message.toUpperCase());
  }
}`,
    solution: `type SuccessResponse = { status: 'success'; data: string[] };
type ErrorResponse = { status: 'error'; message: string };
type ApiResponse = SuccessResponse | ErrorResponse;

function handleResponse(res: ApiResponse) {
  if (res.status === 'success') {
    // Fix: only access properties that exist on SuccessResponse
    console.log(res.data.join(', '));
    // removed: console.log(res.message) — message doesn't exist here
  } else {
    console.log(res.message.toUpperCase());
  }
}`,
    bugs: [
      '`res.message` is accessed inside the `success` branch — `message` only exists on `ErrorResponse`, TypeScript should error here',
    ],
    explanation:
      'Discriminated unions narrow the type inside each branch. Inside `status === "success"` branch, `res` is `SuccessResponse` which has no `message`. Remove the incorrect property access.',
  },
  {
    id: 'ts-02',
    title: 'Generic Constraint Missing',
    description: 'A utility function to get a property by key. Fix so it is type-safe.',
    code: `function getProperty(obj: object, key: string) {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
const name = getProperty(user, 'name');
const missing = getProperty(user, 'nonexistent'); // should be a type error`,
    solution: `// Fix: use generics with keyof to constrain key to valid object keys
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: 'Alice', age: 30 };
const name = getProperty(user, 'name');         // string ✓
// const missing = getProperty(user, 'nonexistent'); // compile error ✓`,
    bugs: [
      'Parameter types `object` and `string` are too broad — no constraint between `obj` and `key`, so invalid keys are not caught at compile time',
      'Return type is implicitly `any`',
    ],
    explanation:
      'Use generics with `keyof`: `function getProperty<T, K extends keyof T>(obj: T, key: K): T[K]`. This makes invalid keys a compile-time error.',
  },
  {
    id: 'ts-03',
    title: 'Incorrect Partial Usage',
    description: 'An update function that should allow partial updates, but currently errors when required fields are missing.',
    code: `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

function updateUser(id: string, updates: User) {
  return fetch(\`/api/users/\${id}\`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// This should work but errors:
updateUser('123', { name: 'Bob' });`,
    solution: `interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

// Fix: updates should be partial and exclude id (already passed separately)
function updateUser(id: string, updates: Partial<Omit<User, 'id'>>) {
  return fetch(\`/api/users/\${id}\`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

updateUser('123', { name: 'Bob' }); // ✓`,
    bugs: [
      '`updates` is typed as `User` (all fields required) — a PATCH endpoint should accept `Partial<User>` (all fields optional)',
      '`id` should probably be excluded from `updates` since it is already a separate parameter — use `Partial<Omit<User, "id">>`',
    ],
    explanation:
      'Change parameter to `updates: Partial<Omit<User, "id">>` — this accurately reflects a PATCH operation.',
  },
  {
    id: 'ts-04',
    title: 'Type Guard Implementation',
    description: 'Runtime type checking is needed but the current guard does not narrow the type properly.',
    code: `interface Cat { type: 'cat'; meow: () => void }
interface Dog { type: 'dog'; bark: () => void }

function isCat(animal: Cat | Dog) {
  return animal.type === 'cat';
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // TypeScript still errors: meow does not exist on Dog
  }
}`,
    solution: `interface Cat { type: 'cat'; meow: () => void }
interface Dog { type: 'dog'; bark: () => void }

// Fix: return a type predicate so TypeScript can narrow the type
function isCat(animal: Cat | Dog): animal is Cat {
  return animal.type === 'cat';
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow(); // ✓ TypeScript knows animal is Cat here
  }
}`,
    bugs: [
      '`isCat` returns `boolean`, not a type predicate — TypeScript cannot narrow the type based on a plain boolean return',
    ],
    explanation:
      'Change return type to a type predicate: `function isCat(animal: Cat | Dog): animal is Cat`. This tells TypeScript that if the function returns true, the argument is `Cat`.',
  },
  {
    id: 'ts-05',
    title: 'Readonly Violation',
    description: 'Config object should be immutable but can be modified at runtime.',
    code: `const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
};

function resetConfig() {
  config.apiUrl = ''; // should not be allowed
  config.timeout = 0;
}`,
    solution: `// Fix: use 'as const' to make all properties readonly with literal types
const config = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3,
} as const;

function resetConfig() {
  // config.apiUrl = ''; // compile error: Cannot assign to 'apiUrl' ✓
  // config.timeout = 0; // compile error ✓
}`,
    bugs: [
      '`config` is inferred as a mutable object — properties can be reassigned. Should be typed as `Readonly<...>` or use `as const`.',
    ],
    explanation:
      'Use `as const` to make all properties `readonly` and their types literal: `const config = { ... } as const`. Or type it as `Readonly<typeof config>`.',
  },
  {
    id: 'ts-06',
    title: 'Mapped Type Bug',
    description: 'A type that should make all properties optional AND nullable, but the implementation is wrong.',
    code: `type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};

type MaybeUser = Nullable<{
  name: string;
  age: number;
}>;

// Expected: { name?: string | null; age?: number | null }
// Actual:   { name: string | null; age: number | null }`,
    solution: `// Fix: add the optional modifier '?' to make properties optional
type Nullable<T> = {
  [K in keyof T]?: T[K] | null;
};

type MaybeUser = Nullable<{
  name: string;
  age: number;
}>;
// Result: { name?: string | null; age?: number | null } ✓`,
    bugs: [
      'Mapped type adds `| null` but does not add the optional modifier `?` — properties remain required',
    ],
    explanation:
      'Add the optional modifier: `[K in keyof T]?: T[K] | null`. The `?` after `]` makes each property optional.',
  },
  {
    id: 'ts-07',
    title: 'Enum vs Const Enum Runtime Behavior',
    description: 'This code works in development but fails after bundling. Identify the issue.',
    code: `// shared/enums.ts (compiled separately as a library)
export const enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

// consumer.ts
import { Direction } from './shared/enums';
console.log(Direction.Up);`,
    solution: `// Fix: use a regular enum for cross-module/cross-package usage
// const enum is inlined at compile time and doesn't exist at runtime
export enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

// consumer.ts
import { Direction } from './shared/enums';
console.log(Direction.Up); // 'UP' ✓`,
    bugs: [
      '`const enum` is inlined at compile time — it does not exist at runtime. When the enum is in a separate file compiled independently (e.g., a library), consumers get `undefined` because the inlining only happens within the same compilation unit.',
    ],
    explanation:
      'Use a regular `enum` for cross-module/cross-package use. `const enum` is only safe when all usage is in the same TypeScript compilation.',
  },
  {
    id: 'ts-08',
    title: 'Function Overload Mismatch',
    description: 'A function with overloads that errors at call sites that should be valid.',
    code: `function format(value: string): string;
function format(value: number): string;
function format(value: string | number): string {
  return String(value);
}

function processInput(val: string | number) {
  return format(val); // Error: Argument of type 'string | number' is not assignable
}`,
    solution: `function format(value: string): string;
function format(value: number): string;
// Fix: add a third overload for the union type
function format(value: string | number): string;
function format(value: string | number): string {
  return String(value);
}

function processInput(val: string | number) {
  return format(val); // ✓
}`,
    bugs: [
      'Overload signatures cover `string` and `number` separately but there is no overload for `string | number` — TypeScript matches call sites against overloads, not the implementation signature',
    ],
    explanation:
      'Add a third overload: `function format(value: string | number): string;`. The implementation signature is not visible to callers — you must explicitly declare union overloads.',
  },
  {
    id: 'ts-09',
    title: 'Index Signature Conflict',
    description: 'An interface with specific properties and an index signature that conflict.',
    code: `interface Config {
  [key: string]: string;
  timeout: number; // Error
  retries: number; // Error
  baseUrl: string; // OK
}`,
    solution: `// Fix: widen the index signature value type to include number
interface Config {
  [key: string]: string | number;
  timeout: number;  // ✓
  retries: number;  // ✓
  baseUrl: string;  // ✓
}`,
    bugs: [
      '`timeout` and `retries` are `number` but the index signature says all string keys map to `string` — TypeScript requires specific properties to be assignable to the index signature value type',
    ],
    explanation:
      'Change index signature to `[key: string]: string | number` to accommodate both types. Or remove the index signature if you do not actually need arbitrary keys.',
  },
  {
    id: 'ts-10',
    title: 'Conditional Type with Infer',
    description: 'A utility type to extract the resolved value of a Promise. The current version does not work for nested Promises.',
    code: `type Awaited<T> = T extends Promise<infer U> ? U : T;

type A = Awaited<Promise<string>>;        // string ✓
type B = Awaited<Promise<Promise<string>>>; // Promise<string> ✗ — should be string`,
    solution: `// Fix: make the conditional type recursive to unwrap nested Promises
type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;

type A = Awaited<Promise<string>>;          // string ✓
type B = Awaited<Promise<Promise<string>>>; // string ✓`,
    bugs: [
      'The conditional type only unwraps one level of Promise — nested Promises like `Promise<Promise<string>>` are not fully resolved',
    ],
    explanation:
      'Use a recursive conditional type: `type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T`. This unwraps until the value is no longer a Promise. (This is exactly what TypeScript\'s built-in `Awaited<T>` does.)',
  },
  {
    id: 'ts-11',
    title: 'keyof and Template Literal Types',
    description: 'Generate event names like "onChange", "onBlur" from field names. The current type is too broad.',
    code: `type Fields = 'name' | 'email' | 'password';

type EventHandlers = {
  [K in Fields]: (value: string) => void;
};

// We want keys like: "onName" | "onEmail" | "onPassword"
// Current: "name" | "email" | "password"
type HandlerKeys = keyof EventHandlers;`,
    solution: `type Fields = 'name' | 'email' | 'password';

// Fix: use key remapping with template literal type + Capitalize
type EventHandlers = {
  [K in Fields as \`on\${Capitalize<K>}\`]: (value: string) => void;
};

// Result: { onName: ...; onEmail: ...; onPassword: ... }
type HandlerKeys = keyof EventHandlers;
// "onName" | "onEmail" | "onPassword" ✓`,
    bugs: [
      'The mapped type uses the field names directly as keys — no `on` prefix or capitalization is applied',
    ],
    explanation:
      'Use template literal types with `Capitalize`: `[K in Fields as \\`on${Capitalize<K>}\\`]: (value: string) => void`. Key remapping with `as` allows transforming key names in mapped types.',
  },
  {
    id: 'ts-12',
    title: 'Intersection Type Misuse',
    description: 'Trying to combine two incompatible types results in `never`.',
    code: `type A = { value: string };
type B = { value: number };
type C = A & B;

const c: C = { value: 'hello' }; // Error
const d: C = { value: 42 };      // Error`,
    solution: `// Fix: use a union value type instead of intersecting incompatible types
type C = { value: string | number };

const c: C = { value: 'hello' }; // ✓
const d: C = { value: 42 };      // ✓

// Or use a discriminated union if you need to handle them separately:
type C2 = { kind: 'text'; value: string } | { kind: 'num'; value: number };`,
    bugs: [
      '`A & B` requires `value` to be both `string` and `number` simultaneously — this is `never`, so no value can satisfy `C`',
    ],
    explanation:
      'Intersection (`&`) requires ALL constraints to be satisfied. For a union of value types, use `{ value: string | number }` or a discriminated union instead.',
  },
  {
    id: 'ts-13',
    title: 'Type Assertion Safety',
    description: 'API response is cast with `as` and crashes at runtime.',
    code: `async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  const data = await res.json() as { name: string; email: string };
  return data.name.toUpperCase(); // crashes if user not found
}`,
    solution: `async function getUser(id: string) {
  const res = await fetch(\`/api/users/\${id}\`);
  // Fix 1: check res.ok before parsing
  if (!res.ok) throw new Error(\`User not found: \${res.status}\`);
  const data = await res.json();
  // Fix 2: validate shape at runtime before asserting
  if (!data || typeof data.name !== 'string') {
    throw new Error('Unexpected response shape');
  }
  return (data as { name: string; email: string }).name.toUpperCase();
}`,
    bugs: [
      '`as` is a compile-time-only assertion — it does not validate runtime data. If the API returns `{ error: "not found" }`, `data.name` is `undefined` and `.toUpperCase()` throws',
      '`res.ok` is not checked before calling `.json()`',
    ],
    explanation:
      'Check `res.ok` first. Use a runtime validation library (zod, io-ts) or a manual check before asserting. `as` should only be used when you are certain of the shape.',
  },
  {
    id: 'ts-14',
    title: 'Discriminated Union Exhaustiveness',
    description: 'A reducer that handles actions. Adding a new action type causes silent bugs instead of compile errors.',
    code: `type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    default: return state; // 'reset' silently falls through
  }
}`,
    solution: `type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'reset' };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case 'increment': return state + 1;
    case 'decrement': return state - 1;
    case 'reset':     return 0; // Fix 1: handle the missing case
    default: {
      // Fix 2: exhaustiveness check — compile error if a new action type is added
      const _exhaustive: never = action;
      return state;
    }
  }
}`,
    bugs: [
      '`reset` case is not handled — it falls to `default` and returns unchanged state silently',
      'No exhaustiveness check — adding new action types will not produce a compile error',
    ],
    explanation:
      'Handle all cases explicitly. Add an exhaustiveness check in `default`: `const _: never = action; return state;`. If a new action type is added, TypeScript will error because it cannot be assigned to `never`.',
  },
  {
    id: 'ts-15',
    title: 'ReturnType and Parameters Utilities',
    description: 'Extracting types from a function without duplicating the type definition. The current approach breaks when the function signature changes.',
    code: `function createUser(name: string, age: number, role: 'admin' | 'user') {
  return { id: Math.random().toString(), name, age, role };
}

// Manually duplicated types — will drift from the function:
type CreateUserParams = [string, number, 'admin' | 'user'];
type User = { id: string; name: string; age: number; role: 'admin' | 'user' };`,
    solution: `function createUser(name: string, age: number, role: 'admin' | 'user') {
  return { id: Math.random().toString(), name, age, role };
}

// Fix: derive types from the function — single source of truth
type CreateUserParams = Parameters<typeof createUser>;
// [string, number, 'admin' | 'user'] — always in sync ✓

type User = ReturnType<typeof createUser>;
// { id: string; name: string; age: number; role: 'admin' | 'user' } ✓`,
    bugs: [
      'Types are manually duplicated from the function — if `createUser` changes, `CreateUserParams` and `User` must be updated separately or they silently drift',
    ],
    explanation:
      'Use built-in utility types: `type CreateUserParams = Parameters<typeof createUser>` and `type User = ReturnType<typeof createUser>`. These derive types from the function itself — single source of truth.',
  },
  {
    id: 'ts-16',
    title: 'Optional Chaining and Nullish Coalescing Misuse',
    description: 'Default value logic has a subtle bug with falsy values.',
    code: `interface Settings {
  theme?: string;
  fontSize?: number;
  darkMode?: boolean;
}

function getSettings(settings: Settings) {
  const theme = settings.theme || 'light';
  const fontSize = settings.fontSize || 16;
  const darkMode = settings.darkMode || false;
  return { theme, fontSize, darkMode };
}

// Bug: getSettings({ theme: '', fontSize: 0, darkMode: false })
// Returns: { theme: 'light', fontSize: 16, darkMode: false }`,
    solution: `interface Settings {
  theme?: string;
  fontSize?: number;
  darkMode?: boolean;
}

function getSettings(settings: Settings) {
  // Fix: use ?? (nullish coalescing) — only falls back on null/undefined
  // not on falsy values like '', 0, false
  const theme = settings.theme ?? 'light';
  const fontSize = settings.fontSize ?? 16;
  const darkMode = settings.darkMode ?? false;
  return { theme, fontSize, darkMode };
}

// getSettings({ theme: '', fontSize: 0, darkMode: false })
// Returns: { theme: '', fontSize: 0, darkMode: false } ✓`,
    bugs: [
      '`||` falls back on ANY falsy value — empty string `""` and `0` are valid user settings but get replaced by defaults',
      'Should use `??` (nullish coalescing) which only falls back on `null` or `undefined`',
    ],
    explanation:
      'Replace `||` with `??`: `settings.theme ?? "light"`. Nullish coalescing preserves intentional falsy values like `0`, `""`, and `false`.',
  },
  {
    id: 'ts-17',
    title: 'Double Type Assertion Abuse',
    description: 'A function casts through `unknown` to bypass type checking. Find the problem and fix it properly.',
    code: `interface AdminUser {
  id: string;
  role: 'admin';
  permissions: string[];
}

function getAdminPermissions(user: unknown): string[] {
  const admin = user as unknown as AdminUser;
  return admin.permissions;
}

// Called with:
getAdminPermissions({ id: '1', role: 'user' }); // crashes at runtime`,
    solution: `interface AdminUser {
  id: string;
  role: 'admin';
  permissions: string[];
}

// Fix: validate shape at runtime before using it
function isAdminUser(user: unknown): user is AdminUser {
  return (
    typeof user === 'object' &&
    user !== null &&
    'role' in user &&
    (user as any).role === 'admin' &&
    Array.isArray((user as any).permissions)
  );
}

function getAdminPermissions(user: unknown): string[] {
  if (!isAdminUser(user)) throw new Error('Not an admin user');
  return user.permissions; // TypeScript narrows to AdminUser here
}`,
    bugs: [
      '`as unknown as AdminUser` is a double assertion that bypasses all type checking — no runtime validation means the function crashes when `permissions` is missing',
    ],
    explanation:
      '`as unknown as T` is an escape hatch that tells TypeScript "trust me" with zero runtime safety. Always pair it with a runtime type guard when the input is truly unknown.',
  },
  {
    id: 'ts-18',
    title: 'Async Function Return Type',
    description: 'A function typed to return `Promise<User>` but the implementation has a code path that returns undefined.',
    code: `interface User {
  id: string;
  name: string;
}

async function fetchUser(id: string): Promise<User> {
  if (!id) {
    return; // TypeScript should error here
  }
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}`,
    solution: `interface User {
  id: string;
  name: string;
}

// Fix: return type should allow null, or throw on invalid input
async function fetchUser(id: string): Promise<User | null> {
  if (!id) {
    return null; // explicit null instead of undefined
  }
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) return null;
  return res.json();
}`,
    bugs: [
      'Bare `return` inside an `async` function returns `Promise<undefined>`, which is not assignable to `Promise<User>`',
      'Callers are not informed that the result can be null/undefined',
    ],
    explanation:
      'Change the return type to `Promise<User | null>` and return `null` explicitly. This forces callers to handle the missing case instead of crashing on `undefined`.',
  },
  {
    id: 'ts-19',
    title: 'Exclude and Extract Misuse',
    description: 'A type that should remove `null` and `undefined` from a union, but is written incorrectly.',
    code: `type Raw = string | number | null | undefined | boolean;

// Intention: remove null and undefined
type Clean = Exclude<Raw, null | undefined>;
// Expected: string | number | boolean ✓

// Now extract only the falsy types:
type FalsyOnly = Extract<Raw, false | 0 | '' | null | undefined>;
// Expected: null | undefined | false
// Actual:   null | undefined`,
    solution: `type Raw = string | number | null | undefined | boolean;

type Clean = Exclude<Raw, null | undefined>;
// string | number | boolean ✓

// Fix: Extract matches against the union members as-is.
// boolean in the union is 'boolean', not literally 'false'
// To get false, the union must contain 'false' literally
type BooleanLiteral = string | number | null | undefined | true | false;
type FalsyOnly = Extract<BooleanLiteral, false | 0 | '' | null | undefined>;
// null | undefined | false ✓

// Explanation: Extract<T, U> keeps members of T that are assignable to U
// 'boolean' is not assignable to 'false', so it is not extracted`,
    bugs: [
      '`boolean` in a union is not the same as the literal type `false` — `Extract<boolean, false>` yields `never` because `boolean` is not assignable to `false`',
    ],
    explanation:
      '`Extract<T, U>` keeps members of T that are assignable to U. `boolean` is `true | false`, but as a union member it is treated atomically. Use literal types `true | false` explicitly if you need to extract specific boolean literals.',
  },
  {
    id: 'ts-20',
    title: 'Class Implementing Interface Incorrectly',
    description: 'A class claims to implement an interface but has a subtle method signature mismatch.',
    code: `interface Logger {
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
}

class ConsoleLogger implements Logger {
  log(message: string, level: 'info' | 'warn' | 'error'): void {
    console[level ?? 'info'](message);
  }
}`,
    solution: `interface Logger {
  log(message: string, level?: 'info' | 'warn' | 'error'): void;
}

class ConsoleLogger implements Logger {
  // Fix: level must be optional (?) to match the interface
  log(message: string, level?: 'info' | 'warn' | 'error'): void {
    console[level ?? 'info'](message);
  }
}`,
    bugs: [
      'Interface declares `level` as optional (`level?`) but the class implementation makes it required — a required parameter is not assignable to an optional one in TypeScript',
    ],
    explanation:
      'A class implementing an interface must be at least as permissive as the interface. If the interface says a parameter is optional, the implementation must also mark it optional.',
  },
  {
    id: 'ts-21',
    title: 'Readonly Array Mutation',
    description: 'A function receives a readonly array but TypeScript errors are bypassed. Find the issue.',
    code: `function sortUsers(users: ReadonlyArray<{ name: string; age: number }>) {
  return users.sort((a, b) => a.age - b.age);
}

const users = [{ name: 'Bob', age: 30 }, { name: 'Alice', age: 25 }];
const sorted = sortUsers(users);
console.log(users); // original is now mutated!`,
    solution: `function sortUsers(users: ReadonlyArray<{ name: string; age: number }>) {
  // Fix: create a copy before sorting — sort() mutates in place
  return [...users].sort((a, b) => a.age - b.age);
}

const users = [{ name: 'Bob', age: 30 }, { name: 'Alice', age: 25 }];
const sorted = sortUsers(users);
// users is unchanged ✓`,
    bugs: [
      '`Array.sort()` mutates the original array in place — calling it on a spread of a ReadonlyArray bypasses the readonly constraint and mutates the caller\'s data',
    ],
    explanation:
      'Always copy before sorting: `[...users].sort(...)`. `ReadonlyArray` prevents TypeScript from calling mutating methods, but spreading it gives a regular mutable array — so the constraint is your last line of defence.',
  },
  {
    id: 'ts-22',
    title: 'satisfies vs Type Annotation',
    description: 'A config object loses its literal types when annotated. Fix it to keep precise types while still validating the shape.',
    code: `type Config = {
  endpoint: string;
  method: string;
  retries: number;
};

const apiConfig: Config = {
  endpoint: '/api/users',
  method: 'GET',
  retries: 3,
};

// TypeScript infers method as 'string', not 'GET'
// This errors even though it should be valid:
type Method = typeof apiConfig.method; // string, not 'GET'
const m: 'GET' | 'POST' = apiConfig.method; // error`,
    solution: `type Config = {
  endpoint: string;
  method: string;
  retries: number;
};

// Fix: use 'satisfies' to validate the shape while preserving literal types
const apiConfig = {
  endpoint: '/api/users',
  method: 'GET',
  retries: 3,
} satisfies Config;

// Now method is inferred as 'GET', not 'string'
type Method = typeof apiConfig.method; // 'GET' ✓
const m: 'GET' | 'POST' = apiConfig.method; // ✓`,
    bugs: [
      'Using `: Config` annotation widens all string properties to `string`, losing literal type information like `"GET"`',
    ],
    explanation:
      '`satisfies` (TypeScript 4.9+) validates the object against a type without widening it. The inferred type keeps literal values while still flagging shape errors.',
  },
  {
    id: 'ts-23',
    title: 'Generic Default Type Conflict',
    description: 'A generic component with a default type parameter behaves unexpectedly.',
    code: `type ApiResponse<T = void> = {
  data: T;
  status: number;
  error?: string;
};

function createResponse<T = void>(data: T, status: number): ApiResponse<T> {
  return { data, status };
}

const empty = createResponse(undefined, 200);
// empty.data is typed as 'undefined', but we want it to be 'void'
// and callers shouldn't need to pass undefined explicitly

const withData = createResponse<{ id: string }>({ id: '1' }, 200);`,
    solution: `// Fix: use 'undefined' as the default instead of 'void'
// 'void' means the return value should not be used, not that data is absent
// Use function overloads to handle the no-data case cleanly
type ApiResponse<T = undefined> = {
  data: T;
  status: number;
  error?: string;
};

function createResponse(status: number): ApiResponse<undefined>;
function createResponse<T>(data: T, status: number): ApiResponse<T>;
function createResponse<T>(dataOrStatus: T | number, status?: number): ApiResponse<T | undefined> {
  if (typeof dataOrStatus === 'number') {
    return { data: undefined, status: dataOrStatus };
  }
  return { data: dataOrStatus, status: status! };
}

const empty = createResponse(200);         // ApiResponse<undefined> ✓
const withData = createResponse({ id: '1' }, 200); // ApiResponse<{id:string}> ✓`,
    bugs: [
      '`void` as a generic default is misleading — `void` signals "do not use the return value" semantically, not "no data". Callers must pass `undefined` explicitly.',
    ],
    explanation:
      '`void` and `undefined` are subtly different in TypeScript. Use `undefined` as the default generic type when the absence of data is meaningful. Function overloads let you skip the `data` parameter entirely for the no-data case.',
  },
  {
    id: 'ts-24',
    title: 'Mutable Tuple vs Array',
    description: 'A coordinate pair is typed as an array but should be a fixed-length tuple.',
    code: `function translate(point: number[], dx: number, dy: number): number[] {
  return [point[0] + dx, point[1] + dy];
}

const p = translate([1, 2], 3, 4); // [4, 6]

// Problems:
// 1. No guarantee point has exactly 2 elements
// 2. translate([1, 2, 3], 0, 0) is valid but shouldn't be
// 3. Return type is number[], not [number, number]`,
    solution: `// Fix: use tuple types for fixed-length coordinate pairs
type Point = [number, number];

function translate(point: Point, dx: number, dy: number): Point {
  return [point[0] + dx, point[1] + dy];
}

const p = translate([1, 2], 3, 4); // [4, 6] typed as [number, number] ✓
// translate([1, 2, 3], 0, 0); // compile error: too many elements ✓

// Bonus: named tuples for clarity
type NamedPoint = [x: number, y: number];`,
    bugs: [
      '`number[]` does not constrain the length — callers can pass any number of elements and TypeScript cannot catch it',
      'Return type `number[]` loses the tuple structure — callers do not know they get exactly 2 numbers back',
    ],
    explanation:
      'Use tuple types `[number, number]` when the length and position of elements are significant. Named tuples `[x: number, y: number]` add documentation without runtime cost.',
  },
  {
    id: 'ts-25',
    title: 'Strict Function Type Variance',
    description: 'A callback assignment that seems correct but violates function parameter contravariance.',
    code: `type Handler<T> = (event: T) => void;

interface ClickEvent { x: number; y: number; target: HTMLElement }
interface BaseEvent { target: HTMLElement }

const handleClick: Handler<ClickEvent> = (e) => {
  console.log(e.x, e.y);
};

// Should this be allowed?
const handleBase: Handler<BaseEvent> = handleClick;
handleBase({ target: document.body }); // crashes: e.x is undefined`,
    solution: `type Handler<T> = (event: T) => void;

interface ClickEvent { x: number; y: number; target: HTMLElement }
interface BaseEvent { target: HTMLElement }

const handleClick: Handler<ClickEvent> = (e) => {
  console.log(e.x, e.y);
};

// Fix: Handler<ClickEvent> is NOT assignable to Handler<BaseEvent>
// because function parameters are contravariant under --strictFunctionTypes
// A handler expecting MORE properties cannot accept FEWER
const handleBase: Handler<BaseEvent> = (e) => {
  // Can only safely use BaseEvent properties here
  console.log(e.target);
};

// Rule: you can assign Handler<BaseEvent> to Handler<ClickEvent>, not the reverse
// Handler<BaseEvent> is more permissive (accepts supertype), so it handles subtypes safely`,
    bugs: [
      'Assigning `Handler<ClickEvent>` to `Handler<BaseEvent>` is unsafe — the handler assumes `e.x` and `e.y` exist, but `BaseEvent` only guarantees `target`',
      'Under `strictFunctionTypes`, TypeScript correctly rejects this — function parameters are contravariant, not covariant',
    ],
    explanation:
      'Function parameters are contravariant: `Handler<Base>` is assignable to `Handler<Derived>`, not the other way around. A handler that accepts a base type can safely handle derived types (it only uses base properties), but a handler requiring derived properties cannot accept a base-only input.',
  },
  {
    id: 'ts-26',
    title: 'Branded Types for Sensor IDs',
    description: 'A robotics system uses TopicId and SensorId — both are plain strings. Functions silently accept the wrong ID type. Add compile-time type safety without changing runtime behavior.',
    tags: ['Foxglove'],
    code: `function subscribeToTopic(topicId: string, cb: (msg: unknown) => void) {
  // subscribe to a data topic
}

function getSensorMetadata(sensorId: string) {
  // fetch metadata for a specific sensor
}

const LIDAR_TOPIC_ID = 'topic_lidar_001';
const LIDAR_SENSOR_ID = 'sensor_lidar_001';

// Both of these should be type errors — but they're not:
getSensorMetadata(LIDAR_TOPIC_ID);             // wrong: passing a topic ID as sensor ID
subscribeToTopic(LIDAR_SENSOR_ID, () => {});  // wrong: passing a sensor ID as topic ID`,
    solution: `// Fix: branded (nominal) types — same runtime representation, distinct compile-time identity
type TopicId = string & { readonly __brand: 'TopicId' };
type SensorId = string & { readonly __brand: 'SensorId' };

// Constructor helpers — cast once at the boundary
const TopicId = (id: string): TopicId => id as TopicId;
const SensorId = (id: string): SensorId => id as SensorId;

function subscribeToTopic(topicId: TopicId, cb: (msg: unknown) => void) {}
function getSensorMetadata(sensorId: SensorId) {}

const LIDAR_TOPIC_ID = TopicId('topic_lidar_001');
const LIDAR_SENSOR_ID = SensorId('sensor_lidar_001');

// getSensorMetadata(LIDAR_TOPIC_ID);            // compile error ✓
// subscribeToTopic(LIDAR_SENSOR_ID, () => {});  // compile error ✓

getSensorMetadata(LIDAR_SENSOR_ID);            // ✓
subscribeToTopic(LIDAR_TOPIC_ID, () => {});   // ✓`,
    bugs: [
      'Both IDs are plain `string` — TypeScript cannot distinguish them, so swapping a TopicId for a SensorId (or vice versa) is a silent bug caught only at runtime',
    ],
    explanation:
      'Branded types add a phantom property to a primitive type. At runtime they are still plain strings (zero overhead), but TypeScript treats them as distinct types. Cast once using a constructor helper at the boundary; the rest of the codebase is type-safe automatically.',
  },
  {
    id: 'ts-27',
    title: 'Generic Select Component Loses Type Safety',
    description: 'A reusable Select component is typed with `any`. The value type is not connected to the options type, so wrong value types go undetected. Fix with generics.',
    tags: ['Foxglove'],
    code: `function Select({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: any }[];
  value: any;
  onChange: (value: any) => void;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// None of these mismatches are caught at compile time:
const [topic, setTopic] = useState<string>('lidar');
// value should be string but 42 is accepted:
const el = <Select options={[{ label: 'LiDAR', value: 'lidar' }]} value={42} onChange={setTopic} />;`,
    solution: `// Fix: make the component generic over the value type
function Select<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as T)}
    >
      {options.map(o => (
        <option key={String(o.value)} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

const [topic, setTopic] = useState<string>('lidar');

// T is inferred as string from options — value must also be string:
const el = (
  <Select
    options={[{ label: 'LiDAR', value: 'lidar' }]}
    value={topic}       // ✓
    onChange={setTopic} // ✓
  />
);
// value={42} would now be a compile error ✓`,
    bugs: [
      '`value: any` and `onChange: (value: any) => void` erase all type information — the component accepts any value regardless of what options provide',
      'There is no connection between the options value type and the value/onChange types',
    ],
    explanation:
      'Generic components propagate types between related props. `<T extends string | number>` constrains the value type and flows through `options`, `value`, and `onChange` — TypeScript infers T from options and enforces consistency. This pattern is essential for reusable library components.',
  },
  {
    id: 'ts-28',
    title: 'Untyped Event Emitter',
    description: 'A pub/sub bus for robot state events uses string event names and `any` payloads. Typos in event names and wrong payload shapes are silent at compile time. Make it fully type-safe.',
    tags: ['Foxglove'],
    code: `class RobotEventBus {
  private listeners = new Map<string, Array<(data: any) => void>>();

  on(event: string, listener: (data: any) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener);
  }

  emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(l => l(data));
  }
}

const bus = new RobotEventBus();

// None of these bugs are caught at compile time:
bus.on('pose', (data) => console.log(data.x, data.y, data.z));
bus.emit('psoe', { x: 1, y: 2, z: 3 }); // typo in event name — listener never fires
bus.emit('pose', { lat: 1, lng: 2 });    // wrong payload shape — runtime crash`,
    solution: `// Fix: define the event map, then constrain the class with generics

interface RobotEvents {
  pose: { x: number; y: number; z: number };
  velocity: { linear: number; angular: number };
  status: { connected: boolean; message: string };
}

class RobotEventBus<Events extends Record<string, unknown>> {
  private listeners = new Map<keyof Events, Array<(data: any) => void>>();

  on<K extends keyof Events>(event: K, listener: (data: Events[K]) => void): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener as any);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    this.listeners.get(event)?.forEach(l => l(data));
  }
}

const bus = new RobotEventBus<RobotEvents>();

bus.on('pose', (data) => console.log(data.x, data.y, data.z)); // ✓
// bus.emit('psoe', { x: 1 });       // compile error: 'psoe' not in RobotEvents ✓
// bus.emit('pose', { lat: 1 });     // compile error: wrong shape ✓
bus.emit('pose', { x: 1, y: 2, z: 3 }); // ✓`,
    bugs: [
      '`event: string` allows any event name — typos silently produce a listener that never fires',
      '`data: any` disconnects the payload type from the event name — wrong shapes cause runtime crashes with no compile-time warning',
    ],
    explanation:
      'Define an event map type and make the class generic over it. `K extends keyof Events` ties the event name to its payload type in both `on` and `emit`. This mirrors how the DOM EventTarget is typed in TypeScript\'s lib.dom.d.ts.',
  },
  {
    id: 'ts-29',
    title: 'Global Window Augmentation',
    description: 'A robot control bridge is attached to `window` for debugging access. TypeScript errors on every property access. Fix it without using `(window as any)` — use proper module augmentation.',
    tags: ['Foxglove'],
    code: `// robot-bridge.ts
export interface RobotBridge {
  sendCommand: (cmd: string) => void;
  getStatus: () => 'ready' | 'error';
}

export function initRobotBridge(): void {
  // Error: Property 'robotBridge' does not exist on type 'Window & typeof globalThis'
  window.robotBridge = {
    sendCommand: (cmd) => console.log('cmd:', cmd),
    getStatus: () => 'ready',
  };
}

// app.ts
import { initRobotBridge } from './robot-bridge';
initRobotBridge();
// Error again:
window.robotBridge?.sendCommand('ESTOP');`,
    solution: `// Fix: augment the Window interface in a declaration file (or in this module)

// global.d.ts  — or add this block to robot-bridge.ts (must have import/export to be a module)
import type { RobotBridge } from './robot-bridge';

declare global {
  interface Window {
    robotBridge: RobotBridge | null;
  }
}

// robot-bridge.ts
export interface RobotBridge {
  sendCommand: (cmd: string) => void;
  getStatus: () => 'ready' | 'error';
}

export function initRobotBridge(): void {
  window.robotBridge = {          // ✓ no error
    sendCommand: (cmd) => console.log('cmd:', cmd),
    getStatus: () => 'ready',
  };
}

// app.ts
import { initRobotBridge } from './robot-bridge';
initRobotBridge();
window.robotBridge?.sendCommand('ESTOP');  // ✓
// window.robotBridge?.sendCommand(42);    // compile error: expected string ✓`,
    bugs: [
      'Custom properties added to `window` at runtime are not in TypeScript\'s `Window` interface — TypeScript errors on every access',
      'Common workaround is `(window as any).robotBridge` — but this disables all type checking on the property and its methods',
    ],
    explanation:
      'Use `declare global { interface Window { ... } }` to augment the global Window interface. This works via TypeScript\'s declaration merging. Place it in a `.d.ts` file, or inside any `.ts` file that is already a module (has at least one import/export). The augmented types are available project-wide.',
  },
];
