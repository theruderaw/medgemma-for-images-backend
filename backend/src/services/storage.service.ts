import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';

export const storageService = {
  async save(buffer: Buffer, extension: 'png' | 'jpg' | 'jpeg'): Promise<string> {
    await fs.mkdir(env.storageDir, { recursive: true });
    const key = `${uuidv4()}.${extension}`;
    await fs.writeFile(path.join(env.storageDir, key), buffer);
    return key;
  },

  async read(storageKey: string): Promise<Buffer> {
    return fs.readFile(path.join(env.storageDir, storageKey));
  },

  async delete(storageKey: string): Promise<void> {
    await fs.rm(path.join(env.storageDir, storageKey), { force: true });
  },
};