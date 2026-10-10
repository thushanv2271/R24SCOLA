import { useCallback, useEffect, useRef } from "react";
import { Dimensions } from "react-native";

// Lets screens mark elements the owl guide can point at. A screen calls
// useGuideTarget("profile.language") and puts the returned ref on a View; the
// guide measures it in window coordinates. Scrollable screens also pass a
// `reveal` function so the guide can scroll the element into view first.

const targets = new Map();
const scrollListeners = new Set();

export const subscribeGuideScroll = (fn) => {
  scrollListeners.add(fn);
  return () => scrollListeners.delete(fn);
};

export const useGuideTarget = (id, reveal) => {
  const ref = useRef(null);
  const revealRef = useRef(reveal);
  revealRef.current = reveal;

  useEffect(() => {
    targets.set(id, { ref, reveal: (rect) => revealRef.current?.(rect) });
    return () => {
      if (targets.get(id)?.ref === ref) targets.delete(id);
    };
  }, [id]);

  return ref;
};

export const measureGuideTarget = (id) =>
  new Promise((resolve) => {
    const node = targets.get(id)?.ref.current;
    if (!node) return resolve(null);
    node.measureInWindow((x, y, width, height) => resolve(width > 0 && height > 0 ? { x, y, width, height } : null));
  });

export const revealGuideTarget = (id, rect) => targets.get(id)?.reveal(rect);

// Scroll helper: spread `scrollProps` on a ScrollView and pass `reveal` to
// useGuideTarget so off-screen targets are scrolled up into view.
export const useGuideScroll = () => {
  const ref = useRef(null);
  const offset = useRef(0);
  const onScroll = useCallback((event) => {
    offset.current = event.nativeEvent.contentOffset.y;
    scrollListeners.forEach((fn) => fn());
  }, []);
  const reveal = useCallback((rect) => {
    const desired = Dimensions.get("window").height * 0.3;
    ref.current?.scrollTo({ y: Math.max(0, offset.current + rect.y - desired), animated: true });
  }, []);
  return { scrollProps: { ref, onScroll, scrollEventThrottle: 32 }, reveal };
};
