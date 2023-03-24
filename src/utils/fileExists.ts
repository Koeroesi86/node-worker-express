import fs from 'fs/promises';

const fileExists = (fileName: string) =>
  fs
    .access(fileName, fs.constants.R_OK)
    .then(() => true)
    .catch(() => false);

export default fileExists;
