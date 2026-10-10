// Tiny bridge so the language/theme contexts can ask the root-level
// SwitchLoaderHost to cover a change with the loading animation.
let host = null;

export const registerSwitchLoader = (fn) => {
  host = fn;
  return () => {
    if (host === fn) host = null;
  };
};

// `apply` performs the actual change. With a host mounted it runs while the
// loader is on screen; with none (e.g. before the tree mounts) it runs at once.
export const runWithSwitchLoader = (kind, apply) => {
  if (host) host(kind, apply);
  else apply();
};
