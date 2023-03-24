import path from 'path';
import fs from 'fs/promises';
import fileExists from './fileExists';
import { Stats } from 'fs';

async function resolvePath(rootPath: string, pathFragments: string[], indexFiles: string[]) {
  const currentPathFragments = pathFragments.slice();
  let indexPath = path.join(rootPath, ...currentPathFragments);
  let isWorker = false;
  let pathExists = false;
  let stats: Stats | undefined;

  for (let i = currentPathFragments.length; i >= 0 && !pathExists; i--) {
    if (pathExists) continue;
    currentPathFragments.splice(i);
    const currentPath = path.join(rootPath, ...currentPathFragments);
    pathExists = await fileExists(currentPath);
    if (!pathExists) continue;
    stats = await fs.stat(currentPath);

    if (stats.isDirectory()) {
      // index fallback
      let checkIndexFilePath: string = '';
      for (let indexFile of indexFiles) {
        if (checkIndexFilePath) {
          continue;
        }

        const current = path.join(currentPath, indexFile);
        if (await fileExists(current)) {
          checkIndexFilePath = indexFile;
        }
      }

      if (checkIndexFilePath) {
        isWorker = true;
        indexPath = path.join(currentPath, checkIndexFilePath);
      } else {
        isWorker = true;
        indexPath = path.join(...currentPathFragments);
      }
    } else if (stats.isFile() && indexFiles.includes(currentPathFragments[currentPathFragments.length - 1])) {
      isWorker = true;
    }

    if (isWorker) {
      break;
    }
  }

  return { indexPath, isWorker, pathExists, stats };
}

export default resolvePath;
