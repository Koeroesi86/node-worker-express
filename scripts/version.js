const { execSync } = require('child_process');

const { TRAVIS_TAG, TRAVIS_BUILD_NUMBER } = process.env;

const now = new Date();
const version = `${(now.getFullYear() + '').substring(2)}.${((now.getMonth() + 1) + '').padStart(2, '0')}.${TRAVIS_BUILD_NUMBER}-${TRAVIS_TAG || 'release'}`;

execSync(`yarn version --no-git-tag-version --new-version "v${version}"`, { shell: true });
console.log('version set', version);
