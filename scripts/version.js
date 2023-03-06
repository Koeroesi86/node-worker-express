const { execSync } = require('child_process');

const { GITHUB_RUN_ID, GITHUB_REF_NAME } = process.env;

if (!GITHUB_REF_NAME) {
  throw new Error(`GITHUB_REF_NAME: ${GITHUB_REF_NAME}`);
}

if (!GITHUB_RUN_ID) {
  throw new Error(`GITHUB_RUN_ID: ${GITHUB_RUN_ID}`);
}

const now = new Date();
const version = `${`${now.getFullYear()}`.substring(2)}.${`${now.getMonth() + 1}`.padStart(2, '0')}.${GITHUB_RUN_ID}-${GITHUB_REF_NAME}`;

execSync(`yarn version --no-git-tag-version --new-version "v${version}"`, { shell: true });

// eslint-disable-next-line no-console
console.log('version set', version);
