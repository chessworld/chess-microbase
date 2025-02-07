export const MOVE_WIDTH   = 85;
export const MOVE_HEIGHT  = 26;
export const RESULTS      = ['*', '1-0', '1/2-1/2', '0-1'];
export const FINISH_REASONS = {
  '-': 'Not Finished',
  r: 'Black Resigned',
  R: 'White Resigned',
  i: 'Scoresheet Illegible',
  d: 'Agreed a Draw',
  D: 'Forced Draw',
  t: 'Black Loss on Time',
  T: 'White Loss on Time'
};
export const FINISH_REASONS_LONG = {
  '-': 'Game has not ended, I will add more moves later',
  R: 'White resigned',
  r: 'Black resigned',
  i: "Scoresheet illegible, unable to read more moves",
  d: 'Agreed a draw',
  D: 'Forced draw',
  T: 'White lost on time',
  t: 'Black lost on time'
};