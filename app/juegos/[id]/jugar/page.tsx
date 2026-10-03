import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GamePlayer } from "@/components/player/game-player";
import { SignalLost } from "@/components/ui/signal-lost";
import { getGame, listGameIds } from "@/lib/catalog";
export async function generateStaticParams() {
  const ids = await listGameIds();
  return ids.map((id) => ({ id }));
}
// Mismo criterio que la ficha; el porqué está en el comentario de ../page.tsx.
export const dynamicParams = true;
export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const result = await getGame(id);
  if (!result.ok || !result.data) return {};
  return { title: `Jugando a ${result.data.title} · Arcade Vault` };
}
export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const result = await getGame(id);
  if (!result.ok) {
    return (
      <SignalLost message={result.error} retryHref={`/juegos/${id}/jugar`} />
    );
  }
  if (!result.data) notFound();
  return <GamePlayer game={result.data} />;
}
