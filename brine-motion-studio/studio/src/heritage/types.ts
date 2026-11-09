export type HeritageProduction = {
  id: string;
  template: 'heritage';
  format: {width: number; height: number; fps: number; durationInFrames: number};
  brand: {palette: {navy: string; navy_deep: string; celeste: string; celeste_light: string; bone: string; gold: string}};
  beats: {bpm: number; events: {f: number; type: string}[]};
  script: {on_screen: {
    hook: string[];
    title: string[];
    official: string[];
    panels: {num: string; lines: string[]; sub: string[]};
    maker: {eyebrow: string; name: string; place: string; note: string[]};
    relaunch: string[];
    craft: string[];
    closing_name: string;
    url: string;
  }};
};
