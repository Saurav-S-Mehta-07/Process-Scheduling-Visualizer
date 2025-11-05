// --- Algorithm Data ---
const ALGORITHMS = [
  { name: "FCFS", desc: "First Come First Serve", icon: "🕒" },
  { name: "SJF", desc: "Shortest Job First (Non-Preemptive)", icon: "⚡" },
  { name: "SRTF", desc: "Shortest Remaining Time First (Preemptive)", icon: "⏳" },
  { name: "PriorityNP", desc: "Priority (Non-Preemptive)", icon: "⭐" },
  { name: "PriorityP", desc: "Priority (Preemptive)", icon: "🌟" },
  { name: "RR", desc: "Round Robin", icon: "🔁" }
];
const ALGO_COLOR = ["#4fc3f7", "#ffb74d", "#ba68c8", "#81c784", "#fd7c45", "#5bb9ae"];

let selectedAlgoIdx = 0, processes = [], quantum = 2, chartTimeouts = [];

const priorityColEls = document.getElementsByClassName("priorityCol");
const quantumInput = document.getElementById("quantum");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const processForm = document.getElementById("addProcessForm");
const processTableBody = document.querySelector("#processTable tbody");
const resultsDiv = document.getElementById("resultsSummary");
const ganttCanvas = document.getElementById("ganttChart");
const timelineDiv = document.getElementById("timeline");
const selectedAlgoName = document.getElementById("selectedAlgoName");
const exportBtn = document.getElementById("exportBtn");
const playPauseBtn = document.getElementById("playPauseBtn");

function renderAlgoCards() {
  const container = document.getElementById("algoCards");
  container.innerHTML = "";
  ALGORITHMS.forEach((alg, idx) => {
    const card = document.createElement("div");
    card.className = "algo-card";
    card.innerHTML = `<span class="algo-icon">${alg.icon}</span><span>${alg.name}</span>`;
    if(idx === selectedAlgoIdx) card.classList.add("selected");
    card.onclick = () => { selectAlgorithm(idx); };
    container.appendChild(card);
  });
}
function selectAlgorithm(idx) {
  selectedAlgoIdx = idx;
  renderAlgoCards();
  selectedAlgoName.textContent = `${ALGORITHMS[idx].name} — ${ALGORITHMS[idx].desc}`;
  const showPriority = ALGORITHMS[idx].name.startsWith("Priority");
  Array.from(priorityColEls).forEach(el => el.style.display = showPriority ? "" : "none");
  document.getElementById("priority").style.display = showPriority ? "" : "none";
  document.getElementById("quantum").parentElement.style.display = (ALGORITHMS[idx].name === "RR") ? "" : "none";
}
renderAlgoCards(); selectAlgorithm(0);

processForm.onsubmit = function(e) {
  e.preventDefault();
  const pid = document.getElementById("pid").value || `P${processes.length+1}`;
  const arrival = Number(document.getElementById("arrival").value);
  const burst = Number(document.getElementById("burst").value);
  let prio = document.getElementById("priority").value;
  let process = { pid, arrival, burst };
  if (ALGORITHMS[selectedAlgoIdx].name.startsWith("Priority")) {
    process.priority = Number(prio) || 1;
  }
  processes.push(process);
  renderProcessTable();
  processForm.reset();
};
quantumInput.onchange = () => { quantum = Number(quantumInput.value); };

function renderProcessTable() {
  processTableBody.innerHTML = "";
  processes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${p.pid}</td><td>${p.arrival}</td><td>${p.burst}</td><td class="priorityCol" style="display:${
        ALGORITHMS[selectedAlgoIdx].name.startsWith("Priority") ? "" : "none"
      };">${p.priority || ""}</td>`;
    processTableBody.appendChild(tr);
  });
}

resetBtn.onclick = function(){
  processes = [];
  renderProcessTable();
  resultsDiv.innerHTML = "";
  timelineDiv.innerHTML = "";
  clearGantt();
};

runBtn.onclick = function () {
  clearTimeouts();
  let algorithm = ALGORITHMS[selectedAlgoIdx].name;
  let procCopy = processes.map(p => ({ ...p }));
  let schedule;
  switch(algorithm) {
    case "FCFS": schedule = fcfs(procCopy); break;
    case "SJF": schedule = sjf(procCopy); break;
    case "SRTF": schedule = srtf(procCopy); break;
    case "PriorityNP": schedule = priorityNP(procCopy); break;
    case "PriorityP": schedule = priorityP(procCopy); break;
    case "RR": schedule = rr(procCopy, quantum); break;
    default: return;
  }
  drawGanttAnimated(schedule);
  showSummaryTable(schedule);
};

function clearGantt() {
  const ctx = ganttCanvas.getContext("2d");
  ctx.clearRect(0,0,ganttCanvas.width,ganttCanvas.height);
  timelineDiv.innerHTML = '';
}
function clearTimeouts() {
  chartTimeouts.forEach(t => clearTimeout(t));
  chartTimeouts = [];
}

