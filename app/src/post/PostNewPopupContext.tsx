import React, {useContext, useMemo, useState} from "react";
import {Route} from "../router/Route";

const PostNewPopup = React.lazy(() => {
  return import(
    /* webpackChunkName: "PostNewPopup" */
    "./PostNewPopup"
  ).then(m => ({default: m.PostNewPopup}));
});

/**
 * Context for a “new post” popup.
 */
export interface PostNewPopupContext {
  /**
   * Is the post editor popup available? Returns false on small screens where we
   * will not allow the use of the popup.
   */
  readonly available: boolean;

  /**
   * Is the popup currently visible?
   */
  readonly visible: boolean;

  /**
   * If the popup is not currently visible, then show it. Otherwise do nothing.
   */
  show(): void;
}

/**
 * React context for our post popup.
 */
const _PostNewPopupContext = React.createContext<PostNewPopupContext>({
  available: false,
  visible: false,
  show() {
    throw new Error(
      "Must render <PostNewPopupContext> to be able to show the modal.",
    );
  },
});

/**
 * Use the `PostNewPopupContext` provided by our context.
 */
export function usePostNewPopupContext(): PostNewPopupContext {
  return useContext(_PostNewPopupContext);
}

/**
 * Provides an instance of `PostNewPopupContext` to the children of this
 * component which allows them to control the editor.
 */
export function PostNewPopupContext({
  route,
  groupSlug,
  available = true,
  children,
}: {
  route: Route;
  groupSlug: string;
  available?: boolean;
  children: React.Node;
}) {
  const [visible, setVisible] = useState(false);

  // Memorize the context value so we don’t create a new one on every render.
  const context: PostNewPopupContext = useMemo(
    () => ({
      available,
      visible,
      show: () => {
        if (available) {
          setVisible(true);
        } else {
          throw new Error("<PostNewPopup> is not available right now.");
        }
      },
    }),
    [available, visible],
  );

  return (
    <_PostNewPopupContext.Provider value={context}>
      {children}
      {available && visible && (
        <React.Suspense fallback={null}>
          <PostNewPopup
            route={route}
            groupSlug={groupSlug}
            onClose={() => setVisible(false)}
          />
        </React.Suspense>
      )}
    </_PostNewPopupContext.Provider>
  );
}
