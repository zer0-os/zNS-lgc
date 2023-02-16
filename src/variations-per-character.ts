const main = async () => {
  // \n,./<>?;':\"[]{}=+`~!@#$%^&*()|\\  are not allowed (no spaces either)
  const humanCharacters = "abcdefghijklmnopqrstuvwxyz-1234567890_";
  const numHumanCharacters = humanCharacters.length;

  let lastNum = numHumanCharacters;
  console.log(`with 1 character: ${lastNum}`);
  for (let i = 2; i < 12; ++i) {
    lastNum *= numHumanCharacters;

    console.log(`with ${i} character: ${lastNum}`);
  }
};

main().catch(console.error);
