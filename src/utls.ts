import generate from "nanoid/generate";

export function nanoid(): string {
  return generate("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-", 21);
}

export function epochTime()  {
  return Math.floor(Date.now() / 1000);
}
