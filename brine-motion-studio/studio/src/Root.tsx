import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {CrystalAd} from './crystal/CrystalAd';
import type {CrystalProduction} from './crystal/types';
import type {Props} from './types';
import sample from '../productions/BMS-20261009-001.json';

// production.template elige la plantilla: 'crystal' (galvano de cristal, BMS-20261012-001) o la medalla (por defecto).
const Production: React.FC<Props> = (props) =>
  (props.production as {template?: string}).template === 'crystal'
    ? <CrystalAd production={props.production as unknown as CrystalProduction} qaLayer={props.qaLayer} />
    : <Main {...props} />;

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Production"
    component={Production as unknown as React.FC<Record<string, unknown>>}
    width={1080}
    height={1920}
    fps={30}
    durationInFrames={450}
    defaultProps={{production: sample, qaLayer: 'none'} as unknown as Record<string, unknown>}
    calculateMetadata={({props}) => {
      const p = (props as unknown as Props).production;
      return {durationInFrames: p.format.durationInFrames, fps: p.format.fps, width: p.format.width, height: p.format.height};
    }}
  />
);
