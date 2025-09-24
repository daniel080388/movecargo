export default function Footer() {
  return (
    <footer className="mt-12 border-t border-default bg-card">
      <div className="container-page py-8 grid gap-8 md:grid-cols-4">
        <div>
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground grid place-items-center font-bold">MC</div>
          <p className="mt-3 text-sm text-muted">Marketplace de cargas e transportes. Conectamos empresas e transportadoras em toda a Europa.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Empresa</h4>
          <ul className="space-y-1 text-sm text-muted">
            <li><a href="#">Sobre</a></li>
            <li><a href="#">Preços</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Suporte</h4>
          <ul className="space-y-1 text-sm text-muted">
            <li><a href="#">Ajuda</a></li>
            <li><a href="#">Contactos</a></li>
            <li><a href="#">Status</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Legal</h4>
          <ul className="space-y-1 text-sm text-muted">
            <li><a href="#">Termos</a></li>
            <li><a href="#">Privacidade</a></li>
            <li><a href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="container-page py-4 text-xs text-muted border-t border-default">© {new Date().getFullYear()} MoveCargo. Todos os direitos reservados.</div>
    </footer>
  );
}
