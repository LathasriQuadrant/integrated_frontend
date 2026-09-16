import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// TEMPORARY DEBUG — remove once the redirect bug is found
const origPush = history.pushState;
const origReplace = history.replaceState;

history.pushState = function (...args) {
  console.log("%c[NAV pushState]", "color: red; font-weight: bold", args[2]);
  console.trace();
  return origPush.apply(this, args);
};

history.replaceState = function (...args) {
  console.log("%c[NAV replaceState]", "color: orange; font-weight: bold", args[2]);
  console.trace();
  return origReplace.apply(this, args);
};

window.addEventListener("popstate", () => {
  console.log("%c[NAV popstate/back-forward]", "color: blue; font-weight: bold", location.pathname);
  console.trace();
});

createRoot(document.getElementById("root")!).render(<App />);
