import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { findGame } from "../../src/play/catalog";
import { GameScreen } from "../../src/play/screens/GameScreen";

export default function GameRoute() {
  const router = useRouter();
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = findGame(gameId);
  if (!game) return <Redirect href="/home" />;
  const back = () => (router.canGoBack() ? router.back() : router.replace(`/area/${game.area}`));
  return <GameScreen game={game} onBack={back} onOtherGame={() => router.replace(`/area/${game.area}`)} />;
}
