export function rr(processes, quantum) {
  let n = processes.length;
  let t = 0;
  let completed = 0;
  let queue = [];
  let schedule = [];
  let remainingBurst = processes.map(p => p.burst);
  let arrival = processes.map(p => p.arrival);
  let isInQueue = new Array(n).fill(false);
  let waitingTime = new Array(n).fill(0);
  let lastExecTime = new Array(n).fill(-1);

  processes = processes.map((p, i) => ({ ...p, idx: i }));
  processes.sort((a,b) => a.arrival - b.arrival);

  for(let i=0; i<n; i++) {
    if(processes[i].arrival === processes[0].arrival) {
      queue.push(processes[i].idx);
      isInQueue[processes[i].idx] = true;
    }
  }
  t = processes[0].arrival;

  while(completed < n) {
    if(queue.length === 0) {
      let nextArrival = Math.min(...arrival.filter((a,i) => !isInQueue[i] && arrival[i] > t));
      if(nextArrival !== Infinity && nextArrival > t) {
        t = nextArrival;
        for(let i=0; i<n; i++) {
          if(arrival[i] <= t && !isInQueue[i] && remainingBurst[i] > 0) {
            queue.push(i);
            isInQueue[i] = true;
          }
        }
      }
      continue;
    }

    let idx = queue.shift();
    let runTime = Math.min(quantum, remainingBurst[idx]);
    let start = t;
    let end = t + runTime;

    if(lastExecTime[idx] === -1) {
      waitingTime[idx] += start - arrival[idx];
    } else {
      waitingTime[idx] += start - lastExecTime[idx];
    }

    schedule.push({
      pid: processes.find(p => p.idx === idx).pid,
      start: start,
      end: end,
      waiting: waitingTime[idx],
      tat: end - arrival[idx]
    });

    remainingBurst[idx] -= runTime;
    t = end;
    lastExecTime[idx] = t;

    for(let i=0; i<n; i++) {
      if(arrival[i] <= t && !isInQueue[i] && remainingBurst[i] > 0) {
        queue.push(i);
        isInQueue[i] = true;
      }
    }

    if(remainingBurst[idx] > 0) {
      queue.push(idx);
    } else {
      completed++;
    }
  }
  return schedule;
}
