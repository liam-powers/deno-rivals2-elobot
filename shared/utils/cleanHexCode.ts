export default function cleanHexCode(
  hexCode: string | null,
): string | undefined {
  if (!hexCode) {
    return;
  }

  const hexSet = new Set();
  const hexVals = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ];
  hexVals.forEach((hexVal) => hexSet.add(hexVal));

  try {
    let currHexCode = hexCode;
    if (currHexCode.startsWith("#")) {
      currHexCode = currHexCode.slice(1);
    }

    if (currHexCode.length !== 6) {
      throw new Error();
    }

    for (let i = 0; i < currHexCode.length; i++) {
      if (!(hexSet.has(currHexCode[i].toUpperCase()))) {
        throw new Error();
      }
    }
    currHexCode = "#" + currHexCode;
    return currHexCode;
  } catch (error) {
    throw new Error(`Error cleaning hex code! ${error}`);
  }
}
