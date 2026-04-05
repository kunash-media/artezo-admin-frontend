const BASE_URL = "http://localhost:8085";

const googleBtn = document.getElementById("googleLoginBtn");

if (googleBtn) {
    googleBtn.addEventListener("click", () => {
        window.location.href = `${BASE_URL}/oauth2/authorization/google?prompt=select_account`;
    });
}