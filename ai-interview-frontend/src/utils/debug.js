/**
 * Debug logger - Hinglish/desi style console messages for easy review & debugging.
 * Set VITE_DEBUG=true in .env to enable; otherwise only warnings/errors show in production.
 */

const DEBUG_ON = import.meta.env.VITE_DEBUG === "true" || import.meta.env.DEV;

const prefix = "[AI Interview]";

export const debug = {
  /** Component / screen load – "Yahan pe kya ho raha hai" */
  component: (componentName, message, data = null) => {
    if (!DEBUG_ON) return;
    console.log(
      `${prefix} [${componentName}] ${message}`,
      data !== null ? data : ""
    );
  },

  /** API call – "Backend ko bhej rahe hain / mila" */
  api: (action, url, payload = null) => {
    if (!DEBUG_ON) return;
    console.log(
      `${prefix} [API] ${action} → ${url}`,
      payload !== null ? payload : ""
    );
  },

  /** API response – "Backend se ye aaya" */
  apiResponse: (url, status, data = null) => {
    if (!DEBUG_ON) return;
    console.log(
      `${prefix} [API Response] ${url} → status ${status}`,
      data !== null ? data : ""
    );
  },

  /** User action – "User ne ye kiya" */
  action: (componentName, action, extra = null) => {
    if (!DEBUG_ON) return;
    console.log(
      `${prefix} [Action] ${componentName} → ${action}`,
      extra !== null ? extra : ""
    );
  },

  /** State / flow – "Ab flow yahan hai" */
  flow: (step, detail = null) => {
    if (!DEBUG_ON) return;
    console.log(`${prefix} [Flow] ${step}`, detail !== null ? detail : "");
  },

  /** Warning – hamesha dikhega */
  warn: (componentName, message, data = null) => {
    console.warn(
      `${prefix} [WARN] [${componentName}] ${message}`,
      data !== null ? data : ""
    );
  },

  /** Error – hamesha dikhega */
  error: (componentName, message, err = null) => {
    console.error(
      `${prefix} [ERROR] [${componentName}] ${message}`,
      err !== null ? err : ""
    );
  },
};

export default debug;
