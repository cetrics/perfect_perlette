document.addEventListener("DOMContentLoaded", () => {
  const adminPanel = document.getElementById("sidebar");
  const loginForm = document.getElementById("login-form");

  // Check if user is logged in
  const isLoggedIn = localStorage.getItem("adminLoggedIn");

  if (isLoggedIn) {
    loginForm.style.display = "none";
    adminPanel.style.display = "block";
  } else {
    loginForm.style.display = "block";
    adminPanel.style.display = "none";
  }

  // Handle login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("adminLoggedIn", "true");
        location.reload();
      } else {
        alert("Invalid credentials!");
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  });
});
