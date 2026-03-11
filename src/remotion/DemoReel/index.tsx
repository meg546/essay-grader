import { AbsoluteFill, Sequence } from "remotion";
import { theme } from "./theme";
import { EssayScene } from "./scenes/EssayScene";
import { SubmitScene } from "./scenes/SubmitScene";
import { HighlightsScene } from "./scenes/HighlightsScene";
import { ScoresScene } from "./scenes/ScoresScene";
import { HoldScene } from "./scenes/HoldScene";

// 30fps — scene boundaries in frames
const FPS = 30;
const SCENE_1_START = 0;              // 0s
const SCENE_2_START = 3 * FPS;        // 3s  = frame 90
const SCENE_3_START = 5 * FPS;        // 5s  = frame 150
const SCENE_4_START = 10 * FPS;       // 10s = frame 300
const SCENE_5_START = 15 * FPS;       // 15s = frame 450
const TOTAL_FRAMES = 18 * FPS;        // 18s = frame 540

export const DemoReel = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.card }}>
      <Sequence from={SCENE_1_START} durationInFrames={SCENE_2_START - SCENE_1_START}>
        <EssayScene />
      </Sequence>

      <Sequence from={SCENE_2_START} durationInFrames={SCENE_3_START - SCENE_2_START}>
        <SubmitScene />
      </Sequence>

      <Sequence from={SCENE_3_START} durationInFrames={SCENE_4_START - SCENE_3_START}>
        <HighlightsScene />
      </Sequence>

      <Sequence from={SCENE_4_START} durationInFrames={SCENE_5_START - SCENE_4_START}>
        <ScoresScene />
      </Sequence>

      <Sequence from={SCENE_5_START} durationInFrames={TOTAL_FRAMES - SCENE_5_START}>
        <HoldScene />
      </Sequence>
    </AbsoluteFill>
  );
};
