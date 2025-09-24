import fetch from "node-fetch";

async function testeLogin() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "motorista@teste.com",
        password: "123456",
      }),
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Resposta:", data);

    if (response.ok && data.token) {
      console.log("\n✅ Token do usuário:", data.token);
    } else {
      console.log("\n⚠️ Login falhou:", data.error);
    }
  } catch (err) {
    console.error("Erro ao fazer login:", err);
  }
}

testeLogin();
