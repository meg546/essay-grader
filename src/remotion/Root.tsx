import { Composition, registerRoot } from "remotion";
import { DemoReel } from "./DemoReel";

const RemotionRoot = () => {
  return (
    <Composition
      id="DemoReel"
      component={DemoReel}
      durationInFrames={540}
      fps={30}
      width={1280}
      height={720}
    />
  );
};

registerRoot(RemotionRoot);
