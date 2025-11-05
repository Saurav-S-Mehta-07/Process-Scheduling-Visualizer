export function fcfs(processes) {
  processes.sort((a,b) => a.arrival - b.arrival);
  let t = 0, out = [];
  processes.forEach(p => {
    let start = Math.max(t, p.arrival);
    let waiting = start - p.arrival;
    let end = start + p.burst;
    let tat = end - p.arrival;
    out.push({...p, start, end, waiting, tat});
    t = end;
  });
  return out;
}
