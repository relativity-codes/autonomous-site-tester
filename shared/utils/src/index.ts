export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  return `${seconds}s`;
};
