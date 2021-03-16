export default function createProgressThreshold(height, threshold) {
    const count = Math.ceil(height / threshold);
    const t = [];
    const ratio = 1 / count;
    for (let i = 0; i < count + 1; i += 1) {
      t.push(i * ratio);
    }
    return t;
  }