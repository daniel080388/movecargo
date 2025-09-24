import fetch from "node-fetch";

// Substitua este token pelo que você recebeu do login
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOjIsInJvbGUiOiJNT1RPUklTVEEiLCJuYW1lIjoiTW90b3Jpc3RhIFRlc3RlIiwiaWF0IjoxNzU3NTk3OTQyLCJleHAiOjE3NTgyMDI3NDJ9.6bkhzJHjnE6wh-srANi6HWCB9EIYG8bZJNS8i9dVCG4";

async function testeMe() {
  try {
    const response = await fetch("http://localhost:3000/api/auth/me", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOKEN}`,
      },
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Resposta:", data);

    if (response.ok) {
      console.log("\n✅ Rota protegida acessada com sucesso!");
    } else {
      console.log("\n⚠️ Falha ao acessar rota protegida:", data.error);
    }
  } catch (err) {
    console.error("Erro ao acessar /me:", err);
  }
}

testeMe();
