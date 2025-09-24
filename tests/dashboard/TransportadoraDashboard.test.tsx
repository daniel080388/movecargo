import { render, screen } from "@testing-library/react"
import TransportadoraDashboard from "@/app/[locale]/transportadora/dashboard/page"
import { AuthProvider } from "@/context/AuthContext"

describe("TransportadoraDashboard", () => {
  it("renderiza sem erros e mostra o título correto", () => {
    render(
      <AuthProvider>
        <TransportadoraDashboard />
      </AuthProvider>
    )

    // 🔹 Ajusta os textos que realmente aparecem no componente
    expect(screen.getByText(/titulo/i)).toBeInTheDocument()
    expect(screen.getByText(/carregando/i)).toBeInTheDocument()
  })
})
