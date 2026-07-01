"use client";

import { useState, useTransition } from "react";

import type { SocialCarouselArtifactTemplate } from "@autopainel/shared/types/social-carousel";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Label,
} from "@autopainel/shared/ui";

import { saveCarouselAppearanceAction } from "@/app/painel/integracoes/actions";

const TEMPLATE_OPTIONS: Array<{
  id: SocialCarouselArtifactTemplate;
  title: string;
  description: string;
}> = [
  {
    id: "classic",
    title: "Clássico",
    description: "Elegante · dourado · vitrine premium",
  },
  {
    id: "performance",
    title: "Performance",
    description: "Impacto · vermelho · tipografia bold",
  },
  {
    id: "tech",
    title: "Tech",
    description: "Moderno · azul · painéis em vidro",
  },
];

interface CarouselAppearanceCardProps {
  initialTemplate: SocialCarouselArtifactTemplate;
  initialWatermarkEnabled: boolean;
  hasLogo: boolean;
}

export function CarouselAppearanceCard({
  initialTemplate,
  initialWatermarkEnabled,
  hasLogo,
}: CarouselAppearanceCardProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [watermarkEnabled, setWatermarkEnabled] = useState(initialWatermarkEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveCarouselAppearanceAction(template, watermarkEnabled);
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Aparência do carrossel salva.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência do carrossel</CardTitle>
        <CardDescription>
          Defina como as imagens do seu estoque aparecem no Instagram e Facebook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>Estilo visual</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPLATE_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTemplate(option.id)}
                className={`rounded-lg border px-4 py-3 text-left transition-colors ${
                  template === option.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-medium">{option.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1 size-4 rounded border-input"
            checked={watermarkEnabled}
            onChange={(event) => setWatermarkEnabled(event.target.checked)}
            disabled={!hasLogo}
          />
          <span>
            <span className="font-medium">Marca d&apos;água extra nas fotos</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {hasLogo
                ? "A logo já aparece no canto de cada slide; ative para uma marca d'água central suave."
                : "Cadastre a logo da loja em Configurações para exibir a marca nos slides."}
            </span>
          </span>
        </label>

        <Button type="button" disabled={isPending} onClick={handleSave}>
          {isPending ? "Salvando…" : "Salvar aparência"}
        </Button>

        {message ? (
          <p className="text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
