import { render } from "solid-js/web";

import "@/styles/main.css";
import { initTheme } from "@/utils/theme";

import { App } from "./App";

// Initialize theme
initTheme();

const root = document.querySelector("#root");

if (root) {
	render(() => <App />, root);
}
