import { render } from "solid-js/web";

import "@/styles/main.css";
import { initTheme } from "@/utils/theme";

import { Settings } from "./Settings";

// Initialize theme
initTheme();

const root = document.querySelector("#root");

if (root) {
	render(() => <Settings />, root);
}
