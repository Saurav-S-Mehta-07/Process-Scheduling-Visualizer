export function srtf(processes) {
  let n = processes.length;
  let arr = processes.map(p => ({ ...p, remaining: p.burst, pid: p.pid }));
  let t = 0, done = 0;
  let schedule = [];
  let lastPid = null;

  while (done < n) {
    let ready = arr.filter(p => p.arrival <= t && p.remaining > 0);
    if (ready.length === 0) {
      t++;
      lastPid = null;
      continue;
    }
    let shortest = ready.reduce((min, p) => p.remaining < min.remaining ? p : min, ready[0]);

    if (schedule.length > 0 && lastPid === shortest.pid && schedule[schedule.length - 1].end === t) {
      schedule[schedule.length - 1].end = t + 1;
    } else {
      schedule.push({ pid: shortest.pid, start: t, end: t + 1 });
    }

    shortest.remaining--;
    t++;
    lastPid = shortest.pid;

    if (shortest.remaining === 0) done++;
  }

  return schedule;
}
