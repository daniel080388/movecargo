import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "chave-super-secreta";

export interface TokenPayload {
  uid: number;
  role: string;
  name?: string;
  iat?: number;
  exp?: number;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch (err) {
    console.error("Erro ao verificar token:", err);
    return null;
  }
}

// Helper used by API routes to extract user info from the request
export function getUserFromRequest(req: Request | { headers: { get: (k: string) => string | null } }) {
  try {
    const headers = (req as any).headers;
    const auth = typeof headers.get === "function" ? headers.get("authorization") : null;
    if (!auth || !auth.startsWith("Bearer ")) return null;
    const token = auth.split(" ")[1];
    const payload = verifyToken(token);
    if (!payload) return null;
    // Normalize role to lowercase to avoid case-sensitivity issues across routes
    const role = typeof payload.role === 'string' ? payload.role.toLowerCase() : payload.role as any;
    return { uid: payload.uid, role };
  } catch (err) {
    console.error("getUserFromRequest error:", err);
    return null;
  }
}
