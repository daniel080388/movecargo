"use client";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/Card";
import Badge from "./ui/Badge";
import { LinkButton } from "./ui/Button";
import { useLocale } from "next-intl";

export interface Destino {
  id: number;
  cidade: string;
  latitude: number | null;
  longitude: number | null;
  ordem: number;
}

export interface Carga {
  id: number;
  titulo: string;
  origem: string;
  pesoKg?: number | null;
  tipoCaminhao?: string | null;
  expresso?: boolean | null;
  meiaCarga?: boolean | null;
  multiDestino?: boolean | null;
  distance?: number | null;
  empresa?: { id: number; name: string };
  destinos?: Destino[];
}

export default function CargaCard({ carga }: { carga: Carga }) {
  const locale = useLocale() || 'pt';
  const firstDestino = carga.destinos?.[0]?.cidade;
  return (
    <Card className="p-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-balance">{carga.titulo}</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {carga.expresso ? <Badge tone="warning">Expresso</Badge> : null}
            {carga.meiaCarga ? <Badge>Meia carga</Badge> : null}
            {carga.multiDestino ? <Badge>Multi-destino</Badge> : null}
            {typeof carga.distance === 'number' ? (
              <Badge tone="success">{carga.distance.toFixed(1)} km</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <div className="text-sm text-muted">Origem</div>
            <div className="font-medium">{carga.origem}</div>
            {firstDestino && (
              <>
                <div className="text-sm text-muted mt-2">Destino</div>
                <div className="font-medium">{firstDestino}{carga.destinos && carga.destinos.length > 1 ? ` +${(carga.destinos.length - 1)}` : ''}</div>
              </>
            )}
          </div>
          <div>
            {carga.pesoKg != null && (
              <div className="mt-2"><span className="text-sm text-muted">Peso</span> <div className="font-medium">{carga.pesoKg} kg</div></div>
            )}
            {carga.tipoCaminhao && (
              <div className="mt-2"><span className="text-sm text-muted">Tipo</span> <div className="font-medium">{carga.tipoCaminhao}</div></div>
            )}
            {carga.empresa?.name && (
              <div className="mt-2"><span className="text-sm text-muted">Empresa</span> <div className="font-medium">{carga.empresa.name}</div></div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <LinkButton href={`/${locale}/cargas/${carga.id}`} variant="primary">Ver detalhes</LinkButton>
        </div>
      </CardContent>
    </Card>
  );
}
