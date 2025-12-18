import React from "react";

declare global {
  // Fallback JSX intrinsic elements to satisfy lint in components that render JSX
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export {};

