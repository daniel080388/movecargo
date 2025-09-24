import { AuthProvider } from "./context/AuthContext";
import DevtoolsSuppressor from "./components/DevtoolsSuppressor";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="bg-background text-foreground">
        <AuthProvider>
          <DevtoolsSuppressor />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
