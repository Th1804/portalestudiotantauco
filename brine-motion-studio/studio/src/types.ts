export type QaLayer = 'none' | 'text' | 'logo';
export type Production = {
  id: string;
  format: {width: number; height: number; fps: number; durationInFrames: number};
  brand: {palette: Record<string, string>};
  product: {assets: {face_anchors_norm: Record<string, number[]>}};
  beats: {bpm: number; events: {f: number; type: string}[]};
  script: {on_screen: {
    hook: string[]; reveal_eyebrow: string; benefits: string[]; benefits_sub: string;
    statement: string[]; cta: string; url: string;
  }};
  storyboard: {scene: string; from: number; to: number}[];
};
export type Props = {production: Production; qaLayer: QaLayer};
