export type CrystalProduction = {
  id: string;
  template: 'crystal';
  format: {width: number; height: number; fps: number; durationInFrames: number};
  brand: {palette: {ice: string; ice_deep: string; navy: string; case_blue: string; celeste: string; celeste_light: string; bone: string; gold: string}};
  beats: {bpm: number; events: {f: number; type: string}[]};
  script: {on_screen: {
    hook: string[]; eyebrow: string; refraction: string[]; thickness: string[]; laser: string[]; engraving_sample: string[];
    case: string[]; sizes_chip: string; audience: string[]; cta: string; url: string;
  }};
};
