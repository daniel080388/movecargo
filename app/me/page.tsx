"use client";

import { useAuth } from "../context/AuthContext";

export default function MePage() {
  const { user, logout } = useAuth();

  if (!user) return <p>Carregando...</p>;

  return (
    <div>
      <h1>Bem-vindo, {user.name}!</h1>
      <p>Email: {user.email}</p>
      <p>Função: {user.role}</p>
      <button onClick={logout}>Sair</button>
    </div>
  );
}
