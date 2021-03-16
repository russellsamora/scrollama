  export default function generateId() {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const date = Date.now();
    const result = [];
    for (let i = 0; i < 6; i += 1) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      result.push(char);
    }
    return `${result.join("")}${date}`;
  }