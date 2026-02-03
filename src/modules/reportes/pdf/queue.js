const MAX_CONCURRENT = 4; // recomendado incluso con 32GB
let active = 0;
const queue = [];

function run(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (active >= MAX_CONCURRENT || queue.length === 0) return;

  const { task, resolve, reject } = queue.shift();
  active++;

  try {
    const result = await task();
    resolve(result);
  } catch (err) {
    reject(err);
  } finally {
    active--;
    processQueue();
  }
}

module.exports = {
  run
};
