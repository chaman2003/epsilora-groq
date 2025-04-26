# Avoiding Temporal Dead Zone (TDZ) Errors in React

This document provides best practices for preventing "Cannot access variable before initialization" errors (also known as Temporal Dead Zone errors) in your React components.

## What is a Temporal Dead Zone (TDZ)?

The Temporal Dead Zone is the area of a block where a variable is inaccessible until the moment the computer completely initializes it with a value. 
Accessing the variable in this zone results in a `ReferenceError`.

Example of TDZ error:
```javascript
// This will cause a TDZ error
console.log(x); // Cannot access 'x' before initialization
const x = 5;
```

## Common Causes of TDZ Errors in React

1. **Using variables before their declaration in component code**
2. **Variable hoisting confusion (let/const don't hoist like var)**
3. **Accessing state variables before they're initialized**
4. **Complex destructuring patterns**
5. **Code splitting and lazy loading issues**
6. **Circular dependencies**

## Best Practices to Avoid TDZ Errors

### 1. Always declare variables at the top of their scope

```javascript
// BAD
function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  // other code...
  
  const data = processData(); // Using data before declaration
  
  // other code...
  
  const processData = () => {
    // data processing logic
  };
}

// GOOD
function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  const processData = () => {
    // data processing logic
  };
  
  // other code...
  
  const data = processData(); // Now processData is already defined
}
```

### 2. Initialize all variables with default values

```javascript
// BAD
function MyComponent() {
  const [data, setData] = useState(null);
  
  let formattedData;
  if (data) {
    formattedData = data.map(item => item.name);
  }
  
  // Using formattedData without ensuring it's initialized
}

// GOOD
function MyComponent() {
  const [data, setData] = useState(null);
  
  // Initialize with a default value
  let formattedData = [];
  if (data) {
    formattedData = data.map(item => item.name);
  }
}
```

### 3. Use the safe variable utilities

Import the utility functions from `src/utils/safeVariables.ts`:

```javascript
import { safeString, safeArray, ensureInitialized } from '../utils/safeVariables';

function MyComponent() {
  const name = safeString(user?.name); // Ensures name is always a string
  const items = safeArray(data?.items); // Ensures items is always an array
  
  // Ensure a variable has a value before using it
  const config = ensureInitialized(loadedConfig, defaultConfig);
}
```

### 4. Wrap complex components with SafeRender

For components with complex state and initialization, use the SafeRender wrapper:

```javascript
import SafeRender from '../components/SafeRender';

function ComplexComponent() {
  // Component with many variables and potential TDZ issues
  
  return (
    <SafeRender fallback={<LoadingSpinner />}>
      {/* Your component content */}
    </SafeRender>
  );
}
```

### 5. Avoid reference before initialization in JSX

```javascript
// BAD
function MyComponent() {
  return (
    <div>
      {items.map(item => <span>{item}</span>)} {/* Using items before declaration */}
    </div>
  );
  
  const [items, setItems] = useState([]);
}

// GOOD
function MyComponent() {
  const [items, setItems] = useState([]);
  
  return (
    <div>
      {items.map(item => <span>{item}</span>)}
    </div>
  );
}
```

### 6. Use ErrorBoundary components

Wrap sections of your app with ErrorBoundary components to catch and handle TDZ errors gracefully:

```javascript
import ErrorBoundary from '../components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponentThatMightHaveTDZIssues />
    </ErrorBoundary>
  );
}
```

### 7. Prefer function declarations over expressions for important functions

```javascript
// BAD - Using a function expression that's not hoisted
const MyComponent = () => {
  const result = calculateTotal(); // TDZ error if used before declaration
  
  const calculateTotal = () => {
    // calculation logic
  };
};

// GOOD - Using a function declaration that's hoisted
function MyComponent() {
  // Function declarations are hoisted
  function calculateTotal() {
    // calculation logic
  }
  
  const result = calculateTotal(); // Works fine
}
```

## Debugging TDZ Errors

1. **Use Source Maps**: Enable source maps in your build to get better error information
2. **Check the error stack trace**: Look for the specific line causing the error
3. **Use browser DevTools**: Set breakpoints to inspect variable state
4. **Add console logs**: Log variables to check their initialization status

## Additional Resources

- [MDN Web Docs: Temporal Dead Zone](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let#Temporal_Dead_Zone)
- [JavaScript Variables Lifecycle: Why let Is Not Hoisted](https://dmitripavlutin.com/variables-lifecycle-and-why-let-is-not-hoisted/)
- [Understanding the Temporal Dead Zone in JavaScript](https://www.freecodecamp.org/news/what-is-the-temporal-dead-zone/) 