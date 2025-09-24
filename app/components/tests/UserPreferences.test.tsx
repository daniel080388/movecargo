import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import UserPreferences from "@/app/components/UserPreferences"

jest.mock("@/lib/hooks/useUpdateSettings", () => ({
  useUpdateSettings: () => ({
    update: jest.fn().mockResolvedValue({}),
    loading: false,
  }),
}))

describe("UserPreferences (App Components)", () => {
  it("salva preferências sem warnings", async () => {
    render(<UserPreferences initialTheme="claro" />)

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "escuro" },
    })

    fireEvent.click(screen.getByRole("button", { name: /salvar/i }))

    // 🔹 O segredo: aguarda até o React processar os updates
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /salvar/i })).toBeEnabled()
    })
  })
})
