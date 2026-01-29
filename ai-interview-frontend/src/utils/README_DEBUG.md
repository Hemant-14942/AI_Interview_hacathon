# Debug utility (Hinglish)

`src/utils/debug.js` – console logs in Hinglish/desi style for easy debugging and code review.

## Usage

```js
import debug from "../utils/debug";

// Component load – "Yahan pe kya ho raha hai"
debug.component("ComponentName", "Screen load – short message", optionalData);

// API call – "Backend ko bhej rahe hain"
debug.api("Request bhej rahe hain", "POST /auth/login", payload);

// API response – "Backend se ye aaya"
debug.apiResponse("GET /interviews/123", 200, data);

// User action – "User ne ye kiya"
debug.action("ComponentName", "Button click – next question");

// Flow step – "Ab flow yahan hai"
debug.flow("Interview complete – result pe jaa rahe hain", { id });

// Warnings (always show)
debug.warn("ComponentName", "Resume nahi hai – user ko bata rahe hain");

// Errors (always show)
debug.error("ComponentName", "Backend se error aaya", err);
```

## When logs show

- **Development:** All logs (component, api, action, flow) show when `import.meta.env.DEV` is true (Vite dev mode).
- **Production:** Only `debug.warn` and `debug.error` show unless you set `VITE_DEBUG=true` in env.

## Toast + Debug

Use **React Toastify** for user-facing messages and **debug** for developer console. Both are used in Login, Setup, VoiceSelect, LiveInterview, and Result.
