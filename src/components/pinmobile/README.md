# PinMobile Component

A mobile-first virtual numeric keypad used for lock screens, authentication walls, and application PIN setup flows. It supports both physical keyboard capture and native on-screen touch taps.

## Features
* **Immediate Auto-Submit Pipeline**: Tracks the length of the string array reactively. The moment the current input length matches the configured boundary limit, it waits for the next DOM update frame (`nextTick`) and dispatches the payload instantly.
* **Global Hardware Key Interceptor**: Adds a global event listener on mount to intercept numerical key strokes (`0-9`), `Backspace` (for single character deletion), and `Escape`/`Delete` (for complete form wipes).
* **State Exposure Blueprint**: Leverages `defineExpose` to safely bubble up the `clearAll` function instance macro so parent layout blocks can force reset inputs (e.g., following an incorrect validation attempt).
* **High-Response Grid Architecture**: Employs a circular CSS grid system with optimized active tap highlight feedback transitions to provide a responsive feel inside Android WebView wrappers.

## Component Properties (Props)

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `length` | `Number` | No | `4` | Total numeric limit constraint required before a submission event is fired. |
| `title` | `String` | No | `'Enter PIN'` | Header typography layout label string rendered above the input tracking panel. |
| `errorMessage` | `String` | No | `''` | High-visibility warning text string displayed during validation rejection flags. |

## Component Events (Emits)
* **`@submit`**: Dispatches the fully assembled plain-text input string once the value length hits the defined cutoff size.

## Component Methods (Exposed)
* **`clearAll()`**: Forces the inner input string instance back to a blank map state (`''`).

## Integration Usage
```html
<PinMobile
  ref="pinKeypadRef"
  :length="4"
  title="Enter Security Passcode"
  :error-message="authErrorText"
  @submit="verifyPasscode"
/>
```

