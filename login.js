document.addEventListener("DOMContentLoaded", function () { const loginButton = document.querySelector(".login-button");

    loginButton.addEventListener("click", function () {
    const username = document.querySelector(".input-log").value;
    const password = document.querySelector(".input-pin").value;
      // Definir credenciais válidas (pode ser substituído por um backend)
const validUsername = "admin";
const validPassword = "1234";
if (username === validUsername && password === validPassword) {
        alert("Login bem-sucedido! Redirecionando...");
        window.location.href = "https://jubilant-space-rotary-phone-jjrwwpxrqqgv37qj-5500.app.github.dev/"; // Substitua pelo link da página oficial} else {
        alert("Nome de usuário ou senha incorretos. Tente novamente.");}
    });
});