import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/Card";
import Badge from "@/app/components/ui/Badge";
import MapMini from "@/app/components/MapMini.client";
import { Button, LinkButton } from "@/app/components/ui/Button";

interface PageProps { params: Promise<{ locale: string; id: string }>; }

export default async function CargaDetailsPage({ params }: PageProps) {
  const { id, locale } = await params;
  const cargaId = Number(id);
  if (!Number.isFinite(cargaId)) return notFound();

  const carga = await prisma.carga.findUnique({
    where: { id: cargaId },
    include: {
      empresa: { select: { id: true, name: true, email: true } },
      destinos: { orderBy: { ordem: "asc" } },
      propostas: {
        include: { motorista: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!carga) return notFound();

  const markers = [
    ...(carga.latitude != null && carga.longitude != null
      ? [{ lng: Number(carga.longitude), lat: Number(carga.latitude), color: "#2563EB", popup: `<strong>Origem</strong><br/>${carga.origem}` }]
      : []),
    ...carga.destinos.map((d) => ({
      lng: Number(d.longitude),
      lat: Number(d.latitude),
      color: "#16A34A",
      popup: `<strong>Destino</strong><br/>${d.cidade}`,
    })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-2/3 w-full">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{carga.titulo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {carga.expresso ? <Badge tone="warning">Expresso</Badge> : null}
                {carga.meiaCarga ? <Badge>Meia carga</Badge> : null}
                {carga.multiDestino ? <Badge>Multi-destino</Badge> : null}
                {carga.tipoCaminhao ? <Badge>{carga.tipoCaminhao}</Badge> : null}
                {carga.pesoKg != null ? <Badge tone="success">{carga.pesoKg} kg</Badge> : null}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted">Origem</div>
                  <div className="font-medium">{carga.origem}</div>
                </div>
                <div>
                  <div className="text-sm text-muted">Empresa</div>
                  <div className="font-medium">{carga.empresa?.name}</div>
                </div>
              </div>

              {carga.destinos.length > 0 && (
                <div>
                  <div className="text-sm text-muted mb-1">Destinos</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {carga.destinos.map((d) => (
                      <li key={d.id} className="text-sm">
                        <span className="font-medium">{d.cidade}</span> <span className="text-muted">(ordem {d.ordem})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div className="text-sm text-muted mb-2">Mapa</div>
                {/* mini map restricted to Europe bounds */}
                <MapMini markers={markers} height={280} />
              </div>

              {carga.descricao && (
                <div>
                  <div className="text-sm text-muted mb-1">Descrição</div>
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{carga.descricao}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:w-1/3 w-full space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fazer proposta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted">Para propor um valor e contactar a empresa, autentique-se.</p>
              <div className="flex gap-2">
                <LinkButton href={`/${locale}/login`} variant="primary" className="flex-1">Entrar</LinkButton>
                <LinkButton href={`/${locale}/registrar`} variant="outline">Registrar</LinkButton>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Últimas propostas</CardTitle>
            </CardHeader>
            <CardContent>
              {carga.propostas.length === 0 ? (
                <div className="text-sm text-muted">Ainda sem propostas.</div>
              ) : (
                <ul className="space-y-2">
                  {carga.propostas.map((p) => (
                    <li key={p.id} className="text-sm flex items-center justify-between">
                      <span className="text-muted">{p.motorista?.name || "Transportadora"}</span>
                      <span className="font-medium">€ {p.valor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
 
