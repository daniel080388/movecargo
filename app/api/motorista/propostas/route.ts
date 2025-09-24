// Legacy path removed: use /api/transportadora/propostas
export async function GET() {
  return new Response(JSON.stringify({ error: 'Movido para /api/transportadora/propostas' }), { status: 410 });
}
