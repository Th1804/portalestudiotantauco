import React from 'react';
import {Composition} from 'remotion';
import {Main} from './Main';
import type {Props} from './types';
import sample from '../productions/BMS-20261009-001.json';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Production"
    component={Main as unknown as React.FC<Record<string, unknown>>}
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
