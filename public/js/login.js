window.onload = async () => {
    const username = sessionStorage.getItem("username");
    if (username !== null) {
      window.location.replace("/dashboard.html");
    }
};
  
async function login() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const loginError = document.getElementById("loginError");

fetch("/login", {
    method: "POST",
    headers: {
    "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
})
.then((response) => response.json())
.then((data) => {
    if (data.error) {
        loginError.textContent = "Invalid Username or Password";
    } else {
        sessionStorage.setItem("username", data.email);
        sessionStorage.setItem("role", data.role);
        window.location.replace("/dashboard.html");
    }
})
.catch((error) => console.error("Error fetching data", error));
}