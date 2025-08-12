export const calculateEloChange = (ratingA: number, ratingB: number, result: number, kFactor = 32): number => {
  const expectedA = 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
  const change = Math.round(kFactor * (result - expectedA));
  return change;
};