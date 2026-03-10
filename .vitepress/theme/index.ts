import { h } from "vue";
import DefaultTheme from "vitepress/theme";
import BlogByline from "../components/BlogByline.vue";
import BlogIndex from "../components/BlogIndex.vue";
import HomePage from "../components/HomePage.vue";
import "./style.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("BlogByline", BlogByline);
    app.component("BlogIndex", BlogIndex);
    app.component("HomePage", HomePage);
  },
};
