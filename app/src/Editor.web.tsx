import {EditorProps} from "./EditorProps";
import React from "react";

declare const document: any;

/**
 * Alright folks, let’s get crazy with our web editor component! Our web editor
 * uses [`contentEditable`][1] which is known to be quite wild in everything
 * it allows.
 *
 * There have been some pretty insane engineering efforts which have gone into
 * taming `contentEditable`.
 *
 * - Facebook created [Draft.js][2] which is an absolutely huge library
 *   effectively re-implementing browser editing.
 * - Medium has a [fancy model][3] and they reinterpret all events as actions on
 *   that model.
 *
 * These approaches are _big_ engineering solutions to the problem. Instead of
 * doing something like that, our editor:
 *
 * - Accepts that we can’t tame `contentEditable`.
 * - Embraces the browser engineering effort that goes into `contentEditable`.
 * - Patches really bad ways the user can introduce non-standard styles.
 * - Serializes content from the editor using, roughly, the HTML
 *   [`innerText`][4] algorithm.
 *
 * Importantly, we don’t try to render HTML created with `contentEditable`
 * anywhere outside of the editor it was created in. We serialize to a markup
 * format (using an [`innerText`][4] like algorithm) and render that wherever
 * the content is viewed.
 *
 * To get an overview of the user input events we should watch out for, see
 * the [Draft.js event listeners][5] and their corresponding
 * [event handlers][6].
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content
 * [2]: https://draftjs.org
 * [3]: https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480
 * [4]: https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 * [5]: https://github.com/facebook/draft-js/blob/f9f5fd6ed1df237389b6bfe9db90e62fe7d4237c/src/component/base/DraftEditor.react.js#L392-L411
 * [6]: https://github.com/facebook/draft-js/tree/f9f5fd6ed1df237389b6bfe9db90e62fe7d4237c/src/component/handlers/edit
 */
export function Editor({}: EditorProps) {
  /**
   * Don’t allow the user to paste raw HTML into the editor. Instead, force the
   * clipboard data to plain text and then insert it.
   */
  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    // Oh goodness, we don’t want the default behavior here!!! The default is
    // to paste the clipboard content as fully styled HTML 😱
    //
    // Instead we only want to paste plain text.
    event.preventDefault();

    // Get the paste data from our clipboard as plain text. Not as HTML!
    const pasteData = event.clipboardData.getData("text/plain");

    // Insert the pasted data into our document using `document.execCommand()`
    // which lets the browser do its native behavior thing.
    //
    // Newlines are preserved with this approach! Manually creating a text node
    // would not work since we need to replace `\n` characters with `<br>`.
    document.execCommand("insertText", false, pasteData);
  }

  return <div contentEditable onPaste={handlePaste} />;
}
