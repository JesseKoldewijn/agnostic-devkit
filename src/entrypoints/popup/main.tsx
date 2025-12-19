import { render } from "solid-js/web";
import { App } from "./App";
import "@/styles/main.css";
import * as logic from "@/logic/parameters";
import { initTheme } from "@/utils/theme";

// Initialize theme
initTheme();

// Expose logic for E2E coverage boost
(window as any).__LOGIC__ = logic;

const root = document.querySelector("#root");

if (root) {
	render(() => <App />, root);
}
