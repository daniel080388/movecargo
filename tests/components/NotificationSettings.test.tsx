import { render, screen } from "@testing-library/react"
import NotificationSettings from "@/components/NotificationSettings"

describe("NotificationSettings componente", () => {
  it("inicializa com valores padrão corretos", () => {
    render(
      <NotificationSettings
        initialPreferences={{ novasPropostas: false, atualizacoesCarga: true, sistema: false }}
      />
    )

    expect(screen.getByLabelText(/Receber novas propostas/i)).not.toBeChecked()
    expect(screen.getByLabelText(/Atualizações de carga/i)).toBeChecked()
    expect(screen.getByLabelText(/Notificações do sistema/i)).not.toBeChecked()
  })
})
