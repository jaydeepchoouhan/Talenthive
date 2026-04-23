const LOWERCASE_LETTERS = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LETTERS = `${LOWERCASE_LETTERS}${UPPERCASE_LETTERS}`;
const DIGITS = '0123456789';

function pickRandom(charset) {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

function shuffle(characters) {
  const output = [...characters];

  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }

  return output.join('');
}

function generateAlphaPassword(length = 10) {
  const safeLength = Math.max(2, Number(length) || 10);
  const characters = [pickRandom(LOWERCASE_LETTERS), pickRandom(UPPERCASE_LETTERS)];

  for (let index = characters.length; index < safeLength; index += 1) {
    characters.push(pickRandom(LETTERS));
  }

  return shuffle(characters);
}

function generateResetCode(length = 6) {
  const safeLength = Math.max(4, Number(length) || 6);
  let output = '';

  for (let index = 0; index < safeLength; index += 1) {
    output += pickRandom(UPPERCASE_LETTERS);
  }

  return output;
}

function generateNumericCode(length = 6) {
  const safeLength = Math.max(4, Number(length) || 6);
  let output = '';

  for (let index = 0; index < safeLength; index += 1) {
    output += pickRandom(DIGITS);
  }

  return output;
}

module.exports = { generateAlphaPassword, generateResetCode, generateNumericCode };
