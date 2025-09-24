"use client";

import { useEffect } from "react";

export default function DevtoolsSuppressor() {
  useEffect(() => {
    const originalInfo = console.info.bind(console);
    const originalLog = console.log.bind(console);

    function patch(original: (...args: any[]) => void) {
      return function (...args: any[]) {
        try {
          if (args.length > 0 && typeof args[0] === "string") {
            const text = args[0];
            if (text.includes("Download the React DevTools") || text.includes("react-devtools")) {
              // swallow this specific message
              return;
            }
          }
        } catch (e) {
          // ignore
        }
        original(...args);
      };
    }

    console.info = patch(originalInfo);
    console.log = patch(originalLog);

    return () => {
      console.info = originalInfo;
      console.log = originalLog;
    };
  }, []);

  return null;
}
