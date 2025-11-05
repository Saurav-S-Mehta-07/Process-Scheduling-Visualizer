import { ALGORITHMS } from './constants.js';

export function renderAlgoCards(ALGORITHMS, selectedAlgoIdx, algoCardsContainerId, selectedAlgoNameId, priorityColClass, priorityInputId, quantumInputParentId, onSelectAlgorithm) {
  const container = document.getElementById(algoCardsContainerId);
  container.innerHTML = "";
  ALGORITHMS.forEach((alg, idx) => {
    const card = document.createElement("div");
    card.className = "algo-card";
    card.innerHTML = `<span class="algo-icon">${alg.icon}</span><span>${alg.name}</span>`;
    if (idx === selectedAlgoIdx) card.classList.add("selected");
    card.onclick = () => { onSelectAlgorithm(idx); };
    container.appendChild(card);
  });

  const showPriority = ALGORITHMS[selectedAlgoIdx].name.startsWith("Priority");
  Array.from(document.getElementsByClassName(priorityColClass)).forEach(el => el.style.display = showPriority ? "" : "none");
  document.getElementById(priorityInputId).style.display = showPriority ? "" : "none";
  document.getElementById(quantumInputParentId).style.display = (ALGORITHMS[selectedAlgoIdx].name === "RR") ? "" : "none";
}

export function renderProcessTable(processes, processTableBodyId, selectedAlgoIdx, priorityColClass) {
  const tbody = document.querySelector(`#${processTableBodyId} tbody`);
  tbody.innerHTML = "";
  processes.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${p.pid}</td><td>${p.arrival}</td><td>${p.burst}</td><td class="${priorityColClass}" style="display:${
      ALGORITHMS[selectedAlgoIdx].name.startsWith("Priority") ? "" : "none"
      };">${p.priority || ""}</td>`;
    tbody.appendChild(tr);
  });
}

export function showSummaryTable(schedule, resultsDivId) {
  if (!schedule || schedule.length === 0) return;
  const resultsDiv = document.getElementById(resultsDivId);
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