function drawGanttAnimated(schedule) {
  clearGantt();
  if (!schedule || schedule.length === 0) return;
  const ctx = ganttCanvas.getContext("2d");
  const barH = 46;
  const marginL = 40;
  const marginR = 40;
  const w = ganttCanvas.width - marginL - marginR;
  const totalT = schedule[schedule.length - 1].end;
  const scale = w / totalT;
  let delay = 0;
  timelineDiv.innerHTML = "";

  const pidColorMap = {};
  let colorIdx = 0;
  schedule.forEach(s => {
    if (!(s.pid in pidColorMap)) {
      pidColorMap[s.pid] = ALGO_COLOR[colorIdx % ALGO_COLOR.length];
      colorIdx++;
    }
  });

  schedule.forEach((seg, idx) => {
    chartTimeouts.push(setTimeout(() => {
      ctx.fillStyle = pidColorMap[seg.pid];
      ctx.globalAlpha = 0.94;
      const gap = 1;
      const x = marginL + seg.start * scale;
      let width = (seg.end - seg.start) * scale - gap;
      if (width < 0) width = 0;
      ctx.fillRect(x, 30, width, barH);

      ctx.globalAlpha = 1;
      ctx.font = "bold 1.15em Montserrat";
      ctx.fillStyle = "#fff";
      ctx.textAlign = "center";
      ctx.fillText(seg.pid, x + width/2, 60);

      ctx.font = "1.02em Montserrat";
      ctx.fillStyle = "#222";
      ctx.textAlign = "left";
      ctx.fillText(seg.start, x, 92);
      if(idx === schedule.length -1 || seg.end !== schedule[idx+1]?.start)
        ctx.fillText(seg.end, marginL + seg.end * scale - 14, 92);

      addTimelineLabel(seg.start, seg.end, scale, marginL);
    }, delay + 150 * idx));
  });
}

function addTimelineLabel(start, end, scale, marginL) {
  const spanStart = document.createElement("span");
  spanStart.textContent = `${start}`;
  spanStart.style.marginLeft = `${marginL + start * scale - 7}px`;
  spanStart.style.marginRight = "8px";
  timelineDiv.appendChild(spanStart);

  if (end !== start) {
    const spanEnd = document.createElement("span");
    spanEnd.textContent = `${end}`;
    spanEnd.style.marginLeft = `${marginL + end * scale - 17}px`;
    timelineDiv.appendChild(spanEnd);
  }
}

function showTooltip(e, seg) {
  document.querySelector(".gantt-tooltip")?.remove();
  if (!seg) return;
  const tooltip = document.createElement("div");
  tooltip.className = "gantt-tooltip";
  tooltip.innerHTML =
    `<b>PID</b>: ${seg.pid}<br>
     <b>Start</b>: ${seg.start}<br>
     <b>End</b>: ${seg.end}<br>
     <b>Waiting</b>: ${seg.waiting || 0}<br>
     <b>Turnaround</b>: ${seg.tat || 0}`;
  document.body.appendChild(tooltip);
  tooltip.style.left = `${e.pageX + 16}px`;
  tooltip.style.top = `${e.pageY - 20}px`;
  setTimeout(() => {
    tooltip.style.opacity = 1;
  }, 60);
}

function showSummaryTable(schedule) {
  if (!schedule || schedule.length === 0) return;
  const summary = {};
  schedule.forEach(s => {
    summary[s.pid] = summary[s.pid] || { pid: s.pid, waiting: 0, tat: 0, end: 0 };
    summary[s.pid].waiting += s.waiting || 0;
    summary[s.pid].tat += s.tat || 0;
    if (s.end > summary[s.pid].end) summary[s.pid].end = s.end;
  });
  const pids = Object.keys(summary);
  const avgWT = (pids.reduce((a, p) => a + summary[p].waiting, 0) / pids.length).toFixed(2);
  const avgTAT = (pids.reduce((a, p) => a + summary[p].tat, 0) / pids.length).toFixed(2);
  let table = `<table><thead><tr><th>PID</th><th>Waiting</th><th>Turnaround</th><th>Completion</th></tr></thead><tbody>`;
  pids.forEach(p => {
    table += `<tr><td>${p}</td><td>${summary[p].waiting}</td><td>${summary[p].tat}</td><td>${summary[p].end}</td></tr>`;
  });
  table += `<tr class="avg-row"><td>Average</td><td>${avgWT}</td><td>${avgTAT}</td><td>—</td></tr></tbody></table>`;
  resultsDiv.innerHTML = table;
}

// --- FCFS Algorithm ---
function fcfs(processes) {
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

// --- SJF Algorithm ---
function sjf(processes) {
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

// --- SRTF Algorithm ---
function srtf(processes) {
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

    // If same as last, extend segment, else start new segment for preemption
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


// --- Priority Non-Preemptive ---
function priorityNP(processes) {
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

// --- Priority Preemptive ---
function priorityP(processes) {
  let n = processes.length;
  let arr = processes.map(p => ({ ...p, remaining: p.burst, pid: p.pid }));
  let t = 0, done = 0;
  let schedule = [];
  let lastPid = null;

  while(done < n) {
    let ready = arr.filter(p => p.arrival <= t && p.remaining > 0);
    if(ready.length === 0) {
      t++;
      lastPid = null;
      continue;
    }
    let highest = ready.reduce((min,p) => p.priority < min.priority ? p : min, ready[0]);

    if(schedule.length > 0 && lastPid === highest.pid && schedule[schedule.length - 1].end === t) {
      schedule[schedule.length - 1].end = t + 1;
    } else {
      schedule.push({pid: highest.pid, start: t, end: t + 1});
    }
    highest.remaining--;
    t++;
    lastPid = highest.pid;

    if(highest.remaining === 0) done++;
  }
  return schedule;
}

// --- Round Robin ---
function rr(processes, quantum) {
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

// Export Image
exportBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'gantt_chart.png';
  link.href = ganttCanvas.toDataURL();
  link.click();
};

// Play/Pause placeholder
playPauseBtn.onclick = function() {
  // Implement if needed
};
