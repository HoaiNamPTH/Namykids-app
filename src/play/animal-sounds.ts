/**
 * Nam 28/11/2026: real animal sounds instead of Vita imitating them ("meo meo" read aloud sounded odd).
 * Made with ElevenLabs Sound Effects on the paid plan (commercial use allowed); short, soft, child-friendly.
 */
import type { ItemId } from "./items";
import bee from "../assets/audio/animal-sfx/bee.mp3";
import cat from "../assets/audio/animal-sfx/cat.mp3";
import chick from "../assets/audio/animal-sfx/chick.mp3";
import cow from "../assets/audio/animal-sfx/cow.mp3";
import dog from "../assets/audio/animal-sfx/dog.mp3";
import duck from "../assets/audio/animal-sfx/duck.mp3";
import frog from "../assets/audio/animal-sfx/frog.mp3";
import pig from "../assets/audio/animal-sfx/pig.mp3";
import rooster from "../assets/audio/animal-sfx/rooster.mp3";

export const ANIMAL_SOUNDS: Partial<Record<ItemId, number>> = { bee, cat, chick, cow, dog, duck, frog, pig, rooster };
