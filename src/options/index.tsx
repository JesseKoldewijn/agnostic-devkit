import { render } from "solid-js/web";
import { Options } from "./Options";
import "../styles/main.css";
import { initTheme } from "../utils/theme";

// Initialize theme
initTheme();

const root = document.getElementById("root");

if (root) {
	render(() => <Options />, root);
}
