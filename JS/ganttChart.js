import { ALGO_COLOR } from './constants.js';

let chartTimeouts = [];

export function clearGantt(ganttCanvas, timelineDiv) {
  const ctx = ganttCanvas.getContext("2d");
  ctx.clearRect(0, 0, ganttCanvas.width, ganttCanvas.height);
  timelineDiv.innerHTML = '';
}

export function clearTimeouts() {
  chartTimeouts.forEach(t => clearTimeout(t));
  chartTimeouts = [];
}

export function drawGanttAnimated(schedule, ganttCanvas, timelineDiv) {
  clearGantt(ganttCanvas, timelineDiv);
  if (!schedule || schedule.length === 0) return;
  const ctx = ganttCanvas.getContext("2d");
  const barH = 46;
  const marginL = 40;
  const marginR = 40;
  const w = ganttCanvas.width - marginL - marginR;
  const totalT = schedule[schedule.length - 1].end;
  const scale = w / totalT;
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
      ctx.fillText(seg.pid, x + width / 2, 60);

      ctx.font = "1.02em Montserrat";
      ctx.fillStyle = "#222";
      ctx.textAlign = "left";
      ctx.fillText(seg.start, x, 92);
      if (idx === schedule.length - 1 || seg.end !== schedule[idx + 1]?.start)
        ctx.fillText(seg.end, marginL + seg.end * scale - 14, 92);

      addTimelineLabel(seg.start, seg.end, scale, marginL, timelineDiv);
    }, 150 * idx));
  });
}

function addTimelineLabel(start, end, scale, marginL, timelineDiv) {
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
