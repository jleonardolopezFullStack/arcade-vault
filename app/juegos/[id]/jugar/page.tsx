import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { GamePlayer } from "@/components/player/game-player";
import { GAMES, getGame } from "@/lib/data";

export function generateStaticParams() {
  return GAMES.map((game) => ({ id: game.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/juegos/[id]/jugar">): Promise<Metadata> {
  const { id } = await params;
  const game = getGame(id);
  if (!game) return {};

  return { title: `Jugando a ${game.title} · Arcade Vault` };
}

export default async function PlayPage({
  params,
}: PageProps<"/juegos/[id]/jugar">) {
  const { id } = await params;
  const game = getGame(id);
  if (!game) notFound();

  return <GamePlayer game={game} />;
}
