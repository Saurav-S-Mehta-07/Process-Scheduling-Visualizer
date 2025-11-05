export function priorityNP(processes) {
  let t=0, completed=0, n=processes.length, out=[];
  let arr = processes.map((p,i)=>({...p, idx:i, done:false}));
  while(completed < n) {
    let ready = arr.filter(p => !p.done && p.arrival <= t);
    if(!ready.length) {
      t++;
      continue;
    }
    let highest = ready.reduce((min,p) => p.priority < min.priority ? p : min, ready[0]);
    highest.done = true;
    let start = Math.max(t, highest.arrival);
    let waiting = start - highest.arrival;
    let end = start + highest.burst;
    let tat = end - highest.arrival;
    out.push({...highest, start, end, waiting, tat});
    t = end;
    completed++;
  }
  return out;
}
