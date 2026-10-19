import type {QaLayer} from '../types';

export type PaddleCopy = {
  hook: [string, string, string];
  hero_eye: string;
  hero_title: string;
  hero_model: string;
  measure: [string, string];
  plate: [string, string, string, string, string];
  case_eye: string;
  case: [string, string, string];
  statement: [string, string, string];
  cta: string;
  url: string;
};

export type PaddleProduction = {
  id: string;
  template: 'paddle';
  format: {width: number; height: number; fps: number; durationInFrames: number; duration_s: number};
  brand: {palette: {navy: string; celeste: string; celeste_light: string; bone: string; gold: string}; logo: string};
  script: {on_screen: PaddleCopy};
  beats: {bpm: number};
};

export type PaddleProps = {production: PaddleProduction; qaLayer: QaLayer};
