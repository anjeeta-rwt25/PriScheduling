document.addEventListener('DOMContentLoaded', function () {
  const processTable = document.getElementById('processTable').getElementsByTagName('tbody')[0];
  const addRowBtn = document.getElementById('addRow');
  const runBtn = document.getElementById('runBtn');
  const ganttChartsContainer = document.getElementById('ganttChartsContainer');
  const quantumInput = document.getElementById('quantum');
  const quantumLabel = document.getElementById('quantumLabel');
  const algorithmCheckboxes = document.querySelectorAll('.algorithm');

  // Show/hide priority and quantum fields
  function updateFields() {
    let showPriority = false, showQuantum = false;
    algorithmCheckboxes.forEach(cb => {
      if (cb.checked && cb.value === 'priority') showPriority = true;
      if (cb.checked && cb.value === 'rr') showQuantum = true;
    });
    document.querySelectorAll('.priority-col').forEach(col => col.style.display = showPriority ? '' : 'none');
    quantumInput.style.display = quantumLabel.style.display = showQuantum ? '' : 'none';
  }
  algorithmCheckboxes.forEach(cb => cb.addEventListener('change', updateFields));
  updateFields();

  // Add/Remove process rows
  addRowBtn.onclick = () => {
    const row = processTable.insertRow();
    row.innerHTML = `
      <td><input type="text" value="P${processTable.rows.length + 1}"></td>
      <td><input type="number" value="0"></td>
      <td><input type="number" value="1"></td>
      <td class="priority-col" style="display:none;"><input type="number" value="1"></td>
      <td class="ct"></td>
      <td class="tat"></td>
      <td class="wt"></td>
      <td><button class="remove-row">Remove</button></td>
    `;
    updateFields();
  };
  processTable.addEventListener('click', e => {
    if (e.target.classList.contains('remove-row')) {
      if (processTable.rows.length > 1) e.target.closest('tr').remove();
    }
  });

  // Gather process data from table
  function getProcesses() {
    const procs = [];
    for (let row of processTable.rows) {
      const cells = row.querySelectorAll('td');
      procs.push({
        id: cells[0].querySelector('input').value.trim(),
        arrival: parseInt(cells[1].querySelector('input').value, 10),
        burst: parseInt(cells[2].querySelector('input').value, 10),
        priority: cells[3].style.display !== 'none'
          ? parseInt(cells[3].querySelector('input').value, 10) : 1
      });
    }
    return procs;
  }

  // Scheduling Algorithms
  function fcfs(processes) {
    let time = 0, timeline = [];
    let procs = processes.map(p => ({...p, remaining: p.burst}));
    procs.sort((a, b) => a.arrival - b.arrival);
    for (let p of procs) {
      if (time < p.arrival) time = p.arrival;
      timeline.push({id: p.id, start: time, end: time + p.burst});
      time += p.burst;
    }
    return timeline;
  }

  function sjf(processes) {
    let time = 0, timeline = [], completed = 0;
    let n = processes.length;
    let procs = processes.map(p => ({...p, remaining: p.burst, done: false}));
    while (completed < n) {
      let idx = -1, minBurst = Infinity;
      for (let i = 0; i < n; ++i) {
        if (!procs[i].done && procs[i].arrival <= time && procs[i].burst < minBurst) {
          minBurst = procs[i].burst;
          idx = i;
        }
      }
      if (idx === -1) { time++; continue; }
      let p = procs[idx];
      timeline.push({id: p.id, start: time, end: time + p.burst});
      time += p.burst;
      procs[idx].done = true;
      completed++;
    }
    return timeline;
  }

  function priority(processes) {
    let time = 0, timeline = [], completed = 0;
    let n = processes.length;
    let procs = processes.map(p => ({...p, remaining: p.burst, done: false}));
    while (completed < n) {
      let idx = -1, minPrio = Infinity;
      for (let i = 0; i < n; ++i) {
        if (!procs[i].done && procs[i].arrival <= time && procs[i].priority < minPrio) {
          minPrio = procs[i].priority;
          idx = i;
        }
      }
      if (idx === -1) { time++; continue; }
      let p = procs[idx];
      timeline.push({id: p.id, start: time, end: time + p.burst});
      time += p.burst;
      procs[idx].done = true;
      completed++;
    }
    return timeline;
  }

  function rr(processes, quantum) {
    let time = 0, timeline = [];
    let queue = [];
    let procs = processes.map(p => ({...p, remaining: p.burst}));
    let n = procs.length, completed = 0, inQueue = Array(n).fill(false);

    // Sort by arrival
    procs.forEach((p, i) => { if (p.arrival === 0) { queue.push(i); inQueue[i] = true; } });
    while (completed < n) {
      if (queue.length === 0) {
        // Find next arriving process
        let minArrival = Math.min(...procs.filter((p, i) => !inQueue[i] && p.remaining > 0).map(p => p.arrival));
        time = minArrival;
        procs.forEach((p, i) => { if (!inQueue[i] && p.arrival <= time && p.remaining > 0) { queue.push(i); inQueue[i] = true; } });
        continue;
      }
      let idx = queue.shift();
      let p = procs[idx];
      let execTime = Math.min(quantum, p.remaining);
      timeline.push({id: p.id, start: time, end: time + execTime});
      time += execTime;
      p.remaining -= execTime;
      // Add new arrivals to queue
      procs.forEach((q, i) => {
        if (!inQueue[i] && q.arrival <= time && q.remaining > 0) {
          queue.push(i);
          inQueue[i] = true;
        }
      });
      if (p.remaining > 0) {
        queue.push(idx);
      } else {
        completed++;
      }
    }
    return timeline;
  }

  // Calculate CT, TAT, WT for each process given the timeline
  function calculateTimes(processes, timeline) {
    let procMap = {};
    processes.forEach(p => procMap[p.id] = { ...p, ct: 0, tat: 0, wt: 0 });

    // Find completion time for each process
    for (let i = timeline.length - 1; i >= 0; --i) {
      let id = timeline[i].id;
      if (id && procMap[id] && !procMap[id].ct) {
        procMap[id].ct = timeline[i].end;
      }
    }
    // Calculate TAT and WT
    Object.values(procMap).forEach(p => {
      p.tat = p.ct - p.arrival;
      p.wt = p.tat - p.burst;
    });
    return Object.values(procMap);
  }

  // Helper to update the table with results for a given algorithm
  function updateTableResults(results) {
    const rows = processTable.rows;
    for (let i = 0; i < results.length; ++i) {
      rows[i].querySelector('.ct').textContent = results[i].ct;
      rows[i].querySelector('.tat').textContent = results[i].tat;
      rows[i].querySelector('.wt').textContent = results[i].wt;
    }
  }

  // Calculate and show total TAT and WT
  function showTotals(results, algoName) {
    let totalTAT = results.reduce((sum, p) => sum + p.tat, 0);
    let totalWT = results.reduce((sum, p) => sum + p.wt, 0);
    let avgTAT = (totalTAT / results.length).toFixed(2);
    let avgWT = (totalWT / results.length).toFixed(2);

    const totalDiv = document.createElement('div');
    totalDiv.className = 'totals';
    totalDiv.innerHTML = `<strong>${algoName} Totals:</strong> 
      Total TAT: ${totalTAT}, Avg TAT: ${avgTAT} <br>
      Total WT: ${totalWT}, Avg WT: ${avgWT}`;
    return totalDiv;
  }

  // Render Gantt Chart
  function renderGanttChart(timeline, algoName) {
    let chartDiv = document.createElement('div');
    chartDiv.className = 'ganttChartBlock';
    chartDiv.innerHTML = `<h2>${algoName} Gantt Chart</h2>`;

    // Gantt chart row
    let row = document.createElement('div');
    row.className = 'ganttChartRow';
    row.style.display = 'flex';
    row.style.alignItems = 'flex-end';
    row.style.marginBottom = '10px';

    // Time axis row
    let timeRow = document.createElement('div');
    timeRow.style.display = 'flex';
    timeRow.style.alignItems = 'flex-start';

    // Draw blocks and time axis
    timeline.forEach((block, i) => {
      let width = Math.max(40, 30 * (block.end - block.start));
      let blockDiv = document.createElement('div');
      blockDiv.className = 'gantt-block';
      blockDiv.style.minWidth = width + 'px';
      blockDiv.style.position = 'relative';
      blockDiv.innerHTML = `<div>${block.id}</div>`;

      // Only show start time for the first block, then show end time for each block
      let timeLabel = document.createElement('div');
      timeLabel.className = 'gantt-time';
      timeLabel.style.position = 'absolute';
      timeLabel.style.left = '0';
      timeLabel.style.bottom = '-22px';
      timeLabel.style.fontSize = '13px';
      timeLabel.style.color = '#1976d2';
      timeLabel.style.fontWeight = '500';
      timeLabel.innerText = block.start;
      blockDiv.appendChild(timeLabel);

      row.appendChild(blockDiv);

      // Time axis: show end time under each block
      let timeEnd = document.createElement('div');
      timeEnd.style.minWidth = width + 'px';
      timeEnd.style.textAlign = 'right';
      timeEnd.style.fontSize = '13px';
      timeEnd.style.color = '#1976d2';
      timeEnd.innerText = block.end;
      timeRow.appendChild(timeEnd);
    });

    chartDiv.appendChild(row);
    chartDiv.appendChild(timeRow);
    return chartDiv;
  }

  // Run Simulation
  runBtn.onclick = () => {
    ganttChartsContainer.innerHTML = '';
    const processes = getProcesses();
    const selectedAlgos = Array.from(algorithmCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
    const quantum = parseInt(quantumInput.value, 10);

    if (selectedAlgos.length === 0) {
      alert('Please select at least one algorithm.');
      return;
    }

    selectedAlgos.forEach(algo => {
      let timeline, name;
      if (algo === 'fcfs') {
        timeline = fcfs(processes);
        name = 'FCFS';
      } else if (algo === 'sjf') {
        timeline = sjf(processes);
        name = 'SJF';
      } else if (algo === 'priority') {
        timeline = priority(processes);
        name = 'Priority';
      } else if (algo === 'rr') {
        timeline = rr(processes, quantum);
        name = `Round Robin (q=${quantum})`;
      }
      ganttChartsContainer.appendChild(renderGanttChart(timeline, name));

      // Calculate and update table and show totals for each algorithm
      const results = calculateTimes(processes, timeline);
      updateTableResults(results);
      ganttChartsContainer.appendChild(showTotals(results, name));
    });
  };
});