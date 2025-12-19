import { render } from "solid-js/web";
import { Settings } from "./Settings";
import "@/styles/main.css";
import { initTheme } from "@/utils/theme";

// Initialize theme
initTheme();

const root = document.querySelector("#root");

if (root) {
	render(() => <Settings />, root);
}
