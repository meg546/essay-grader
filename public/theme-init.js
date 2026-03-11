// Flash prevention: apply dark class before React renders
(function () {
  var t = localStorage.getItem("essay-grader-theme");
  var d =
    t === "dark" ||
    (t !== "light" &&
      matchMedia("(prefers-color-scheme:dark)").matches);
  if (d) {
    document.documentElement.classList.add("dark");
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = "#0f1117";
  }
})();
