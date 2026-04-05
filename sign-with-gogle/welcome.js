const BASE_URL = "http://localhost:8085";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        try {
            await fetch(`${BASE_URL}/api/users/auth/logout`, {
                method: "POST",
                credentials: "include"
            });

            window.location.href = "/sign-with-gogle/login-google.html";

        } catch (error) {
            console.error("Logout error:", error);
        }
    });
}

