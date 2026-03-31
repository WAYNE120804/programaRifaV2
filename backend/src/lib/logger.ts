type Meta = unknown;

export const logger = {
  info(message: string, meta?: Meta) {
    console.log(message, meta || '');
  },
  error(message: string, meta?: Meta) {
    console.error(message, meta || '');
  },
};
