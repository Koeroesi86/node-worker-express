// TODO: improve
const constructWsMessage = (text: string) => {
  const jsonByteLength = Buffer.byteLength(text);
  // Note: we're not supporting > 65535 byte payloads at this stage
  const lengthByteCount = jsonByteLength < 126 ? 0 : 2;
  const payloadLength = lengthByteCount === 0 ? jsonByteLength : 126;
  const buffer = Buffer.alloc(2 + lengthByteCount + jsonByteLength);
  // Write out the first byte, using opcode `1` to indicate that the message
  // payload contains text data
  buffer.writeUInt8(0b10000001, 0);
  buffer.writeUInt8(payloadLength, 1);
  // Write the length of the JSON payload to the second byte
  let payloadOffset = 2;
  if (lengthByteCount > 0) {
    buffer.writeUInt16BE(jsonByteLength, 2);
    payloadOffset += lengthByteCount;
  }
  // Write the JSON data to the data buffer
  buffer.write(text, payloadOffset);
  return buffer;
};

export default constructWsMessage;
