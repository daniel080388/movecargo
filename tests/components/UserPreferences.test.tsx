import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import UserPreferences from "@/app/components/UserPreferences"

// Mock do hook
jest.mock("@/lib/hooks/useUpdateSettings", () => ({
  useUpdateSettings: () => ({
    update: jest.fn().mockResolvedValue({}),
    loading: false,
  }),
}))

describe("UserPreferences", () => {
  it("renderiza e salva preferências sem erros", async () => {
    render(<UserPreferences initialTheme="claro" />)

    // Verifica se o tema inicial está correto
    expect(screen.getByDisplayValue("Claro")).toBeInTheDocument()

    // Altera o tema
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "escuro" },
    })

    // Clica em salvar
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    // Aguarda o estado ser atualizado
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /salvar/i })).toBeEnabled()
    })
  })
})
