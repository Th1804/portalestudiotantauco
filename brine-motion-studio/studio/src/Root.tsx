import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import {CrystalAd} from './crystal/CrystalAd';
import type {CrystalProduction} from './crystal/types';
import {PaddleAd} from './paddle/PaddleAd';
import type {PaddleProduction} from './paddle/types';
import type {Props} from './types';
import sample from '../productions/BMS-20261009-001.json';

// production.template elige la plantilla: 'paddle' (trofeo pala, BMS-20261019-001), 'crystal' (galvano) o la medalla.
const Production: React.FC<Props> = (props) => {
  const template = (props.production as {template?: string}).template;
  if (template === 'paddle') return <PaddleAd production={props.production as unknown as PaddleProduction} qaLayer={props.qaLayer} />;
  if (template === 'crystal') return <CrystalAd production={props.production as unknown as CrystalProduction} qaLayer={props.qaLayer} />;
  return <Main {...props} />;
};

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
