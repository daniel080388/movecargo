import { render, screen } from "@testing-library/react"
import { LanguageSelector } from "@/app/components/LanguageSelector"

// Mock do next/navigation para este teste
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/teste",
  useSearchParams: () => new URLSearchParams(),
}))

describe("LanguageSelector componente", () => {
  it("mostra idioma inicial correto", () => {
    render(<LanguageSelector initialLocale="pt" />)

    expect(screen.getByLabelText(/Idioma padrão:/i)).toHaveValue("pt")
  })
})
