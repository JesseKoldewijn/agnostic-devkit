import { render } from "solid-js/web";

import * as logic from "@/logic/parameters";
import "@/styles/main.css";
import { initTheme } from "@/utils/theme";

import { App } from "./App";

// Initialize theme
initTheme();

// Expose logic for E2E coverage boost
window.__LOGIC__ = logic;

const root = document.querySelector("#root");

if (root) {
	render(() => <App />, root);
}
