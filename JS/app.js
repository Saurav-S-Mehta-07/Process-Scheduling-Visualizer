import { ALGORITHMS, ALGO_COLOR } from './constants.js';
import { fcfs } from './algorithms/fcfs.js';
import { sjf } from './algorithms/sjf.js';
import { srtf } from './algorithms/srtf.js';
import { priorityNP } from './algorithms/priorityNP.js';
import { priorityP } from './algorithms/priorityP.js';
import { rr } from './algorithms/rr.js';
import { renderAlgoCards, renderProcessTable, showSummaryTable } from './ui.js';
import { drawGanttAnimated, clearGantt, clearTimeouts } from './ganttChart.js';

let selectedAlgoIdx = 0, processes = [], quantum = 2;

const priorityColClass = "priorityCol";
const quantumInput = document.getElementById("quantum");
const runBtn = document.getElementById("runBtn");
const resetBtn = document.getElementById("resetBtn");
const processForm = document.getElementById("addProcessForm");
const processTableBodyId = "processTable";
const resultsDivId = "resultsSummary";
const ganttCanvas = document.getElementById("ganttChart");
const timelineDiv = document.getElementById("timeline");
const selectedAlgoName = document.getElementById("selectedAlgoName");
const exportBtn = document.getElementById("exportBtn");

function selectAlgorithm(idx) {
  selectedAlgoIdx = idx;
  renderAlgoCards(
    ALGORITHMS,
    selectedAlgoIdx,
    "algoCards",
    "selectedAlgoName",
    priorityColClass,
    "priority",
    quantumInput.parentElement.id,
    selectAlgorithm
  );
  selectedAlgoName.textContent = `${ALGORITHMS[idx].name} — ${ALGORITHMS[idx].desc}`;
}

renderAlgoCards(
  ALGORITHMS,
  selectedAlgoIdx,
  "algoCards",
  "selectedAlgoName",
  priorityColClass,
  "priority",
  quantumInput.parentElement.id,
  selectAlgorithm
);
selectAlgorithm(0);

processForm.onsubmit = function(e) {
  e.preventDefault();
  const pid = document.getElementById("pid").value || `P${processes.length + 1}`;
  const arrival = Number(document.getElementById("arrival").value);
  const burst = Number(document.getElementById("burst").value);
  let prio = document.getElementById("priority").value;
  let process = { pid, arrival, burst };
  if (ALGORITHMS[selectedAlgoIdx].name.startsWith("Priority")) {
    process.priority = Number(prio) || 1;
  }
  processes.push(process);
  renderProcessTable(processes, processTableBodyId, selectedAlgoIdx, priorityColClass);
  processForm.reset();
};

quantumInput.onchange = () => { quantum = Number(quantumInput.value); };

resetBtn.onclick = function() {
  processes = [];
  renderProcessTable(processes, processTableBodyId, selectedAlgoIdx, priorityColClass);
  resultsDivId && (document.getElementById(resultsDivId).innerHTML = "");
  timelineDiv.innerHTML = "";
  clearGantt(ganttCanvas, timelineDiv);
};

runBtn.onclick = function() {
  clearTimeouts();
  let algorithmName = ALGORITHMS[selectedAlgoIdx].name;
  let procCopy = processes.map(p => ({ ...p }));
  let schedule;
  switch (algorithmName) {
    case "FCFS": schedule = fcfs(procCopy); break;
    case "SJF": schedule = sjf(procCopy); break;
    case "SRTF": schedule = srtf(procCopy); break;
    case "PriorityNP": schedule = priorityNP(procCopy); break;
    case "PriorityP": schedule = priorityP(procCopy); break;
    case "RR": schedule = rr(procCopy, quantum); break;
    default: return;
  }
  drawGanttAnimated(schedule, ganttCanvas, timelineDiv);
  showSummaryTable(schedule, resultsDivId);
};

exportBtn.onclick = () => {
  const link = document.createElement('a');
  link.download = 'gantt_chart.png';
  link.href = ganttCanvas.toDataURL();
  link.click();
};
