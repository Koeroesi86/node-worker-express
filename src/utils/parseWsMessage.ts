// TODO: improve
const parseWsMessage = (data: Buffer) => {
  const dl = data[1] & 127;
  let ifm = 2;
  if (dl === 126) {
    ifm = 4;
  } else if (dl === 127) {
    ifm = 10;
  }
  let i = ifm + 4;
  const masks = data.slice(ifm, i);
  let index = 0;
  let output = '';
  const l = data.length;
  while (i < l) {
    output += String.fromCharCode(data[i++] ^ masks[index++ % 4]);
  }
  return output;
};

export default parseWsMessage;
