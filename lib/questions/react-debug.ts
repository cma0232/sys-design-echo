export interface ReactDebugQuestion {
  id: string;
  title: string;
  description: string;
  code: string;
  solution: string;
  bugs: string[];
  explanation: string;
  tags?: string[];
}

export const reactDebugQuestions: ReactDebugQuestion[] = [
  {
    id: 'rd-01',
    title: 'Infinite Re-render Loop',
    description: 'This component should fetch user data on mount. It works but causes an infinite loop. Find all bugs.',
    code: `function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [options, setOptions] = useState({ timeout: 5000 });

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`, options)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId, options]);

  return <div>{user?.name}</div>;
}`,
    solution: `function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  // Fix 1: move options outside component or use useRef/useMemo
  // so the reference stays stable across renders
  const options = useRef({ timeout: 5000 });

  useEffect(() => {
    // Fix 2: use AbortController to cancel in-flight requests
    const controller = new AbortController();
    fetch(\`/api/users/\${userId}\`, {
      ...options.current,
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => {
        if (err.name !== 'AbortError') console.error(err);
      });
    return () => controller.abort();
  }, [userId]); // options ref is stable — no need in deps

  return <div>{user?.name}</div>;
}`,
    bugs: [
      '`options` object is created during render — new reference every render — causes infinite useEffect loop',
      'No cleanup / abort controller for the fetch — if userId changes fast, race condition possible',
    ],
    explanation:
      'Object/array literals in component body are recreated every render, making them referentially unequal even if values are the same. Fix: move `options` outside the component or wrap with useMemo/useRef.',
  },
  {
    id: 'rd-02',
    title: 'Stale Closure in setInterval',
    description: 'A counter that increments every second. After a few seconds it stops working correctly.',
    code: `function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setCount(count + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <div>{count}</div>;
}`,
    solution: `function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      // Fix: use functional update to avoid stale closure
      setCount(prev => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []); // empty deps is now safe because we don't read count

  return <div>{count}</div>;
}`,
    bugs: [
      '`count` inside the interval callback is stale (always 0) because the effect only runs once and closes over the initial value',
    ],
    explanation:
      'Fix: use functional update `setCount(prev => prev + 1)` to avoid depending on stale `count`.',
  },
  {
    id: 'rd-03',
    title: 'Direct State Mutation',
    description: 'A todo list where adding items sometimes does not trigger a re-render.',
    code: `function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);

  const addTodo = (text: string) => {
    todos.push(text);
    setTodos(todos);
  };

  return (
    <ul>
      {todos.map((todo, i) => <li key={i}>{todo}</li>)}
    </ul>
  );
}`,
    solution: `function TodoList() {
  const [todos, setTodos] = useState<string[]>([]);

  const addTodo = (text: string) => {
    // Fix 1: create a new array instead of mutating
    setTodos(prev => [...prev, text]);
  };

  return (
    <ul>
      {todos.map((todo) => (
        // Fix 2: use a stable unique key, not index
        <li key={todo}>{todo}</li>
      ))}
    </ul>
  );
}`,
    bugs: [
      '`todos.push(text)` mutates state directly — React uses reference equality; same array reference means no re-render',
      '`key={i}` — using index as key causes bugs when list order changes',
    ],
    explanation:
      'Always return a new array: `setTodos([...todos, text])`. Use a stable unique id for keys.',
  },
  {
    id: 'rd-04',
    title: 'Missing useEffect Cleanup',
    description: 'A component that subscribes to a WebSocket. Memory leak occurs when the component unmounts.',
    code: `function LiveFeed({ channel }: { channel: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(\`wss://api.example.com/\${channel}\`);
    ws.onmessage = (e) => {
      setMessages(prev => [...prev, e.data]);
    };
  }, [channel]);

  return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>;
}`,
    solution: `function LiveFeed({ channel }: { channel: string }) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(\`wss://api.example.com/\${channel}\`);
    ws.onmessage = (e) => {
      setMessages(prev => [...prev, e.data]);
    };
    // Fix: close WebSocket on unmount and when channel changes
    return () => ws.close();
  }, [channel]);

  return <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>;
}`,
    bugs: [
      'No cleanup function — WebSocket is never closed when component unmounts or `channel` changes',
      'If `channel` changes, old WebSocket stays open alongside the new one',
    ],
    explanation:
      'Return a cleanup: `return () => ws.close()`. This runs on unmount and before each re-run of the effect.',
  },
  {
    id: 'rd-05',
    title: 'Async Race Condition',
    description: 'Search results flicker or show wrong data when typing fast.',
    code: `function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => setResults(data));
  }, [query]);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </>
  );
}`,
    solution: `function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;
    // Fix: ignore stale responses after component re-renders
    let ignore = false;
    fetch(\`/api/search?q=\${query}\`)
      .then(res => res.json())
      .then(data => {
        if (!ignore) setResults(data);
      });
    return () => { ignore = true; };
  }, [query]);

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>{results.map(r => <li key={r.id}>{r.name}</li>)}</ul>
    </>
  );
}`,
    bugs: [
      'Race condition — slow responses from earlier queries can arrive after newer ones, overwriting correct results',
      'No cleanup — fetch from previous query still calls setResults after component rerenders',
    ],
    explanation:
      'Use an `ignore` flag in cleanup: `let ignore = false; ... if (!ignore) setResults(data); return () => { ignore = true; }`. Or use AbortController.',
  },
  {
    id: 'rd-06',
    title: 'useCallback Missing Dependency',
    description: 'A parent passes a callback to a child. The child uses React.memo but still re-renders unnecessarily — and sometimes the callback uses stale data.',
    code: `function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Alice');

  const handleSubmit = useCallback(() => {
    console.log(\`\${name} submitted count: \${count}\`);
    sendToServer({ name, count });
  }, []);

  return <MemoChild onSubmit={handleSubmit} />;
}`,
    solution: `function Parent() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState('Alice');

  // Fix: include all values used inside the callback in the dep array
  const handleSubmit = useCallback(() => {
    console.log(\`\${name} submitted count: \${count}\`);
    sendToServer({ name, count });
  }, [name, count]);

  return <MemoChild onSubmit={handleSubmit} />;
}`,
    bugs: [
      '`useCallback` dependency array is empty — `name` and `count` are stale inside the callback after state updates',
    ],
    explanation:
      'Add all used state/props to the dependency array: `[name, count]`. The whole point of useCallback is stable identity *with* correct closure, not at the expense of correctness.',
  },
  {
    id: 'rd-07',
    title: 'Conditional Hook',
    description: 'This component conditionally uses a hook. It crashes intermittently.',
    code: `function UserCard({ userId }: { userId: string | null }) {
  if (!userId) {
    return <div>No user</div>;
  }

  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
}`,
    solution: `function UserCard({ userId }: { userId: string | null }) {
  // Fix: all hooks must be called before any early return
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (!userId) return;
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(setUser);
  }, [userId]);

  if (!userId) {
    return <div>No user</div>;
  }

  return <div>{user?.name}</div>;
}`,
    bugs: [
      'Hook `useState` is called after an early return — violates Rules of Hooks — hooks must be called in the same order every render',
    ],
    explanation:
      'Move the early return after all hook calls, or split into two components.',
  },
  {
    id: 'rd-08',
    title: 'Event Listener Not Cleaned Up',
    description: 'A component that listens to keyboard shortcuts. After navigating away and back, the handler fires multiple times.',
    code: `function ShortcutHandler() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'k' && e.metaKey) setActive(true);
    });
  }, []);

  return <div>{active ? 'Active' : 'Inactive'}</div>;
}`,
    solution: `function ShortcutHandler() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    // Fix: named function so it can be removed
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'k' && e.metaKey) setActive(true);
    };
    window.addEventListener('keydown', handler);
    // Fix: remove listener on cleanup
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return <div>{active ? 'Active' : 'Inactive'}</div>;
}`,
    bugs: [
      'No cleanup — each mount adds a new listener, they accumulate across remounts',
      'Anonymous function passed to addEventListener cannot be removed with removeEventListener',
    ],
    explanation:
      'Store the handler in a named variable, return a cleanup: `return () => window.removeEventListener("keydown", handler)`.',
  },
  {
    id: 'rd-09',
    title: 'useMemo Dependency Bug',
    description: 'Expensive computation runs on every render despite useMemo.',
    code: `function DataTable({ rows, filters }: { rows: Row[]; filters: Filter[] }) {
  const filtered = useMemo(() => {
    return rows.filter(row =>
      filters.every(f => row[f.key] === f.value)
    );
  }, [rows]);

  return <Table data={filtered} />;
}`,
    solution: `function DataTable({ rows, filters }: { rows: Row[]; filters: Filter[] }) {
  // Fix: add filters to the dependency array
  const filtered = useMemo(() => {
    return rows.filter(row =>
      filters.every(f => row[f.key] === f.value)
    );
  }, [rows, filters]);

  return <Table data={filtered} />;
}`,
    bugs: [
      '`filters` is missing from useMemo dependency array — when filters change, the memo does not recompute, showing stale filtered data',
    ],
    explanation:
      'Add `filters` to the dependency array: `[rows, filters]`.',
  },
  {
    id: 'rd-10',
    title: 'useRef vs useState Confusion',
    description: 'A form that tracks whether it has been modified. The "unsaved changes" badge never appears.',
    code: `function EditForm() {
  const isDirty = useRef(false);

  const handleChange = () => {
    isDirty.current = true;
  };

  return (
    <form>
      {isDirty.current && <span>Unsaved changes</span>}
      <input onChange={handleChange} />
    </form>
  );
}`,
    solution: `function EditForm() {
  // Fix: use useState so changes trigger a re-render
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = () => {
    setIsDirty(true);
  };

  return (
    <form>
      {isDirty && <span>Unsaved changes</span>}
      <input onChange={handleChange} />
    </form>
  );
}`,
    bugs: [
      'Changing `ref.current` does not trigger a re-render — the badge condition is evaluated but never causes the component to update',
    ],
    explanation:
      'Use `useState` for values that should trigger re-renders. `useRef` is for values you need to persist across renders *without* causing them (e.g., DOM refs, timer ids).',
  },
  {
    id: 'rd-11',
    title: 'Context Causing Unnecessary Re-renders',
    description: 'Every component consuming this context re-renders when any part of the context changes.',
    code: `const AppContext = createContext({});

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  return (
    <AppContext.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}`,
    solution: `const AppContext = createContext({});

function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');

  // Fix: memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ user, setUser, theme, setTheme }),
    [user, theme]
  );

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}`,
    bugs: [
      'A new object is created as the value on every render — all consumers re-render even if only `theme` changed while a component only uses `user`',
      'No useMemo on the context value',
    ],
    explanation:
      'Wrap value with `useMemo(() => ({ user, setUser, theme, setTheme }), [user, theme])`. Better: split into separate contexts for unrelated state.',
  },
  {
    id: 'rd-12',
    title: 'Promise in useEffect Without Async/Await Handling',
    description: 'Data loads correctly but error states are never shown.',
    code: `function Article({ id }: { id: string }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(async () => {
    const res = await fetch(\`/api/articles/\${id}\`);
    const json = await res.json();
    setData(json);
  }, [id]);

  if (error) return <div>Error</div>;
  return <div>{data?.title}</div>;
}`,
    solution: `function Article({ id }: { id: string }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fix 1: define inner async function instead of async effect
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch(\`/api/articles/\${id}\`);
        const json = await res.json();
        if (!ignore) setData(json);
      } catch (e: any) {
        // Fix 2: catch errors and set error state
        if (!ignore) setError(e);
      }
    };
    load();
    // Fix 3: cleanup to avoid state updates after unmount
    return () => { ignore = true; };
  }, [id]);

  if (error) return <div>Error</div>;
  return <div>{data?.title}</div>;
}`,
    bugs: [
      '`useEffect` callback is `async` — it returns a Promise, but useEffect expects either undefined or a cleanup function. This causes a React warning and cleanup never runs.',
      'No error handling — failed fetch never calls `setError`',
      'No abort/cleanup for ongoing fetch when `id` changes',
    ],
    explanation:
      'Define an inner async function and call it: `useEffect(() => { const load = async () => { try { ... } catch(e) { setError(e) } }; load(); }, [id])`.',
  },
  {
    id: 'rd-13',
    title: 'Batched State Update Misconception',
    description: 'After clicking the button, the displayed total is always one step behind.',
    code: `function Cart() {
  const [items, setItems] = useState<number[]>([]);
  const [total, setTotal] = useState(0);

  const addItem = (price: number) => {
    setItems([...items, price]);
    setTotal(items.reduce((sum, p) => sum + p, 0) + price);
  };

  return (
    <div>
      <button onClick={() => addItem(10)}>Add $10</button>
      <div>Total: {total}</div>
    </div>
  );
}`,
    solution: `function Cart() {
  const [items, setItems] = useState<number[]>([]);

  const addItem = (price: number) => {
    setItems(prev => [...prev, price]);
  };

  // Fix: total is derived state — compute it directly, no useState needed
  const total = items.reduce((sum, p) => sum + p, 0);

  return (
    <div>
      <button onClick={() => addItem(10)}>Add \$10</button>
      <div>Total: {total}</div>
    </div>
  );
}`,
    bugs: [
      '`total` is computed from `items` before the state update is applied — `items` inside `addItem` is still the old array',
      'Total is derived state — it should not be stored in a separate `useState` at all',
    ],
    explanation:
      'Remove `total` state and compute it inline: `const total = items.reduce((sum, p) => sum + p, 0)`. Derived state leads to sync bugs.',
  },
  {
    id: 'rd-14',
    title: 'Stale Props in Custom Hook',
    description: 'A custom hook that debounces a callback. The debounced function always uses the initial value of the callback.',
    code: `function useDebounce(callback: () => void, delay: number) {
  useEffect(() => {
    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  }, [delay]);
}

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  useDebounce(() => onSearch(query), 500);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`,
    solution: `function useDebounce(callback: () => void, delay: number) {
  // Fix: store latest callback in a ref to avoid stale closure
  const callbackRef = useRef(callback);
  useEffect(() => { callbackRef.current = callback; });

  useEffect(() => {
    const id = setTimeout(() => callbackRef.current(), delay);
    return () => clearTimeout(id);
  }, [delay]); // delay changes reset the timer; callback is always fresh via ref
}

function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState('');
  useDebounce(() => onSearch(query), 500);
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}`,
    bugs: [
      '`callback` is missing from useEffect dependency array in `useDebounce` — the timeout always calls the initial callback closure, with stale `query`',
    ],
    explanation:
      'Add `callback` to the dependency array. Or use the `useRef` pattern to always hold the latest callback without re-creating the timeout.',
  },
  {
    id: 'rd-15',
    title: 'Key Prop on Fragment',
    description: 'A list that re-orders items causes unexpected DOM behavior and animation glitches.',
    code: `function List({ items }: { items: { id: string; name: string; detail: string }[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <>
          <li>{item.name}</li>
          <li>{item.detail}</li>
        </>
      ))}
    </ul>
  );
}`,
    solution: `import { Fragment } from 'react';

function List({ items }: { items: { id: string; name: string; detail: string }[] }) {
  return (
    <ul>
      {items.map((item) => (
        // Fix: use Fragment with key (shorthand <> cannot take a key)
        <Fragment key={item.id}>
          <li>{item.name}</li>
          <li>{item.detail}</li>
        </Fragment>
      ))}
    </ul>
  );
}`,
    bugs: [
      'No `key` prop on the Fragment — React cannot track which group of `<li>` elements belongs to which item when the list re-orders',
      'Using index as implicit key (no key at all) means re-ordering causes wrong elements to update',
    ],
    explanation:
      'Use `<Fragment key={item.id}>` (not shorthand `<>`) to attach a key to the fragment.',
  },
  {
    id: 'rd-16',
    title: 'Controlled vs Uncontrolled Input',
    description: 'The input field becomes uncontrolled intermittently. React warns about switching between controlled and uncontrolled.',
    code: `function ProfileForm({ initialName }: { initialName?: string }) {
  const [name, setName] = useState(initialName);

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}`,
    solution: `function ProfileForm({ initialName }: { initialName?: string }) {
  // Fix: fallback to empty string so value is never undefined
  const [name, setName] = useState(initialName ?? '');

  return (
    <input
      value={name}
      onChange={e => setName(e.target.value)}
    />
  );
}`,
    bugs: [
      'If `initialName` is `undefined`, `name` initializes to `undefined`, making the input uncontrolled. When it later becomes a string, React warns about switching modes.',
    ],
    explanation:
      'Initialize with a fallback: `useState(initialName ?? "")`. A controlled input must always have a string (or null) value, never undefined.',
  },
  {
    id: 'rd-17',
    title: 'React.memo Fails Due to Unstable Props',
    description: 'A memoized child component re-renders on every parent render despite React.memo. Find why memoization is not working.',
    code: `const Child = React.memo(({ onClick, style }: {
  onClick: () => void;
  style: React.CSSProperties;
}) => {
  console.log('Child rendered');
  return <button style={style} onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span>{count}</span>
      <Child
        onClick={() => setCount(c => c + 1)}
        style={{ color: 'blue' }}
      />
    </div>
  );
}`,
    solution: `const Child = React.memo(({ onClick, style }: {
  onClick: () => void;
  style: React.CSSProperties;
}) => {
  console.log('Child rendered');
  return <button style={style} onClick={onClick}>Click</button>;
});

function Parent() {
  const [count, setCount] = useState(0);

  // Fix 1: stable callback reference with useCallback
  const handleClick = useCallback(() => setCount(c => c + 1), []);

  // Fix 2: stable object reference with useMemo
  const buttonStyle = useMemo(() => ({ color: 'blue' }), []);

  return (
    <div>
      <span>{count}</span>
      <Child onClick={handleClick} style={buttonStyle} />
    </div>
  );
}`,
    bugs: [
      'Inline arrow function `() => setCount(...)` creates a new function reference on every render — React.memo shallow-compares props and sees a new onClick each time',
      'Inline object `{ color: "blue" }` creates a new object reference on every render — same issue for style prop',
    ],
    explanation:
      'React.memo uses shallow equality. Any prop that is an object or function must have a stable reference. Wrap callbacks in `useCallback` and objects in `useMemo`.',
  },
  {
    id: 'rd-18',
    title: 'forwardRef Type Mismatch',
    description: 'A custom input component using forwardRef. TypeScript errors when passing the ref from the parent.',
    code: `const FancyInput = React.forwardRef((props: { placeholder: string }, ref) => {
  return <input ref={ref} placeholder={props.placeholder} />;
});

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return <FancyInput ref={inputRef} placeholder="Enter text" />;
}`,
    solution: `// Fix: type the ref parameter explicitly in forwardRef
const FancyInput = React.forwardRef<HTMLInputElement, { placeholder: string }>(
  (props, ref) => {
    return <input ref={ref} placeholder={props.placeholder} />;
  }
);

function Form() {
  const inputRef = useRef<HTMLInputElement>(null);

  return <FancyInput ref={inputRef} placeholder="Enter text" />;
}`,
    bugs: [
      '`forwardRef` is not given type parameters — `ref` is typed as `React.ForwardedRef<unknown>`, which is incompatible with `RefObject<HTMLInputElement>`',
    ],
    explanation:
      'Pass type parameters to `forwardRef`: `React.forwardRef<HTMLInputElement, Props>`. The first type is the ref element, the second is props.',
  },
  {
    id: 'rd-19',
    title: 'useReducer State Mutation',
    description: 'A useReducer-based form. Some field updates do not trigger re-renders.',
    code: `type State = { name: string; email: string; tags: string[] };
type Action = { type: 'setField'; field: keyof State; value: any };

function reducer(state: State, action: Action): State {
  if (action.type === 'setField') {
    state[action.field] = action.value; // mutate directly
    return state;
  }
  return state;
}

function Form() {
  const [form, dispatch] = useReducer(reducer, { name: '', email: '', tags: [] });
  return (
    <input
      value={form.name}
      onChange={e => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
    />
  );
}`,
    solution: `type State = { name: string; email: string; tags: string[] };
type Action = { type: 'setField'; field: keyof State; value: any };

function reducer(state: State, action: Action): State {
  if (action.type === 'setField') {
    // Fix: return a new state object instead of mutating
    return { ...state, [action.field]: action.value };
  }
  return state;
}

function Form() {
  const [form, dispatch] = useReducer(reducer, { name: '', email: '', tags: [] });
  return (
    <input
      value={form.name}
      onChange={e => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
    />
  );
}`,
    bugs: [
      'Reducer mutates state directly and returns the same reference — React bails out of re-render because the reference has not changed',
    ],
    explanation:
      'Reducers must be pure and return a new object. Use spread: `return { ...state, [action.field]: action.value }`.',
  },
  {
    id: 'rd-20',
    title: 'Suspense Without Error Boundary',
    description: 'A lazy-loaded component setup that crashes the entire page on network error instead of showing a fallback.',
    code: `const HeavyChart = React.lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HeavyChart />
    </Suspense>
  );
}`,
    solution: `const HeavyChart = React.lazy(() => import('./HeavyChart'));

// Fix: wrap with an ErrorBoundary to catch import/render failures
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function Dashboard() {
  return (
    <ErrorBoundary fallback={<div>Failed to load chart.</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <HeavyChart />
      </Suspense>
    </ErrorBoundary>
  );
}`,
    bugs: [
      '`React.lazy` can throw if the dynamic import fails (network error, chunk not found) — without an ErrorBoundary, this crashes the entire component tree',
      '`Suspense` only handles the loading state, not error states',
    ],
    explanation:
      'Always pair `React.lazy` + `Suspense` with an `ErrorBoundary`. Suspense handles pending state; ErrorBoundary handles rejection.',
  },
  {
    id: 'rd-21',
    title: 'Custom Hook Unstable Return Value',
    description: 'A custom hook returns an object. Components using it re-render more than necessary.',
    code: `function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return { width: size.width, height: size.height };
}

const MemoComponent = React.memo(({ size }: { size: { width: number; height: number } }) => {
  return <div>{size.width}x{size.height}</div>;
});

function App() {
  const size = useWindowSize();
  return <MemoComponent size={size} />;
}`,
    solution: `function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Fix: return primitives directly instead of a new object each call
  // This allows consumers to destructure and only re-render when values change
  return size; // return the state object directly — same reference unless resize fires
}

const MemoComponent = React.memo(({ width, height }: { width: number; height: number }) => {
  return <div>{width}x{height}</div>;
});

function App() {
  const { width, height } = useWindowSize();
  // Fix: pass primitives so React.memo shallow comparison works
  return <MemoComponent width={width} height={height} />;
}`,
    bugs: [
      'Hook returns a new object literal `{ width: size.width, height: size.height }` every call — even if values are the same, the reference is new, defeating React.memo',
    ],
    explanation:
      'Return the state object directly (same reference between resizes) or return primitives. Creating a new object at the return site breaks referential equality for memoized consumers.',
  },
  {
    id: 'rd-22',
    title: 'useEffect Dependency: Function from Props',
    description: 'A component calls a prop callback inside useEffect but the ESLint rule is disabled. Identify the real problem.',
    code: `function DataFetcher({ onData }: { onData: (data: any) => void }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(r => r.json())
      .then(result => {
        setData(result);
        onData(result);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>{JSON.stringify(data)}</div>;
}`,
    solution: `function DataFetcher({ onData }: { onData: (data: any) => void }) {
  const [data, setData] = useState(null);

  // Fix: store the latest onData in a ref to avoid re-triggering the effect
  const onDataRef = useRef(onData);
  useEffect(() => { onDataRef.current = onData; });

  useEffect(() => {
    let ignore = false;
    fetch('/api/data')
      .then(r => r.json())
      .then(result => {
        if (ignore) return;
        setData(result);
        onDataRef.current(result); // always calls latest version
      });
    return () => { ignore = true; };
  }, []); // safe — onData is accessed via stable ref

  return <div>{JSON.stringify(data)}</div>;
}`,
    bugs: [
      '`onData` is used inside the effect but omitted from deps via eslint-disable — if the parent passes a new function reference, the effect uses the stale initial version',
      'Disabling the eslint rule masks the real problem instead of fixing it',
    ],
    explanation:
      'The correct fix is the "event handler ref" pattern: store the prop in a ref that is updated on every render, then call `ref.current()` inside the effect. This gives access to the latest version without re-triggering the effect.',
  },
  {
    id: 'rd-23',
    title: 'Prop Drilling vs Context — Stale Context Value',
    description: 'A theme toggle works visually but child components deep in the tree do not re-render when theme changes.',
    code: `const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
      <Page />
    </ThemeContext.Provider>
  );
}

const Page = React.memo(() => <DeepChild />);
const DeepChild = React.memo(() => {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
});`,
    solution: `const ThemeContext = createContext('light');

function App() {
  const [theme, setTheme] = useState('light');

  return (
    <ThemeContext.Provider value={theme}>
      <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
        Toggle
      </button>
      {/* Fix: Page should NOT be memoized if it renders context consumers
          OR pass theme as a prop so memo can compare it */}
      <Page />
    </ThemeContext.Provider>
  );
}

// Fix: remove React.memo from Page, or don't memo intermediate components
// that don't receive the context value directly but render consumers
const Page = () => <DeepChild />;

// DeepChild is fine with memo — useContext causes it to re-render when context changes
const DeepChild = React.memo(() => {
  const theme = useContext(ThemeContext);
  return <div className={theme}>Content</div>;
});`,
    bugs: [
      '`Page` is wrapped in `React.memo` with no props — it never re-renders, so it never re-renders `DeepChild`, even though `DeepChild` consumes context that changed',
      'Context updates bypass `React.memo` only for the direct consumer — intermediate memoized components that do not consume context block the update from propagating',
    ],
    explanation:
      'Context changes do NOT bypass React.memo on intermediate components that do not consume that context. Only the component calling `useContext` gets forced to re-render. Remove memo from `Page` or restructure so consumers are not blocked by memoized ancestors.',
  },
  {
    id: 'rd-24',
    title: 'startTransition Misuse',
    description: 'A search input uses startTransition for the query update, causing the input to feel laggy.',
    code: `function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    startTransition(() => {
      setQuery(e.target.value);
    });
  };

  useEffect(() => {
    setResults(expensiveFilter(query));
  }, [query]);

  return (
    <>
      <input value={query} onChange={handleChange} />
      <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>
    </>
  );
}`,
    solution: `function Search() {
  const [query, setQuery] = useState('');
  const [deferredQuery, setDeferredQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Fix: update the controlled input state immediately (urgent)
    setQuery(e.target.value);
    // Mark the expensive derived state update as non-urgent
    startTransition(() => {
      setDeferredQuery(e.target.value);
    });
  };

  useEffect(() => {
    setResults(expensiveFilter(deferredQuery));
  }, [deferredQuery]);

  return (
    <>
      <input value={query} onChange={handleChange} />
      <ul>{results.map(r => <li key={r}>{r}</li>)}</ul>
    </>
  );
}`,
    bugs: [
      '`setQuery` (the controlled input value) is wrapped in `startTransition` — React may defer updating the input, making it feel unresponsive to typing',
      'Controlled input state updates must always be urgent — only the expensive filtering should be deferred',
    ],
    explanation:
      'Use two state values: one for the input (always urgent) and one for the expensive computation (wrapped in startTransition). Never wrap the state that drives a controlled input in a transition.',
  },
  {
    id: 'rd-25',
    title: 'Portal Event Bubbling Surprise',
    description: 'A modal rendered with a Portal unexpectedly triggers parent onClick handlers. Explain and fix.',
    code: `function Modal({ onClose }: { onClose: () => void }) {
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content">
        <p>Modal content</p>
      </div>
    </div>,
    document.body
  );
}

function App() {
  const [open, setOpen] = useState(false);

  return (
    <div onClick={() => console.log('App clicked!')}>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </div>
  );
}`,
    solution: `function Modal({ onClose }: { onClose: () => void }) {
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        // Fix: stop propagation so clicks inside content don't close modal
        // AND don't bubble to React tree ancestors
        onClick={e => e.stopPropagation()}
      >
        <p>Modal content</p>
      </div>
    </div>,
    document.body
  );
}

function App() {
  const [open, setOpen] = useState(false);

  return (
    // Note: React portals bubble through the React component tree,
    // NOT the DOM tree. Clicks inside the portal still reach this div.
    <div onClick={() => console.log('App clicked!')}>
      <button onClick={() => setOpen(true)}>Open</button>
      {open && <Modal onClose={() => setOpen(false)} />}
    </div>
  );
}`,
    bugs: [
      'React Portal events bubble through the React component tree (not DOM tree) — clicks inside the modal bubble up to the App div\'s onClick handler',
      'Clicking inside modal-content also triggers onClose because the click bubbles to modal-overlay',
    ],
    explanation:
      'Portal DOM position does not affect React event bubbling. Events still propagate up through the React component hierarchy. Use `e.stopPropagation()` on the modal content to prevent both closing on inner clicks and bubbling to parent React components.',
  },
  {
    id: 'rd-26',
    title: 'High-Frequency Sensor Data — setState Overload',
    description: 'A component subscribes to a 100Hz sensor topic over WebSocket. The UI becomes janky and React warns about too many state updates. Find the performance bug.',
    tags: ['Foxglove'],
    code: `interface SensorMessage {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

function SensorFeed({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<SensorMessage[]>([]);

  useEffect(() => {
    const ws = new WebSocket(\`wss://robot.local/topics/\${topic}\`);
    ws.onmessage = (e) => {
      const msg: SensorMessage = JSON.parse(e.data);
      setMessages(prev => [...prev, msg]); // fires ~100x per second
    };
    return () => ws.close();
  }, [topic]);

  return (
    <div style={{ height: 400, overflow: 'auto' }}>
      {messages.slice(-50).map((m, i) => (
        <div key={i}>{m.timestamp.toFixed(3)}: x={m.x} y={m.y} z={m.z}</div>
      ))}
    </div>
  );
}`,
    solution: `interface SensorMessage {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

function SensorFeed({ topic }: { topic: string }) {
  const [messages, setMessages] = useState<SensorMessage[]>([]);
  // Fix 1: buffer incoming messages in a ref — no re-render per message
  const bufferRef = useRef<SensorMessage[]>([]);

  useEffect(() => {
    const ws = new WebSocket(\`wss://robot.local/topics/\${topic}\`);
    ws.onmessage = (e) => {
      // Fix 2: accumulate in buffer instead of calling setState directly
      bufferRef.current.push(JSON.parse(e.data));
    };

    // Fix 3: flush to state at most once per animation frame (~60fps)
    let rafId: number;
    const flush = () => {
      if (bufferRef.current.length > 0) {
        const batch = bufferRef.current.splice(0);
        setMessages(prev => [...prev, ...batch].slice(-50));
      }
      rafId = requestAnimationFrame(flush);
    };
    rafId = requestAnimationFrame(flush);

    return () => {
      ws.close();
      cancelAnimationFrame(rafId);
    };
  }, [topic]);

  return (
    <div style={{ height: 400, overflow: 'auto' }}>
      {messages.map((m, i) => (
        <div key={i}>{m.timestamp.toFixed(3)}: x={m.x} y={m.y} z={m.z}</div>
      ))}
    </div>
  );
}`,
    bugs: [
      'setState called inside onmessage at 100Hz — triggers ~100 re-renders per second, overwhelming React\'s scheduler',
      'Spreading a new array on every message at high frequency creates excessive GC pressure',
    ],
    explanation:
      'Buffer messages in a ref (no re-render on write) and flush to state at most once per requestAnimationFrame (~60fps). This decouples the data ingestion rate from the render rate — critical for any high-frequency data stream.',
  },
  {
    id: 'rd-27',
    title: 'Timeline Scrubber — Missing useDeferredValue',
    description: 'A robot log timeline scrubber previews 3D sensor frames. Dragging the slider is laggy because the expensive visualization re-renders synchronously on every pixel of movement.',
    tags: ['Foxglove'],
    code: `interface Frame {
  timestamp: number;
  pointCloud: Float32Array; // thousands of 3D points
}

function TimelineScrubber({ frames }: { frames: Frame[] }) {
  const [index, setIndex] = useState(0);

  return (
    <div>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={index}
        onChange={e => setIndex(Number(e.target.value))}
      />
      <span>{frames[index]?.timestamp.toFixed(3)}s</span>
      {/* Expensive: re-renders thousands of 3D points on every scrub */}
      <PointCloudViewer frame={frames[index]} />
    </div>
  );
}`,
    solution: `interface Frame {
  timestamp: number;
  pointCloud: Float32Array;
}

function TimelineScrubber({ frames }: { frames: Frame[] }) {
  const [index, setIndex] = useState(0);
  // Fix: defer the expensive visualization — slider stays responsive
  const deferredIndex = useDeferredValue(index);
  const isStale = deferredIndex !== index;

  return (
    <div>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={index}
        onChange={e => setIndex(Number(e.target.value))}
      />
      {/* Timestamp display uses urgent index — always up to date */}
      <span>{frames[index]?.timestamp.toFixed(3)}s</span>
      {/* Visualization uses deferred index — React can skip renders while scrubbing */}
      <div style={{ opacity: isStale ? 0.6 : 1, transition: 'opacity 0.1s' }}>
        <PointCloudViewer frame={frames[deferredIndex]} />
      </div>
    </div>
  );
}`,
    bugs: [
      'PointCloudViewer re-renders synchronously on every onChange — blocks the main thread and makes the slider unresponsive',
      'The urgent update (slider position) is coupled to the non-urgent visualization render',
    ],
    explanation:
      'useDeferredValue marks a value as non-urgent — React renders the urgent update (slider, timestamp) immediately and defers the PointCloudViewer. While the deferred value lags behind, show a stale indicator. useDeferredValue is ideal when you want the UI to stay responsive while a slow component catches up.',
  },
  {
    id: 'rd-28',
    title: 'Unvirtualized Log List',
    description: 'A log viewer renders all messages from a robot session. With 50,000 entries the browser freezes on load. Fix it with manual windowing — no external library.',
    tags: ['Foxglove'],
    code: `interface LogEntry {
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

function LogViewer({ logs }: { logs: LogEntry[] }) {
  return (
    <div style={{ height: 500, overflow: 'auto', fontFamily: 'monospace' }}>
      {logs.map((log, i) => (
        <div key={i} style={{ height: 28, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#888' }}>{log.timestamp.toFixed(3)}</span>
          <span>{log.level}</span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  );
}`,
    solution: `interface LogEntry {
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
}

const ROW_HEIGHT = 28;
const CONTAINER_HEIGHT = 500;
const OVERSCAN = 5; // render extra rows above/below viewport

function LogViewer({ logs }: { logs: LogEntry[] }) {
  const [scrollTop, setScrollTop] = useState(0);

  // Fix: compute which rows are visible
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(CONTAINER_HEIGHT / ROW_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(logs.length, startIndex + visibleCount);
  const visibleLogs = logs.slice(startIndex, endIndex);

  return (
    <div
      style={{ height: CONTAINER_HEIGHT, overflow: 'auto', fontFamily: 'monospace' }}
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Spacer gives the scrollbar the correct total height */}
      <div style={{ height: logs.length * ROW_HEIGHT, position: 'relative' }}>
        {visibleLogs.map((log, i) => (
          <div
            key={startIndex + i}
            style={{
              position: 'absolute',
              top: (startIndex + i) * ROW_HEIGHT,
              height: ROW_HEIGHT,
              width: '100%',
              display: 'flex',
              gap: 8,
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#888' }}>{log.timestamp.toFixed(3)}</span>
            <span>{log.level}</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}`,
    bugs: [
      'All 50,000 log entries are rendered as DOM nodes at once — browsers freeze creating and laying out that many elements',
      'Memory and layout cost is O(total items) instead of O(visible items)',
    ],
    explanation:
      'Virtualization only renders rows visible in the viewport plus an overscan buffer. A spacer div gives the scrollbar the correct total height. Only ~20-30 DOM nodes exist at any time regardless of list size. This is the core of libraries like react-virtual and react-window.',
  },
  {
    id: 'rd-29',
    title: 'Heavy Parsing Blocks the Main Thread',
    description: 'Loading a robot log file parses thousands of binary sensor messages. The UI freezes and progress bar stops updating during parsing. Fix it with a Web Worker.',
    tags: ['Foxglove'],
    code: `interface Frame {
  timestamp: number;
  data: Float32Array;
}

// parseMcapFile: CPU-intensive binary deserialization — takes 2-5 seconds
declare function parseMcapFile(buffer: ArrayBuffer): Frame[];

function McapFileLoader() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('loading'); // progress bar should appear here
    const buffer = await file.arrayBuffer();
    // Bug: blocks the main thread — progress bar never renders
    const parsed = parseMcapFile(buffer);
    setFrames(parsed);
    setStatus('done');
  };

  return (
    <div>
      <input type="file" accept=".mcap" onChange={handleFile} />
      {status === 'loading' && <div>Parsing file...</div>}
      {status === 'done' && <div>{frames.length} frames loaded</div>}
    </div>
  );
}`,
    solution: `interface Frame {
  timestamp: number;
  data: Float32Array;
}

// mcap-worker.ts (separate file):
// self.onmessage = (e: MessageEvent<ArrayBuffer>) => {
//   const frames = parseMcapFile(e.data);
//   self.postMessage(frames);
// };

function McapFileLoader() {
  const [frames, setFrames] = useState<Frame[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Fix 1: create worker once on mount
    workerRef.current = new Worker(new URL('./mcap-worker.ts', import.meta.url));
    workerRef.current.onmessage = (e: MessageEvent<Frame[]>) => {
      setFrames(e.data);
      setStatus('done');
    };
    return () => workerRef.current?.terminate();
  }, []);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workerRef.current) return;
    setStatus('loading');
    const buffer = await file.arrayBuffer();
    // Fix 2: transfer buffer to worker thread (zero-copy)
    workerRef.current.postMessage(buffer, [buffer]);
    // Main thread is now free — progress bar renders normally
  };

  return (
    <div>
      <input type="file" accept=".mcap" onChange={handleFile} />
      {status === 'loading' && <div>Parsing file...</div>}
      {status === 'done' && <div>{frames.length} frames loaded</div>}
    </div>
  );
}`,
    bugs: [
      'CPU-intensive parsing runs on the main thread — async/await only yields for I/O, not CPU work — the UI freezes until parsing completes',
      'setStatus(\'loading\') never causes a visible render because the main thread is immediately blocked by parseMcapFile',
    ],
    explanation:
      'Web Workers run on a separate OS thread, keeping the main thread free. Pass the ArrayBuffer as a Transferable (`postMessage(buffer, [buffer])`) for zero-copy handoff — the buffer is moved, not copied, so even large files transfer instantly. The worker sends results back via postMessage.',
  },
  {
    id: 'rd-30',
    title: 'SVG Point Cloud — DOM Node Overload',
    description: 'A LiDAR point cloud visualization renders 20,000 points as SVG circles. The page becomes unresponsive. Switch to Canvas for scalable rendering.',
    tags: ['Foxglove'],
    code: `interface Point {
  x: number;
  y: number;
  intensity: number; // 0–255
}

function PointCloudPlot({
  points,
  width = 800,
  height = 600,
}: {
  points: Point[];
  width?: number;
  height?: number;
}) {
  return (
    <svg width={width} height={height} style={{ background: '#000' }}>
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={1.5}
          fill={\`rgb(\${p.intensity},\${p.intensity},255)\`}
          opacity={0.8}
        />
      ))}
    </svg>
  );
}`,
    solution: `interface Point {
  x: number;
  y: number;
  intensity: number;
}

function PointCloudPlot({
  points,
  width = 800,
  height = 600,
}: {
  points: Point[];
  width?: number;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fix: draw all points as canvas commands — no DOM nodes per point
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    for (const p of points) {
      const v = p.intensity;
      ctx.fillStyle = \`rgb(\${v},\${v},255)\`;
      // fillRect faster than arc for small points at this density
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
  }, [points, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} />;
}`,
    bugs: [
      'Each of 20,000 points creates an SVG <circle> DOM node — browsers freeze on layout, paint, and hit-testing that many elements',
      'React reconciles 20,000 SVG nodes on every points update — O(n) diffing cost per frame',
    ],
    explanation:
      'Canvas renders by issuing draw commands with no DOM node per element. Painting 20,000 points via Canvas 2D API is nearly instant. Rule of thumb: use SVG for small-count interactive graphics (hover, click targets). Use Canvas or WebGL for high-density data visualization (point clouds, heatmaps, waveforms).',
  },
];
