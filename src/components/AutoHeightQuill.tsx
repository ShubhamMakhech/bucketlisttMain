import React from "react";
import ReactQuill, { ReactQuillProps } from "react-quill";
import "./AutoHeightQuill.css";

const TOOLBAR_ESTIMATE = 52;
const MIN_EDITOR_VIEWPORT = 100;

type AutoHeightQuillProps = Omit<ReactQuillProps, "style"> & {
  /** Height of the scrollable editor area (toolbar is added on top). */
  minHeight?: number;
  wrapperClassName?: string;
};

/**
 * Compact ReactQuill: small fixed height + vertical scroll inside the box.
 * Overrides global .ql-editor min-height so boxes don't stay huge.
 */
export function AutoHeightQuill({
  minHeight = MIN_EDITOR_VIEWPORT,
  wrapperClassName = "border rounded-md",
  onChange,
  ...quillProps
}: AutoHeightQuillProps) {
  const totalHeight = TOOLBAR_ESTIMATE + minHeight;

  return (
    <div
      className={`auto-height-quill-wrapper ${wrapperClassName}`.trim()}
      style={{ height: `${totalHeight}px` }}
    >
      <ReactQuill
        {...quillProps}
        style={{
          height: "100%",
          backgroundColor: "transparent",
        }}
        onChange={(value, delta, source, editor) => {
          onChange?.(value, delta, source, editor);
        }}
      />
    </div>
  );
}
