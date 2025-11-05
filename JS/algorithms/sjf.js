export function sjf(processes) {
  let t = 0, completed = 0, n = processes.length, out = [];
  let arr = processes.map((p,i)=>({...p, idx:i, done:false}));
  while(completed < n) {
    let ready = arr.filter(p => !p.done && p.arrival <= t);
    if(!ready.length) {
      t++;
      continue;
    }
    let shortest = ready.reduce((min, p) => p.burst < min.burst ? p : min, ready[0]);
    shortest.done = true;
    let start = Math.max(t, shortest.arrival);
    let waiting = start - shortest.arrival;
    let end = start + shortest.burst;
    let tat = end - shortest.arrival;
    out.push({...shortest, start, end, waiting, tat});
    t = end;
    completed++;
  }
  return out;
}
