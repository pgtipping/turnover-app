document.addEventListener("DOMContentLoaded", function () {
  // Set the current year in the footer
  document.getElementById("currentYear").textContent = new Date().getFullYear();

  // Theme toggle functionality
  const themeToggleBtn = document.getElementById("theme-toggle");
  const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
  const currentTheme = localStorage.getItem("theme");

  if (currentTheme) {
    if (currentTheme === "dark") {
      switchToDarkTheme();
    } else if (currentTheme === "light") {
      switchToLightTheme();
    }
  } else {
    if (prefersDarkScheme.matches) {
      switchToDarkTheme();
    } else {
      switchToLightTheme();
    }
  }

  themeToggleBtn.addEventListener("click", function () {
    if (prefersDarkScheme.matches) {
      if (document.body.classList.contains("light-theme")) {
        switchToDarkTheme();
        localStorage.setItem("theme", "dark");
      } else {
        switchToLightTheme();
        localStorage.setItem("theme", "light");
      }
    } else {
      if (document.body.classList.contains("dark-theme")) {
        switchToLightTheme();
        localStorage.setItem("theme", "light");
      } else {
        switchToDarkTheme();
        localStorage.setItem("theme", "dark");
      }
    }
  });

  function switchToDarkTheme() {
    document
      .getElementById("bootstrap-css")
      .setAttribute(
        "href",
        "https://stackpath.bootstrapcdn.com/bootswatch/4.5.2/darkly/bootstrap.min.css"
      );
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  }

  function switchToLightTheme() {
    document
      .getElementById("bootstrap-css")
      .setAttribute(
        "href",
        "https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css"
      );
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }
});
