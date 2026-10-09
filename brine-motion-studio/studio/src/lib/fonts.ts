import {continueRender, delayRender, staticFile} from 'remotion';
let loaded = false;
export const ensureFonts = () => {
  if (loaded || typeof document === 'undefined') return;
  loaded = true;
  const h = delayRender('fonts');
  const faces = [
    new FontFace('BMSDisplay', `url(${staticFile('assets/PlayfairDisplay.ttf')})`, {weight: '400 900', style: 'normal'}),
    new FontFace('BMSText', `url(${staticFile('assets/Manrope.ttf')})`, {weight: '200 800'}),
  ];
  Promise.all(faces.map((f) => f.load()))
    .then((fs) => {
      fs.forEach((f) => (document as any).fonts.add(f));
      continueRender(h);
    })
    .catch((e) => {
      console.error(e);
      continueRender(h);
    });
};
export const DISPLAY = 'BMSDisplay, serif';
export const TEXT = 'BMSText, sans-serif';
