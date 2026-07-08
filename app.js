// Speed, Distance, & Time Interactive Tutor

document.addEventListener('DOMContentLoaded', () => {
  // Global App State
  const state = {
    mode: 'examples', // 'examples' or 'practice'
    selectedProblemId: 'ex-1',
    theme: 'dark',
    animationTime: 0, // Current animation time in seconds (simulated)
    isPlaying: false,
    speedMultiplier: 1.0,
    activeCategory: 'all',
    searchQuery: '',
    customParams: {}, // Stores user modified values from sliders
    animationFrameId: null,
    canvasResizeObserver: null
  };

  // UI Element Selectors
  const problemListContainer = document.getElementById('problem-list');
  const searchInput = document.getElementById('problem-search');
  const categoryFilters = document.querySelectorAll('.filter-btn');
  const modeExamplesBtn = document.getElementById('mode-examples');
  const modePracticeBtn = document.getElementById('mode-practice');
  const themeToggleBtn = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  
  const problemTitleDisplay = document.getElementById('problem-title-display');
  const problemTextDisplay = document.getElementById('problem-text-display');
  
  const canvas = document.getElementById('motion-canvas');
  const ctx = canvas.getContext('2d');
  const playPauseBtn = document.getElementById('anim-play-pause');
  const playPauseIcon = document.getElementById('play-pause-icon');
  const resetBtn = document.getElementById('anim-reset');
  const timelineSlider = document.getElementById('timeline-slider');
  const timelineValDisplay = document.getElementById('timeline-val');
  const speedMultiplierSelect = document.getElementById('anim-speed-multiplier');
  
  const slidersContainer = document.getElementById('playground-sliders-container');
  const mathTableBody = document.getElementById('math-table-body');
  const stepsContainer = document.getElementById('solution-steps-container');
  const finalAnswerValDisplay = document.getElementById('final-answer-val-display');
  
  const quizPrompt = document.getElementById('quiz-question-prompt');
  const quizInput = document.getElementById('quiz-user-input');
  const quizUnits = document.getElementById('quiz-units');
  const quizSubmitBtn = document.getElementById('quiz-submit');
  const quizFeedback = document.getElementById('quiz-feedback');

  // Math Problems Database
  const problems = [
    // --- TEXTBOOK EXAMPLES ---
    {
      id: 'ex-1',
      title: 'Example 8.8.1',
      isExample: true,
      category: 'opposite',
      text: 'Joey and Natasha start from the same point and walk in opposite directions. Joey walks <span class="highlight">2 km/h</span> faster than Natasha. After <span class="highlight">3 hours</span>, they are <span class="highlight">30 kilometres</span> apart. How fast did each walk?',
      defaultParams: { natashaRate: 4, joeyDiff: 2, time: 3, totalDist: 30 },
      sliders: [
        { key: 'natashaRate', label: "Natasha's Speed", min: 1, max: 15, step: 0.5, unit: 'km/h', desc: "Base rate of speed for Natasha" },
        { key: 'joeyDiff', label: "Joey's Extra Speed", min: 0.5, max: 8, step: 0.5, unit: 'km/h', desc: "How much faster Joey walks compared to Natasha" },
        { key: 'time', label: "Time Walked", min: 1, max: 8, step: 0.5, unit: 'h', desc: "Time elapsed before checking distance apart" }
      ],
      solver: (p) => {
        // Equation: t * r + t * (r + diff) = totalDist -> t * (2r + diff) = totalDist -> 2r + diff = totalDist/t -> 2r = totalDist/t - diff -> r = (totalDist/t - diff)/2
        // In the original, total distance is computed dynamically if we change rates, but wait, the question fixes total distance or solves for rate.
        // Let's fix total distance to 30, OR compute total distance dynamically when rates/time are changed:
        // Let's compute total distance dynamically! That way the sliders represent inputs, and we solve for what would be the total distance or rates.
        // Wait, it is better if sliders control rates and time, and we solve for the resulting distance! That's easiest for kids to visualize.
        // BUT the problem asks "How fast did each walk?" given distance = 30.
        // Let's allow sliders to control the constants of the problem:
        // - Natasha's speed r
        // - Joey's difference (diff)
        // - Time walked (t)
        // And the "solved" value will be the Total Distance! Wait, if they adjust Natasha's speed, the total distance changes.
        // Let's make the sliders represent the parameters of the story, and the step-by-step solves the algebraic problem.
        // Let's look at the parameters:
        // Let's make the sliders be:
        // 1. Natasha's actual rate (r) = 4 km/h (default)
        // 2. Joey's rate difference (diff) = 2 km/h (default)
        // 3. Time elapsed (t) = 3 hours (default)
        // The problem asks "How fast did each walk?" under the assumption that they ended up being a certain distance apart.
        // If we adjust r and diff and t, the resulting distance is D = t * r + t * (r + diff).
        // Let's explain this to the user! We can say:
        // "Suppose they walked for t hours, Joey walks diff km/h faster than Natasha, and they end up D km apart. Let's find their speeds."
        const r_natasha = p.natashaRate;
        const diff = p.joeyDiff;
        const t = p.time;
        const totalDist = t * r_natasha + t * (r_natasha + diff);
        const r_joey = r_natasha + diff;
        
        return {
          calculatedValues: { r_natasha, r_joey, t, totalDist, diff },
          table: [
            { name: "Natasha", rate: "r", time: `${t} h`, dist: `${t}(r)` },
            { name: "Joey", rate: "r + ${diff}", time: `${t} h`, dist: `${t}(r + ${diff})` }
          ],
          steps: [
            {
              title: "Identify Variables & Fill Table",
              desc: "Let Natasha's speed be <i>r</i>. Since Joey walks faster, his speed is <i>r + " + diff + "</i>. Fill out the table using Distance = Rate &times; Time.",
              eq: `\\text{Natasha Dist} = ${t}r, \\quad \\text{Joey Dist} = ${t}(r + ${diff})`
            },
            {
              title: "Set up the Equation",
              desc: "Since they start at the same point and walk in opposite directions, the total distance apart is the sum of their individual distances.",
              eq: `${t}r + ${t}(r + ${diff}) = ${totalDist.toFixed(1)}`
            },
            {
              title: "Simplify and Solve",
              desc: "Distribute and combine like terms to solve for <i>r</i> (Natasha's speed).",
              eq: `${t}r + ${t}r + ${(t * diff).toFixed(1)} = ${totalDist.toFixed(1)} \\\\ ${2*t}r + ${(t * diff).toFixed(1)} = ${totalDist.toFixed(1)} \\\\ ${2*t}r = ${(totalDist - t*diff).toFixed(1)} \\\\ r = ${r_natasha.toFixed(1)} \\text{ km/h}`
            },
            {
              title: "Find Joey's Speed",
              desc: "Add the speed difference to Natasha's speed to get Joey's speed.",
              eq: `\\text{Joey's Speed} = r + ${diff} = ${r_natasha.toFixed(1)} + ${diff} = ${r_joey.toFixed(1)} \\text{ km/h}`
            }
          ],
          finalAnswer: `Natasha: ${r_natasha.toFixed(1)} km/h | Joey: ${r_joey.toFixed(1)} km/h (Total Distance: ${totalDist.toFixed(1)} km)`,
          quiz: {
            prompt: `If Natasha walks at ${r_natasha.toFixed(1)} km/h and Joey walks ${diff.toFixed(1)} km/h faster for ${t.toFixed(1)} hours, what is their total distance apart?`,
            answer: totalDist,
            unit: 'km'
          }
        };
      },
      draw: (ctx, canvasTime, p, stateProgress) => {
        const t_max = p.time;
        const activeTime = Math.min(canvasTime, t_max);
        const progress = activeTime / t_max;
        
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerY = Math.round(h * 0.63);
        const centerX = w / 2;
        
        // Draw environment
        drawBackground(ctx, w, h, centerY);
        
        // Starting Point Signpost
        ctx.fillStyle = '#8b5a2b';
        ctx.fillRect(centerX - 4, centerY - 40, 8, 40);
        ctx.fillStyle = '#cd853f';
        ctx.beginPath();
        ctx.roundRect(centerX - 24, centerY - 55, 48, 18, 4);
        ctx.fill();
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("START", centerX, centerY - 43);
        
        const margin = 70;
        const natashaSpeed = p.natashaRate;
        const joeySpeed = p.natashaRate + p.joeyDiff;
        
        const natashaDist = natashaSpeed * activeTime;
        const joeyDist = joeySpeed * activeTime;
        const currentTotalDist = natashaDist + joeyDist;
        
        const maxFinalDist = Math.max(natashaSpeed * t_max, joeySpeed * t_max);
        const scale = maxFinalDist > 0 ? (centerX - margin) / maxFinalDist : 1;
        
        const posX_natasha = centerX - natashaDist * scale;
        const posX_joey = centerX + joeyDist * scale;
        
        // Draw path lines
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(posX_natasha, centerY);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(posX_joey, centerY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw Natasha (moves left)
        drawPerson(ctx, posX_natasha, centerY, 'Natasha', '#38bdf8', activeTime * natashaSpeed * 2, true);
        drawSpeedArrow(ctx, posX_natasha, centerY - 82, -35, `#38bdf8`, `${natashaSpeed.toFixed(1)} km/h`);
        
        // Draw Joey (moves right)
        drawPerson(ctx, posX_joey, centerY, 'Joey', '#c084fc', activeTime * joeySpeed * 2, false);
        drawSpeedArrow(ctx, posX_joey, centerY - 82, 35, `#c084fc`, `${joeySpeed.toFixed(1)} km/h`);
        
        // Draw Distance Rulers
        drawRuler(ctx, centerX, posX_natasha, centerY + 35, `${natashaDist.toFixed(1)} km`, '#38bdf8');
        drawRuler(ctx, centerX, posX_joey, centerY + 35, `${joeyDist.toFixed(1)} km`, '#c084fc');
        
        // Draw Total Distance Ruler below
        if (progress > 0.1) {
          drawRuler(ctx, posX_natasha, posX_joey, centerY + 65, `Total Distance Apart: ${currentTotalDist.toFixed(1)} km`, '#4ade80');
        }
      }
    },
    {
      id: 'ex-2',
      title: 'Example 8.8.2',
      isExample: true,
      category: 'roundtrip',
      text: 'Nick and Chloe left their campsite by canoe and paddled downstream at an average speed of <span class="highlight">12 km/h</span>. They turned around and paddled back upstream at an average rate of <span class="highlight">4 km/h</span>. The total trip took <span class="highlight">1 hour</span>. After how much time did the campers turn around downstream?',
      defaultParams: { downRate: 12, upRate: 4, totalTime: 1.0 },
      sliders: [
        { key: 'downRate', label: "Downstream Speed", min: 5, max: 25, step: 0.5, unit: 'km/h', desc: "Canoe speed while paddling with the river current" },
        { key: 'upRate', label: "Upstream Speed", min: 1, max: 12, step: 0.5, unit: 'km/h', desc: "Canoe speed while paddling against the current" },
        { key: 'totalTime', label: "Total Trip Time", min: 0.5, max: 5, step: 0.25, unit: 'h', desc: "The total duration of the canoe journey (outward + return)" }
      ],
      solver: (p) => {
        // Equation: r_down * t_down = r_up * t_up
        // Since t_up = totalTime - t_down -> r_down * t = r_up * (totalTime - t)
        // r_down * t = r_up * T - r_up * t -> (r_down + r_up) * t = r_up * T -> t = (r_up * T) / (r_down + r_up)
        const r1 = p.downRate;
        const r2 = p.upRate;
        const T = p.totalTime;
        
        const t_down = (r2 * T) / (r1 + r2);
        const t_up = T - t_down;
        const dist = r1 * t_down; // Downstream distance = upstream distance
        
        return {
          calculatedValues: { r1, r2, T, t_down, t_up, dist },
          table: [
            { name: "Downstream", rate: `${r1} km/h`, time: "t", dist: `${r1}(t)` },
            { name: "Upstream", rate: `${r2} km/h`, time: `${T} - t`, dist: `${r2}(${T} - t)` }
          ],
          steps: [
            {
              title: "Define Variables & Solve Concept",
              desc: "Let downstream travel time be <i>t</i>. Since the total trip is <i>" + T + " h</i>, the upstream travel time is <i>" + T + " - t</i>.",
              eq: `\\text{Downstream Dist} = ${r1}t, \\quad \\text{Upstream Dist} = ${r2}(${T} - t)`
            },
            {
              title: "Equate Distances",
              desc: "Since they paddle downstream and then return over the exact same path, the downstream distance must equal the upstream distance.",
              eq: `${r1}t = ${r2}(${T.toFixed(2)} - t)`
            },
            {
              title: "Solve for Time (t)",
              desc: "Distribute, collect the terms of <i>t</i>, and solve.",
              eq: `${r1}t = ${(r2*T).toFixed(2)} - ${r2}t \\\\ ${(r1 + r2)}t = ${(r2*T).toFixed(2)} \\\\ t = \\frac{${(r2*T).toFixed(2)}}{${r1 + r2}} = ${t_down.toFixed(2)} \\text{ hours}`
            },
            {
              title: "Convert to Minutes",
              desc: "Multiply fractions of an hour by 60 to get minutes.",
              eq: `${t_down.toFixed(2)} \\text{ hours} \\times 60 \\text{ min/h} = ${(t_down * 60).toFixed(0)} \\text{ minutes}`
            }
          ],
          finalAnswer: `Turnaround Time: ${t_down.toFixed(2)} hours (${(t_down * 60).toFixed(0)} mins) | Distance Traveled Outward: ${dist.toFixed(2)} km`,
          quiz: {
            prompt: `Nick and Chloe paddled downstream at ${r1.toFixed(1)} km/h and upstream at ${r2.toFixed(1)} km/h. If the trip took ${T.toFixed(1)} hours, what was the one-way distance to the turnaround point?`,
            answer: parseFloat(dist.toFixed(2)),
            unit: 'km'
          }
        };
      },
      draw: (ctx, canvasTime, p, stateProgress) => {
        const T = p.totalTime;
        const activeTime = Math.min(canvasTime, T);
        
        // Solve mathematically to get turnaround time
        const r1 = p.downRate;
        const r2 = p.upRate;
        const t_turn = (r2 * T) / (r1 + r2);
        
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerY = Math.round(h * 0.63);
        
        // Draw river theme
        drawWaterBackground(ctx, w, h, centerY);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        // Determine position along the track
        let posX;
        let isDownstream = true;
        let distTraveled = 0;
        
        if (activeTime <= t_turn) {
          // Downstream (going right)
          const p_down = activeTime / t_turn;
          posX = startX + p_down * travelWidth;
          distTraveled = r1 * activeTime;
          isDownstream = true;
        } else {
          // Upstream (returning left)
          const p_up = (activeTime - t_turn) / (T - t_turn);
          posX = endX - p_up * travelWidth;
          distTraveled = r1 * t_turn - r2 * (activeTime - t_turn);
          isDownstream = false;
        }
        
        const maxDist = r1 * t_turn;
        
        // Draw campsites
        drawCamp(ctx, startX - 25, centerY - 10, "Campsite", "#22c55e");
        drawCamp(ctx, endX + 15, centerY - 10, "Turn Point", "#eab308");
        
        // Draw canoe
        drawCanoe(ctx, posX, centerY - 10, isDownstream ? "Canoe (Down)" : "Canoe (Up)", '#06b6d4', activeTime * 15, isDownstream);
        
        // Display current phase status
        ctx.fillStyle = isDownstream ? '#22c55e' : '#f43f5e';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isDownstream ? "Paddling Downstream (FAST)" : "Paddling Upstream (SLOW)", w/2, 45);
        
        // Speed arrow
        if (isDownstream) {
          drawSpeedArrow(ctx, posX, centerY - 52, 30, '#06b6d4', `${r1.toFixed(1)} km/h`);
        } else {
          drawSpeedArrow(ctx, posX, centerY - 52, -30, '#ec4899', `${r2.toFixed(1)} km/h`);
        }
        
        // Distance markers
        if (activeTime <= t_turn) {
          drawRuler(ctx, startX, posX, centerY + 30, `Distance: ${distTraveled.toFixed(2)} km`, '#06b6d4');
        } else {
          drawRuler(ctx, startX, endX, centerY + 30, `One-way Distance: ${maxDist.toFixed(2)} km`, '#eab308');
          drawRuler(ctx, posX, endX, centerY + 60, `Returning: ${(r2 * (activeTime - t_turn)).toFixed(2)} km`, '#ec4899');
        }
      }
    },
    {
      id: 'ex-3',
      title: 'Example 8.8.3',
      isExample: true,
      category: 'catchup',
      text: 'Terry leaves his house riding a bike at <span class="highlight">20 km/h</span>. Sally leaves <span class="highlight">6 hours</span> later on a scooter to catch up with him travelling at <span class="highlight">80 km/h</span>. How long will it take her to catch up with him?',
      defaultParams: { terryRate: 20, sallyRate: 80, delay: 6 },
      sliders: [
        { key: 'terryRate', label: "Terry's Speed (Bike)", min: 5, max: 40, step: 1, unit: 'km/h', desc: "How fast Terry rides his bicycle" },
        { key: 'sallyRate', label: "Sally's Speed (Scooter)", min: 40, max: 120, step: 2, unit: 'km/h', desc: "How fast Sally rides her scooter to catch up" },
        { key: 'delay', label: "Sally's Delay", min: 1, max: 10, step: 0.5, unit: 'h', desc: "The head start time Terry has before Sally leaves" }
      ],
      solver: (p) => {
        // Equation: r_terry * t = r_sally * (t - delay)
        // r_terry * t = r_sally * t - r_sally * delay -> (r_sally - r_terry) * t = r_sally * delay -> t = (r_sally * delay) / (r_sally - r_terry)
        // Sally's time to catch up is t_sally = t - delay = (r_terry * delay) / (r_sally - r_terry)
        const r1 = p.terryRate;
        const r2 = p.sallyRate;
        const d = p.delay;
        
        // Prevent division by zero or negative time
        const effective_r2 = Math.max(r2, r1 + 5);
        const t_terry = (effective_r2 * d) / (effective_r2 - r1);
        const t_sally = t_terry - d;
        const catchupDist = r1 * t_terry;
        
        return {
          calculatedValues: { r1, r2: effective_r2, d, t_terry, t_sally, catchupDist },
          table: [
            { name: "Terry (Bike)", rate: `${r1} km/h`, time: "t", dist: `${r1}(t)` },
            { name: "Sally (Scooter)", rate: `${effective_r2} km/h`, time: `t - ${d}`, dist: `${effective_r2}(t - ${d})` }
          ],
          steps: [
            {
              title: "Define Variable and Times",
              desc: "Let Terry's travel time be <i>t</i>. Since Sally starts <i>" + d + " hours</i> later, her travel time is <i>t - " + d + "</i>.",
              eq: `\\text{Terry's time} = t, \\quad \\text{Sally's time} = t - ${d}`
            },
            {
              title: "Set up Distance Equation",
              desc: "When Sally catches up to Terry, they will have travelled the exact same distance from the house.",
              eq: `${r1}t = ${effective_r2}(t - ${d})`
            },
            {
              title: "Solve for Terry's Time (t)",
              desc: "Distribute, rearrange variables, and isolate <i>t</i>.",
              eq: `${r1}t = ${effective_r2}t - ${effective_r2 * d} \\\\ ${(effective_r2 - r1)}t = ${effective_r2 * d} \\\\ t = \\frac{${effective_r2 * d}}{${effective_r2 - r1}} = ${t_terry.toFixed(2)} \\text{ hours}`
            },
            {
              title: "Calculate Sally's Catch-up Time",
              desc: "Subtract the delay of <i>" + d + " hours</i> from Terry's total travel time.",
              eq: `\\text{Sally's time} = t - ${d} = ${t_terry.toFixed(2)} - ${d} = ${t_sally.toFixed(2)} \\text{ hours}`
            }
          ],
          finalAnswer: `Sally's Catch-up Time: ${t_sally.toFixed(2)} hours | Terry's Total Time: ${t_terry.toFixed(2)} hours | Meeting Distance: ${catchupDist.toFixed(1)} km`,
          quiz: {
            prompt: `If Terry travels at ${r1} km/h, and Sally starts ${d} hours later at ${effective_r2} km/h, how many kilometres will they travel before they meet?`,
            answer: parseFloat(catchupDist.toFixed(1)),
            unit: 'km'
          }
        };
      },
      draw: (ctx, canvasTime, p, stateProgress) => {
        const r1 = p.terryRate;
        const r2 = Math.max(p.sallyRate, r1 + 5);
        const d = p.delay;
        const t_meet = (r2 * d) / (r2 - r1); // Terry's time at catch up
        
        // Define animation timeline to go up to t_meet * 1.1 (slightly past meet)
        const t_max = t_meet * 1.15;
        const activeTime = Math.min(canvasTime, t_max);
        
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const lane1Y = Math.round(h * 0.46);
        const lane2Y = Math.round(h * 0.72);
        
        // Draw background
        drawBackground2Lanes(ctx, w, h, lane1Y, lane2Y);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        // Scale mapping
        const terryDistMax = r1 * t_max;
        const sallyDistMax = r2 * (t_max - d);
        const maxDist = Math.max(terryDistMax, sallyDistMax);
        const scale = maxDist > 0 ? travelWidth / maxDist : 1;
        
        // Calculate positions
        const terryDist = r1 * activeTime;
        const posX_terry = startX + terryDist * scale;
        
        let sallyDist = 0;
        let posX_sally = startX;
        let sallyActive = false;
        
        if (activeTime > d) {
          sallyActive = true;
          sallyDist = r2 * (activeTime - d);
          posX_sally = startX + sallyDist * scale;
        }
        
        // Draw track vertical connection lines for reference
        if (activeTime > 0.1) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]);
          ctx.beginPath();
          ctx.moveTo(posX_terry, lane1Y);
          ctx.lineTo(posX_terry, lane2Y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        
        // Draw Terry (Lane 1, bike)
        drawPersonOnVehicle(ctx, posX_terry, lane1Y, "Terry (Bike)", '#a855f7', activeTime * r1 * 2, 'bike');
        drawSpeedArrow(ctx, posX_terry, lane1Y - 65, 30, '#a855f7', `${r1.toFixed(0)} km/h`);
        
        // Draw Sally (Lane 2, scooter)
        if (sallyActive) {
          drawPersonOnVehicle(ctx, posX_sally, lane2Y, "Sally (Scooter)", '#eab308', (activeTime - d) * r2 * 2.5, 'scooter');
          drawSpeedArrow(ctx, posX_sally, lane2Y - 65, 45, '#eab308', `${r2.toFixed(0)} km/h`);
        } else {
          // Idle at home
          drawPersonOnVehicle(ctx, startX, lane2Y, "Sally (Waiting)", '#64748b', 0, 'scooter');
          
          // Waiting message bubbles
          ctx.fillStyle = '#64748b';
          ctx.font = '9px var(--font-mono)';
          ctx.fillText("WAITING", startX, lane2Y - 40);
        }
        
        // Draw meeting flag
        if (activeTime >= t_meet) {
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.arc(startX + t_meet * scale, lane1Y - 10, 8, 0, Math.PI * 2);
          ctx.arc(startX + t_meet * scale, lane2Y - 10, 8, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(startX + t_meet * scale, lane1Y - 10);
          ctx.lineTo(startX + t_meet * scale, lane2Y - 10);
          ctx.stroke();
          
          // Meet! tag
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.roundRect(startX + t_meet * scale - 25, (lane1Y+lane2Y)/2 - 12, 50, 24, 6);
          ctx.fill();
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText("MEET!", startX + t_meet * scale, (lane1Y+lane2Y)/2 + 4);
        }
        
        // Distance rulers
        drawRuler(ctx, startX, posX_terry, lane1Y + 30, `${terryDist.toFixed(1)} km`, '#a855f7');
        if (sallyActive) {
          drawRuler(ctx, startX, posX_sally, lane2Y + 30, `${sallyDist.toFixed(1)} km`, '#eab308');
        }
      }
    },
    {
      id: 'ex-4',
      title: 'Example 8.8.4',
      isExample: true,
      category: 'split',
      text: 'On a <span class="highlight">130-kilometre</span> trip, a car travelled at an average speed of <span class="highlight">55 km/h</span> and then reduced its speed to <span class="highlight">40 km/h</span> for the remainder of the trip. The trip took <span class="highlight">2.5 h</span>. For how long did the car travel 40 km/h?',
      defaultParams: { totalDist: 130, speed1: 55, speed2: 40, totalTime: 2.5 },
      sliders: [
        { key: 'totalDist', label: "Total Distance", min: 50, max: 250, step: 5, unit: 'km', desc: "The total distance of the split trip" },
        { key: 'speed1', label: "Initial Speed (Fast)", min: 45, max: 110, step: 2, unit: 'km/h', desc: "Car's speed during the first portion of the trip" },
        { key: 'speed2', label: "Reduced Speed (Slow)", min: 20, max: 70, step: 2, unit: 'km/h', desc: "Car's speed during the remaining portion of the trip" },
        { key: 'totalTime', label: "Total Trip Time", min: 1.5, max: 6, step: 0.25, unit: 'h', desc: "The total duration of the trip" }
      ],
      solver: (p) => {
        // Equation: r1 * t + r2 * (totalTime - t) = totalDist
        // r1 * t + r2 * T - r2 * t = D -> (r1 - r2) * t = D - r2 * T -> t_1 = (D - r2 * T) / (r1 - r2)
        // t_2 (time at reduced speed) = T - t_1
        const r1 = p.speed1;
        const r2 = p.speed2;
        const D = p.totalDist;
        const T = p.totalTime;
        
        // Check for edge cases where denominator is zero, or numerator is impossible
        // Make sure speed1 is always > speed2
        const eff_r1 = Math.max(r1, r2 + 5);
        // Calculate t_1 and clamp it between 0 and T
        let t1 = (D - r2 * T) / (eff_r1 - r2);
        if (t1 < 0) t1 = 0;
        if (t1 > T) t1 = T;
        const t2 = T - t1;
        
        const dist1 = eff_r1 * t1;
        const dist2 = r2 * t2;
        const calculated_total = dist1 + dist2;
        
        return {
          calculatedValues: { r1: eff_r1, r2, D, T, t1, t2, dist1, dist2, calculated_total },
          table: [
            { name: "First Stage (Fast)", rate: `${eff_r1} km/h`, time: "t", dist: `${eff_r1}(t)` },
            { name: "Second Stage (Slow)", rate: `${r2} km/h`, time: `${T} - t`, dist: `${r2}(${T} - t)` }
          ],
          steps: [
            {
              title: "Define Stage Variables",
              desc: "Let time spent in the first stage (at <i>" + eff_r1 + " km/h</i>) be <i>t</i>. Since the total trip is <i>" + T + " h</i>, the second stage time is <i>" + T + " - t</i>.",
              eq: `\\text{Stage 1 Dist} = ${eff_r1}t, \\quad \\text{Stage 2 Dist} = ${r2}(${T} - t)`
            },
            {
              title: "Create the Total Distance Equation",
              desc: "The sum of the distances traveled in both stages must equal the total trip distance of <i>" + D + " km</i>.",
              eq: `${eff_r1}t + ${r2}(${T.toFixed(2)} - t) = ${D}`
            },
            {
              title: "Solve for Stage 1 Time (t)",
              desc: "Distribute, combine like terms, and isolate <i>t</i>.",
              eq: `${eff_r1}t + ${(r2 * T).toFixed(1)} - ${r2}t = ${D} \\\\ ${(eff_r1 - r2)}t + ${(r2 * T).toFixed(1)} = ${D} \\\\ ${(eff_r1 - r2)}t = ${(D - r2*T).toFixed(1)} \\\\ t = \\frac{${(D - r2*T).toFixed(1)}}{${eff_r1 - r2}} = ${t1.toFixed(2)} \\text{ hours}`
            },
            {
              title: "Calculate Stage 2 Time (at 40 km/h)",
              desc: "Subtract Stage 1 time from total time.",
              eq: `\\text{Stage 2 Time} = T - t = ${T} - ${t1.toFixed(2)} = ${t2.toFixed(2)} \\text{ hours}`
            }
          ],
          finalAnswer: `Time at ${r2} km/h: ${t2.toFixed(2)} hours (${(t2 * 60).toFixed(0)} mins) | Time at ${eff_r1} km/h: ${t1.toFixed(2)} hours`,
          quiz: {
            prompt: `If the car travels for ${t1.toFixed(2)} hours at ${eff_r1} km/h and ${t2.toFixed(2)} hours at ${r2} km/h, what is the total distance traveled?`,
            answer: parseFloat(calculated_total.toFixed(1)),
            unit: 'km'
          }
        };
      },
      draw: (ctx, canvasTime, p, stateProgress) => {
        const r1 = p.speed1;
        const r2 = p.speed2;
        const D = p.totalDist;
        const T = p.totalTime;
        
        const eff_r1 = Math.max(r1, r2 + 5);
        let t1 = (D - r2 * T) / (eff_r1 - r2);
        if (t1 < 0) t1 = 0;
        if (t1 > T) t1 = T;
        const t2 = T - t1;
        
        const activeTime = Math.min(canvasTime, T);
        
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerY = Math.round(h * 0.63);
        
        // Draw background
        drawBackground(ctx, w, h, centerY);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        // Turnpoint x coordinate
        const splitRatio = t1 / T;
        const splitX = startX + splitRatio * travelWidth;
        
        // Current position
        let posX;
        let isStage1 = true;
        let currentDist = 0;
        
        if (activeTime <= t1) {
          // First stage
          const ratio = t1 > 0 ? activeTime / t1 : 1;
          posX = startX + ratio * (splitX - startX);
          currentDist = eff_r1 * activeTime;
          isStage1 = true;
        } else {
          // Second stage
          const ratio = t2 > 0 ? (activeTime - t1) / t2 : 1;
          posX = splitX + ratio * (endX - splitX);
          currentDist = eff_r1 * t1 + r2 * (activeTime - t1);
          isStage1 = false;
        }
        
        // Speed limit sign at split
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(splitX - 1.5, centerY - 50, 3, 50);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(splitX - 16, centerY - 55, 32, 20, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("SLOW", splitX, centerY - 45);
        ctx.fillText("AHEAD", splitX, centerY - 37);
        
        // Draw car
        drawCar(ctx, posX, centerY - 12, 'Car', isStage1 ? '#a855f7' : '#ec4899', activeTime * 35);
        
        // Speed arrow
        if (isStage1) {
          drawSpeedArrow(ctx, posX, centerY - 50, 32, '#a855f7', `${eff_r1} km/h`);
        } else {
          drawSpeedArrow(ctx, posX, centerY - 50, 22, '#ec4899', `${r2} km/h`);
        }
        
        // Status text
        ctx.fillStyle = isStage1 ? '#a855f7' : '#ec4899';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isStage1 ? "Stage 1: Travelling Fast" : "Stage 2: Speed Reduced", w / 2, 45);
        
        // Draw distance rulers
        drawRuler(ctx, startX, splitX, centerY + 30, `Stage 1: ${(eff_r1 * t1).toFixed(1)} km`, '#a855f7');
        drawRuler(ctx, splitX, endX, centerY + 30, `Stage 2: ${(r2 * t2).toFixed(1)} km`, '#ec4899');
        drawRuler(ctx, startX, endX, centerY + 65, `Total Trip: ${D.toFixed(0)} km`, '#4ade80');
      }
    },
    // === WORK / TIME EXAMPLES ===
    {
      id: 'ex-5',
    title: 'Example 9.10.1',
    isExample: true,
    category: 'worktime',
    timeUnit: 'h',
    text: 'Karl can clean a room in <span class="highlight">3 hours</span>. If his little sister Kyra helps, they can clean it in <span class="highlight">2.4 hours</span>. How long would it take Kyra to do the job alone?',
    defaultParams: { timeA: 3, togetherTime: 2.4 },
    sliders: [
      { key: 'timeA', label: "Karl's Solo Time", min: 1, max: 10, step: 0.5, unit: 'h', desc: "Hours for Karl to clean the room alone" },
      { key: 'togetherTime', label: "Together Time", min: 0.5, max: 5, step: 0.1, unit: 'h', desc: "Hours when Karl and Kyra work together" }
    ],
    solver: (p) => {
      // Job = 1 room. Rates are in room/h. Variable t = Kyra's solo time.
      const D = 1; // 1 room = the whole job
      const tA = p.timeA, tTog = p.togetherTime;
      const rA = D / tA;          // Karl's rate = 1/3 room/h
      const rTog = D / tTog;      // Combined rate = 1/2.4 room/h
      const tB = 1 / (rTog - rA); // Kyra's solo time (variable we solve for)
      const rB = D / tB;          // Kyra's rate in room/h (for display/animation only)
      // Distances covered within the together-time window (each works the whole 2.4 h):
      const distA = rA * tTog;    // Karl's share of the job while together
      const distB = rB * tTog;    // Kyra's share of the job while together
      return {
        calculatedValues: { tA, tTog, tB, rA, rB, rTog, D, distA, distB, maxTime: tTog },
        table: [
          { name: 'Karl',     rate: `${fracStr(rA)} room/h`,          time: `${tTog} h`, dist: `${fracStr(distA)} room` },
          { name: 'Kyra',     rate: `1/t room/h`,                     time: `${tTog} h`, dist: `${tTog}/t room` },
          { name: 'Together', rate: `${fracStr(rTog)} room/h`,        time: `${tTog} h`, dist: `1 room` }
        ],
        steps: [
          { title: 'Set up the rate table (1 room = the whole job)',
            desc: `Let <i>t</i> = Kyra's solo time in hours. Rate = 1 ÷ time, so Karl cleans at 1/${tA} room/h, Kyra at 1/t room/h, and together at 1/${tTog} room/h.`,
            eq: `\\text{Karl: } \\frac{1}{${tA}} \\text{ room/h} \\quad \\text{Kyra: } \\frac{1}{t} \\text{ room/h} \\quad \\text{Together: } \\frac{1}{${tTog}} \\text{ room/h}` },
          { title: 'Rates add when working together',
            desc: 'When two people work together, their rates add up to the combined rate.',
            eq: `\\frac{1}{${tA}} + \\frac{1}{t} = \\frac{1}{${tTog}}` },
          { title: 'Solve for t (Kyra\'s solo time)',
            desc: `Isolate 1/t by subtracting Karl's rate from the combined rate, then take the reciprocal.`,
            eq: `\\frac{1}{t} = \\frac{1}{${tTog}} - \\frac{1}{${tA}} = ${(rTog).toFixed(4)} - ${(rA).toFixed(4)} = ${(rTog - rA).toFixed(4)} \\\\ t = \\frac{1}{${(rTog - rA).toFixed(4)}} = ${tB.toFixed(2)} \\text{ hours}` },
          { title: 'Why together is faster',
            desc: `Kyra alone would take ${tB.toFixed(2)} h, Karl alone ${tA} h — but together they finish in only ${tTog} h, because their combined effort closes the gap from both ends.`,
            eq: `\\text{Together } (${tTog} \\text{ h}) < \\text{ Kyra alone } (${tB.toFixed(2)} \\text{ h}) \\text{ and Karl alone } (${tA} \\text{ h})` }
        ],
        finalAnswer: `Kyra's solo time: ${tB.toFixed(2)} hours`,
        quiz: { prompt: `Karl cleans at 1/${tA} room/h and together they clean at 1/${tTog} room/h. How many hours would Kyra take alone (solve for t)?`, answer: parseFloat(tB.toFixed(2)), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      // 1 room = the whole job. Two people walk TOWARD each other; when they meet
      // at the middle, the room (= job) is fully cleaned.
      const D = 1;
      const tA = p.timeA, tTog = p.togetherTime;
      const rA = D / tA, rTog = D / tTog, rB = Math.max(0.001, rTog - rA);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'room',
        doneLabel: 'ROOM CLEAN!',
        rateUnit: 'room/h',
        people: [
          { name: 'Karl', rate: rA, color: '#38bdf8', side: 'left' },
          { name: 'Kyra', rate: rB, color: '#f472b6', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 room = the job  •  together they close the gap from both ends  •  finish in ${tTog} h`
      });
    }
  },
  {
    id: 'ex-6',
    title: 'Example 9.10.2',
    isExample: true,
    category: 'worktime',
    timeUnit: 'h',
    text: 'Doug takes <span class="highlight">twice as long</span> as Becky to complete a project. Together they can complete the project in <span class="highlight">10 hours</span>. How long will it take each of them to complete the project alone?',
    defaultParams: { beckyTime: 15 },
    sliders: [
      { key: 'beckyTime', label: "Becky's Solo Time", min: 5, max: 30, step: 1, unit: 'h', desc: "Hours for Becky alone (Doug always takes double this)" }
    ],
    solver: (p) => {
      // Job = 1 project. Rates in project/h. Variable t = Becky's solo time.
      const D = 1;
      const tBecky = p.beckyTime, tDoug = 2 * tBecky;
      const rBecky = D / tBecky, rDoug = D / tDoug;       // 1/t and 1/(2t)
      const rTog = rBecky + rDoug;                          // = 3/(2t)
      const tTog = D / rTog;                                // = 2t/3
      const distBecky = rBecky * tTog, distDoug = rDoug * tTog;
      return {
        calculatedValues: { tBecky, tDoug, tTog, rBecky, rDoug, rTog, D, distBecky, distDoug, maxTime: tTog },
        table: [
          { name: 'Becky',     rate: '1/t project/h',      time: 't h', dist: '1 project' },
          { name: 'Doug',      rate: '1/(2t) project/h',   time: '2t h', dist: '1 project' },
          { name: 'Together',  rate: '3/(2t) project/h',   time: '10 h', dist: '1 project' }
        ],
        steps: [
          { title: 'Set up the rate table (1 project = the job)',
            desc: 'Let <i>t</i> = Becky\'s solo time in hours. Doug takes twice as long, so his time is <i>2t</i>. Rate = 1 ÷ time.',
            eq: `\\text{Becky: } \\frac{1}{t} \\text{ project/h} \\quad \\text{Doug: } \\frac{1}{2t} \\text{ project/h}` },
          { title: 'Rates add when working together',
            desc: 'Working together, their combined rate equals the sum of their individual rates, and together they finish 1 project in 10 h (rate = 1/10).',
            eq: `\\frac{1}{t} + \\frac{1}{2t} = \\frac{1}{10}` },
          { title: 'Solve for t',
            desc: 'Combine the fractions on the left (common denominator 2t), then cross-multiply.',
            eq: `\\frac{2}{2t} + \\frac{1}{2t} = \\frac{1}{10} \\\\ \\frac{3}{2t} = \\frac{1}{10} \\\\ 2t = 30 \\\\ t = 15 \\text{ h (Becky)}` },
          { title: 'Find Doug\'s time',
            desc: 'Doug takes 2t, so multiply Becky\'s time by 2.',
            eq: `\\text{Doug} = 2t = 2 \\times 15 = 30 \\text{ h}` }
        ],
        finalAnswer: `Becky: ${tBecky} hours | Doug: ${tDoug} hours`,
        quiz: { prompt: `Becky's rate is 1/t and Doug's is 1/(2t). If together they finish in 10 h (rate 1/10), what is t (Becky's solo time)?`, answer: parseFloat(tBecky), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tBecky = p.beckyTime, tDoug = 2 * tBecky;
      const rBecky = D / tBecky, rDoug = D / tDoug;
      const tTog = D / (rBecky + rDoug);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'project',
        doneLabel: 'PROJECT DONE!',
        rateUnit: 'project/h',
        people: [
          { name: 'Becky', rate: rBecky, color: '#a78bfa', side: 'left' },
          { name: 'Doug',  rate: rDoug,  color: '#fb923c', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 project = the job  •  Doug takes 2× as long  •  together: ${tTog.toFixed(2)} h`
      });
    }
  },
  {
    id: 'ex-7',
    title: 'Example 9.10.3',
    isExample: true,
    category: 'worktime',
    timeUnit: 'days',
    text: 'Joey can build a large shed in <span class="highlight">10 days less</span> than Cosmo can. If they built it together, it would take them <span class="highlight">12 days</span>. How long would it take each of them working alone?',
    defaultParams: { cosmoTime: 30 },
    sliders: [
      { key: 'cosmoTime', label: "Cosmo's Solo Time", min: 12, max: 50, step: 1, unit: 'days', desc: "Days for Cosmo alone (Joey is always 10 days faster)" }
    ],
    solver: (p) => {
      // Job = 1 shed. Rates in shed/day. Variable t = Cosmo's solo time; Joey = t − 10.
      const D = 1;
      const tCosmo = p.cosmoTime, tJoey = Math.max(1, tCosmo - 10);
      const rCosmo = D / tCosmo, rJoey = D / tJoey;      // 1/t and 1/(t-10)
      const rTog = rCosmo + rJoey;                         // = 1/12
      const tTog = D / rTog;                               // 12 (matches given)
      const distCosmo = rCosmo * tTog, distJoey = rJoey * tTog;
      return {
        calculatedValues: { tCosmo, tJoey, tTog, rCosmo, rJoey, rTog, D, distCosmo, distJoey, maxTime: tTog },
        table: [
          { name: 'Cosmo',    rate: '1/t shed/day',       time: 't days',     dist: '1 shed' },
          { name: 'Joey',     rate: '1/(t-10) shed/day',  time: 't-10 days',  dist: '1 shed' },
          { name: 'Together', rate: '1/12 shed/day',      time: '12 days',    dist: '1 shed' }
        ],
        steps: [
          { title: 'Set up the rate table (1 shed = the job)',
            desc: 'Let <i>t</i> = Cosmo\'s solo time in days. Joey takes 10 days less, so his time is <i>t − 10</i>. Rate = 1 ÷ time.',
            eq: `\\text{Cosmo: } \\frac{1}{t} \\text{ shed/day} \\quad \\text{Joey: } \\frac{1}{t-10} \\text{ shed/day}` },
          { title: 'Rates add when working together',
            desc: 'Their combined rate is the sum, and together they build 1 shed in 12 days (rate = 1/12).',
            eq: `\\frac{1}{t} + \\frac{1}{t-10} = \\frac{1}{12}` },
          { title: 'Solve for t (clear denominators)',
            desc: 'Multiply through by the common denominator 12t(t−10), then expand and solve the quadratic.',
            eq: `12(t-10) + 12t = t(t-10) \\\\ 24t - 120 = t^2 - 10t \\\\ t^2 - 34t + 120 = 0 \\\\ (t-30)(t-4)=0` },
          { title: 'Check and choose the valid root',
            desc: 't = 4 would make Joey\'s time t − 10 negative (impossible), so discard it.',
            eq: `t = 30 \\text{ days (Cosmo)} \\quad \\Rightarrow \\quad t - 10 = 20 \\text{ days (Joey)}` }
        ],
        finalAnswer: `Cosmo: ${tCosmo} days | Joey: ${tJoey} days`,
        quiz: { prompt: `Cosmo's rate is 1/t and Joey's is 1/(t-10); together they build 1 shed in 12 days. What is t (Cosmo's solo time)?`, answer: tCosmo, unit: 'days' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tCosmo = p.cosmoTime, tJoey = Math.max(1, tCosmo - 10);
      const rCosmo = D / tCosmo, rJoey = D / tJoey;
      const tTog = D / (rCosmo + rJoey);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'shed',
        doneLabel: 'SHED BUILT!',
        rateUnit: 'shed/day',
        people: [
          { name: 'Cosmo', rate: rCosmo, color: '#c084fc', side: 'left' },
          { name: 'Joey',  rate: rJoey,  color: '#22d3ee', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 shed = the job  •  Joey is 10 days faster  •  together: ${tTog.toFixed(2)} days`
      });
    }
  },
  {
    id: 'ex-8',
    title: 'Example 9.10.4',
    isExample: true,
    category: 'worktime',
    timeUnit: 'h',
    text: 'Clark can complete a job in <span class="highlight">one hour less</span> than his apprentice. Together, they do the job in <span class="highlight">1 hour and 12 minutes</span> (1.2 h). How long would it take each of them working alone?',
    defaultParams: { apprenticeTime: 3 },
    sliders: [
      { key: 'apprenticeTime', label: "Apprentice's Solo Time", min: 1.5, max: 8, step: 0.5, unit: 'h', desc: "Hours for the apprentice alone (Clark is always 1 h faster)" }
    ],
    solver: (p) => {
      // Job = 1 job. Rates in job/h. Variable t = apprentice's solo time; Clark = t − 1.
      const D = 1;
      const tApp = p.apprenticeTime, tClark = Math.max(0.5, tApp - 1);
      const rApp = D / tApp, rClark = D / tClark;        // 1/t and 1/(t-1)
      const rTog = rApp + rClark;                          // = 1/1.2 = 5/6
      const tTog = D / rTog;                               // 1.2 h
      const distApp = rApp * tTog, distClark = rClark * tTog;
      return {
        calculatedValues: { tApp, tClark, tTog, rApp, rClark, rTog, D, distApp, distClark, maxTime: tTog },
        table: [
          { name: 'Apprentice', rate: '1/t job/h',      time: 't h',     dist: '1 job' },
          { name: 'Clark',      rate: '1/(t-1) job/h',  time: 't-1 h',   dist: '1 job' },
          { name: 'Together',   rate: '5/6 job/h',      time: '1.2 h',   dist: '1 job' }
        ],
        steps: [
          { title: 'Set up the rate table (1 job total)',
            desc: 'Let <i>t</i> = apprentice\'s solo time in hours. Clark takes 1 hour less, so his time is <i>t − 1</i>. Rate = 1 ÷ time.',
            eq: `\\text{Apprentice: } \\frac{1}{t} \\text{ job/h} \\quad \\text{Clark: } \\frac{1}{t-1} \\text{ job/h}` },
          { title: 'Rates add when working together',
            desc: 'Together they finish 1 job in 1.2 h, so the combined rate is 1/1.2 = 5/6 job/h.',
            eq: `\\frac{1}{t} + \\frac{1}{t-1} = \\frac{1}{1.2} = \\frac{5}{6}` },
          { title: 'Solve for t (clear denominators)',
            desc: 'Multiply through by 6t(t−1), expand, and solve the quadratic.',
            eq: `6(t-1) + 6t = 5t(t-1) \\\\ 12t - 6 = 5t^2 - 5t \\\\ 5t^2 - 17t + 6 = 0 \\\\ (5t-2)(t-3)=0` },
          { title: 'Choose the valid root',
            desc: 't = 2/5 would make Clark\'s time t − 1 negative (impossible), so discard it.',
            eq: `t = 3 \\text{ h (Apprentice)} \\quad \\Rightarrow \\quad t - 1 = 2 \\text{ h (Clark)}` }
        ],
        finalAnswer: `Clark: ${tClark.toFixed(1)} hours | Apprentice: ${tApp.toFixed(1)} hours`,
        quiz: { prompt: `Apprentice's rate is 1/t and Clark's is 1/(t-1); together they finish 1 job in 1.2 h. What is t (apprentice's solo time)?`, answer: parseFloat(tApp), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tApp = p.apprenticeTime, tClark = Math.max(0.5, tApp - 1);
      const rApp = D / tApp, rClark = D / tClark;
      const tTog = D / (rApp + rClark);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'job',
        doneLabel: 'JOB DONE!',
        rateUnit: 'job/h',
        people: [
          { name: 'Clark',      rate: rClark, color: '#eab308', side: 'left' },
          { name: 'Apprentice', rate: rApp,   color: '#94a3b8', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 job = the task  •  Clark is 1 h faster  •  together: ${tTog.toFixed(2)} h`
      });
    }
  },
  {
    id: 'ex-9',
    title: 'Example 9.10.5',
    isExample: true,
    category: 'worktime',
    timeUnit: 'min',
    text: 'A sink can be filled by a pipe in <span class="highlight">5 minutes</span>, but it takes <span class="highlight">7 minutes</span> to drain a full sink. If both the pipe and the drain are open, how long will it take to fill the sink?',
    defaultParams: { fillTime: 5, drainTime: 7 },
    sliders: [
      { key: 'fillTime', label: "Fill Time (pipe)", min: 2, max: 15, step: 0.5, unit: 'min', desc: "Minutes for the pipe alone to fill the sink" },
      { key: 'drainTime', label: "Drain Time", min: 3, max: 20, step: 0.5, unit: 'min', desc: "Minutes for the drain alone to empty the sink" }
    ],
    solver: (p) => {
      // Job = 1 sink (1 full sink). Rates in sink/min. Variable t = time to fill.
      // Clamp fill time so the faucet always outpaces the drain (keeps the sink fillable).
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;      // 1/5 and 1/7 sink/min
      const netRate = rFill - rDrain;                     // 1/5 - 1/7 = 2/35
      const tNet = netRate > 0 ? D / netRate : Infinity;  // 35/2 = 17.5 min
      return {
        calculatedValues: { tFill, tDrain, tNet, rFill, rDrain, netRate, D, maxTime: tNet },
        table: [
          { name: 'Faucet (in)',  rate: '1/5 sink/min',   time: 't min', dist: '(1/5)t sink' },
          { name: 'Drain (out)',  rate: '−1/7 sink/min',  time: 't min', dist: '−(1/7)t sink' },
          { name: 'Net',          rate: '2/35 sink/min',  time: 't min', dist: '1 sink' }
        ],
        steps: [
          { title: 'Set up the rate table (1 sink = full)',
            desc: `The faucet fills 1 sink in ${tFill} min (rate 1/${tFill}); the drain empties 1 sink in ${tDrain} min (rate 1/${tDrain}).`,
            eq: `\\text{Faucet: } \\frac{1}{${tFill}} \\text{ sink/min} \\quad \\text{Drain: } \\frac{1}{${tDrain}} \\text{ sink/min}` },
          { title: 'Net rate = fill − drain',
            desc: 'With both open, the faucet adds water while the drain removes it, so the net fill rate is the difference.',
            eq: `\\frac{1}{${tFill}} - \\frac{1}{${tDrain}} = \\frac{${tDrain}-${tFill}}{${(tFill*tDrain)|0}} = \\frac{${tDrain-tFill}}{${(tFill*tDrain)|0}} = \\frac{2}{35} \\text{ sink/min}` },
          { title: 'Solve for t (time to fill 1 sink)',
            desc: 'Time = 1 sink ÷ net rate.',
            eq: `t = \\frac{1}{\\frac{2}{35}} = \\frac{35}{2} = ${tNet.toFixed(2)} \\text{ minutes}` }
        ],
        finalAnswer: `Time to fill sink: ${tNet.toFixed(2)} minutes`,
        quiz: { prompt: `The faucet fills at 1/${tFill} sink/min and the drain empties at 1/${tDrain} sink/min. How long to fill 1 sink (solve for t)?`, answer: parseFloat(tNet.toFixed(2)), unit: 'min' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;
      const netRate = rFill - rDrain;
      const tNet = netRate > 0 ? D / netRate : D * 10;
      const activeTime = Math.min(canvasTime, tNet * 1.2);
      const fillLevel = Math.min(1, (netRate * activeTime) / D);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const isDark = state.theme === 'dark';
      ctx.fillStyle = isDark ? '#0b1329' : '#f0f9ff'; ctx.fillRect(0, 0, w, h);
      drawTankVisualization(ctx, w, h, fillLevel, rFill, rDrain, 'min');
      ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`Net rate: ${fracStr(netRate)} sink/min  •  time to fill: ${tNet.toFixed(2)} min`, w / 2, 22);
      ctx.fillStyle = '#22d3ee'; ctx.font = '10px var(--font-mono)'; ctx.textAlign = 'left';
      ctx.fillText(`t = ${activeTime.toFixed(2)} min  |  filled: ${(fillLevel * 100).toFixed(1)}%`, 10, h - 8);
    }
  },
  // === WORK / TIME PRACTICE QUESTIONS ===
  {
    id: 'q-23',
    title: 'Question 23',
    isExample: false,
    category: 'worktime',
    timeUnit: 'h',
    text: "Bill's father can paint a room in <span class=\"highlight\">2 hours less</span> than it would take Bill to paint it. Working together, they can complete the job in <span class=\"highlight\">2 hours and 24 minutes</span>. How much time would each require working alone?",
    defaultParams: { billTime: 6 },
    sliders: [
      { key: 'billTime', label: "Bill's Solo Time", min: 3, max: 12, step: 0.5, unit: 'h', desc: "Hours for Bill alone (father is always 2 h faster)" }
    ],
    solver: (p) => {
      // Job = 1 room. Rates in room/h. Variable t = Bill's solo time; Father = t − 2.
      const D = 1;
      const tBill = p.billTime, tFather = Math.max(0.5, tBill - 2);
      const rBill = D / tBill, rFather = D / tFather;    // 1/t and 1/(t-2)
      const rTog = rBill + rFather;                        // = 1/2.4 = 5/12
      const tTog = D / rTog;                               // 2.4 h
      const distBill = rBill * tTog, distFather = rFather * tTog;
      return {
        calculatedValues: { tBill, tFather, tTog, rBill, rFather, rTog, D, distBill, distFather, maxTime: tTog },
        table: [
          { name: 'Bill',     rate: '1/t room/h',      time: 't h',    dist: '1 room' },
          { name: 'Father',   rate: '1/(t-2) room/h',  time: 't-2 h',  dist: '1 room' },
          { name: 'Together', rate: '5/12 room/h',     time: '2.4 h',  dist: '1 room' }
        ],
        steps: [
          { title: 'Set up the rate table (1 room = the job)',
            desc: 'Let <i>t</i> = Bill\'s solo time in hours. Father takes 2 hours less, so his time is <i>t − 2</i>. Rate = 1 ÷ time.',
            eq: `\\text{Bill: } \\frac{1}{t} \\text{ room/h} \\quad \\text{Father: } \\frac{1}{t-2} \\text{ room/h}` },
          { title: 'Rates add when working together',
            desc: 'Together they paint 1 room in 2.4 h, so the combined rate is 1/2.4 = 5/12 room/h.',
            eq: `\\frac{1}{t} + \\frac{1}{t-2} = \\frac{1}{2.4} = \\frac{5}{12}` },
          { title: 'Solve for t (clear denominators)',
            desc: 'Multiply through by 12t(t−2), expand, and solve the quadratic.',
            eq: `12(t-2) + 12t = 5t(t-2) \\\\ 24t - 24 = 5t^2 - 10t \\\\ 5t^2 - 34t + 24 = 0 \\\\ (5t-4)(t-6)=0` },
          { title: 'Choose the valid root',
            desc: 't = 4/5 would make Father\'s time t − 2 negative (impossible), so discard it.',
            eq: `t = 6 \\text{ h (Bill)} \\quad \\Rightarrow \\quad t - 2 = 4 \\text{ h (Father)}` }
        ],
        finalAnswer: `Bill: ${tBill} hours | Father: ${tFather} hours`,
        quiz: { prompt: `Bill's rate is 1/t and Father's is 1/(t-2); together they paint 1 room in 2.4 h. What is t (Bill's solo time)?`, answer: parseFloat(tBill), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tBill = p.billTime, tFather = Math.max(0.5, tBill - 2);
      const rBill = D / tBill, rFather = D / tFather;
      const tTog = D / (rBill + rFather);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'room',
        doneLabel: 'ROOM PAINTED!',
        rateUnit: 'room/h',
        people: [
          { name: 'Father', rate: rFather, color: '#f97316', side: 'left' },
          { name: 'Bill',   rate: rBill,   color: '#60a5fa', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 room = the job  •  Father is 2 h faster  •  together: ${tTog.toFixed(2)} h`
      });
    }
  },
  {
    id: 'q-24',
    title: 'Question 24',
    isExample: false,
    category: 'worktime',
    timeUnit: 'h',
    text: 'Jack can wash and wax the family car in <span class="highlight">one hour less</span> than it would take Bob. The two working together can complete the job in <span class="highlight">1.2 hours</span>. How much time would each require if they worked alone?',
    defaultParams: { bobTime: 3 },
    sliders: [
      { key: 'bobTime', label: "Bob's Solo Time", min: 1.5, max: 8, step: 0.5, unit: 'h', desc: "Hours for Bob alone (Jack is always 1 h faster)" }
    ],
    solver: (p) => {
      // Job = 1 car. Rates in car/h. Variable t = Bob's solo time; Jack = t − 1.
      const D = 1;
      const tBob = p.bobTime, tJack = Math.max(0.5, tBob - 1);
      const rBob = D / tBob, rJack = D / tJack;          // 1/t and 1/(t-1)
      const rTog = rBob + rJack;                           // = 1/1.2 = 5/6
      const tTog = D / rTog;                               // 1.2 h
      const distBob = rBob * tTog, distJack = rJack * tTog;
      return {
        calculatedValues: { tBob, tJack, tTog, rBob, rJack, rTog, D, distBob, distJack, maxTime: tTog },
        table: [
          { name: 'Bob',      rate: '1/t car/h',      time: 't h',    dist: '1 car' },
          { name: 'Jack',     rate: '1/(t-1) car/h',  time: 't-1 h',  dist: '1 car' },
          { name: 'Together', rate: '5/6 car/h',      time: '1.2 h',  dist: '1 car' }
        ],
        steps: [
          { title: 'Set up the rate table (1 car = the job)',
            desc: 'Let <i>t</i> = Bob\'s solo time in hours. Jack takes 1 hour less, so his time is <i>t − 1</i>. Rate = 1 ÷ time.',
            eq: `\\text{Bob: } \\frac{1}{t} \\text{ car/h} \\quad \\text{Jack: } \\frac{1}{t-1} \\text{ car/h}` },
          { title: 'Rates add when working together',
            desc: 'Together they finish 1 car in 1.2 h, so the combined rate is 1/1.2 = 5/6 car/h.',
            eq: `\\frac{1}{t} + \\frac{1}{t-1} = \\frac{1}{1.2} = \\frac{5}{6}` },
          { title: 'Solve for t (clear denominators)',
            desc: 'Multiply through by 6t(t−1), expand, and solve the quadratic.',
            eq: `6(t-1) + 6t = 5t(t-1) \\\\ 12t - 6 = 5t^2 - 5t \\\\ 5t^2 - 17t + 6 = 0 \\\\ (5t-2)(t-3)=0` },
          { title: 'Choose the valid root',
            desc: 't = 2/5 would make Jack\'s time t − 1 negative (impossible), so discard it.',
            eq: `t = 3 \\text{ h (Bob)} \\quad \\Rightarrow \\quad t - 1 = 2 \\text{ h (Jack)}` }
        ],
        finalAnswer: `Jack: ${tJack} hours | Bob: ${tBob} hours`,
        quiz: { prompt: `Bob's rate is 1/t and Jack's is 1/(t-1); together they finish 1 car in 1.2 h. What is t (Bob's solo time)?`, answer: parseFloat(tBob), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tBob = p.bobTime, tJack = Math.max(0.5, tBob - 1);
      const rBob = D / tBob, rJack = D / tJack;
      const tTog = D / (rBob + rJack);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'car',
        doneLabel: 'CAR DONE!',
        rateUnit: 'car/h',
        people: [
          { name: 'Jack', rate: rJack, color: '#34d399', side: 'left' },
          { name: 'Bob',  rate: rBob,  color: '#f9a8d4', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 car = the job  •  Jack is 1 h faster  •  together: ${tTog.toFixed(2)} h`
      });
    }
  },
  {
    id: 'q-25',
    title: 'Question 25',
    isExample: false,
    category: 'worktime',
    timeUnit: 'h',
    text: 'Working alone, it takes John <span class="highlight">8 hours longer</span> than Carlos to do a job. Working together, they can do the job in <span class="highlight">3 hours</span>. How long would it take each to do the job working alone?',
    defaultParams: { carlosTime: 4 },
    sliders: [
      { key: 'carlosTime', label: "Carlos's Solo Time", min: 2, max: 12, step: 0.5, unit: 'h', desc: "Hours for Carlos alone (John is always 8 h slower)" }
    ],
    solver: (p) => {
      // Job = 1 job. Rates in job/h. Variable t = Carlos's solo time; John = t + 8.
      const D = 1;
      const tCarlos = p.carlosTime, tJohn = tCarlos + 8;
      const rCarlos = D / tCarlos, rJohn = D / tJohn;    // 1/t and 1/(t+8)
      const rTog = rCarlos + rJohn;                        // = 1/3
      const tTog = D / rTog;                               // 3 h
      const distCarlos = rCarlos * tTog, distJohn = rJohn * tTog;
      return {
        calculatedValues: { tCarlos, tJohn, tTog, rCarlos, rJohn, rTog, D, distCarlos, distJohn, maxTime: tTog },
        table: [
          { name: 'Carlos',   rate: '1/t job/h',      time: 't h',    dist: '1 job' },
          { name: 'John',     rate: '1/(t+8) job/h',  time: 't+8 h',  dist: '1 job' },
          { name: 'Together', rate: '1/3 job/h',      time: '3 h',    dist: '1 job' }
        ],
        steps: [
          { title: 'Set up the rate table (1 job total)',
            desc: 'Let <i>t</i> = Carlos\'s solo time in hours. John takes 8 hours longer, so his time is <i>t + 8</i>. Rate = 1 ÷ time.',
            eq: `\\text{Carlos: } \\frac{1}{t} \\text{ job/h} \\quad \\text{John: } \\frac{1}{t+8} \\text{ job/h}` },
          { title: 'Rates add when working together',
            desc: 'Together they finish 1 job in 3 h, so the combined rate is 1/3 job/h.',
            eq: `\\frac{1}{t} + \\frac{1}{t+8} = \\frac{1}{3}` },
          { title: 'Solve for t (clear denominators)',
            desc: 'Multiply through by 3t(t+8), expand, and solve the quadratic.',
            eq: `3(t+8) + 3t = t(t+8) \\\\ 6t + 24 = t^2 + 8t \\\\ t^2 + 2t - 24 = 0 \\\\ (t-4)(t+6)=0` },
          { title: 'Choose the valid root',
            desc: 't must be positive (negative time is impossible), so discard t = −6.',
            eq: `t = 4 \\text{ h (Carlos)} \\quad \\Rightarrow \\quad t + 8 = 12 \\text{ h (John)}` }
        ],
        finalAnswer: `Carlos: ${tCarlos} hours | John: ${tJohn} hours`,
        quiz: { prompt: `Carlos's rate is 1/t and John's is 1/(t+8); together they finish 1 job in 3 h. What is t (Carlos's solo time)?`, answer: parseFloat(tCarlos), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tCarlos = p.carlosTime, tJohn = tCarlos + 8;
      const rCarlos = D / tCarlos, rJohn = D / tJohn;
      const tTog = D / (rCarlos + rJohn);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'job',
        doneLabel: 'JOB DONE!',
        rateUnit: 'job/h',
        people: [
          { name: 'Carlos', rate: rCarlos, color: '#facc15', side: 'left' },
          { name: 'John',   rate: rJohn,   color: '#818cf8', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 job = the task  •  John is 8 h slower  •  together: ${tTog.toFixed(2)} h`
      });
    }
  },
  {
    id: 'q-26',
    title: 'Question 26',
    isExample: false,
    category: 'worktime',
    timeUnit: 'days',
    text: 'If Yousef can do a piece of work alone in <span class="highlight">6 days</span>, and Bridgit can do it alone in <span class="highlight">4 days</span>, how long will it take the two to complete the job working together?',
    defaultParams: { yousefTime: 6, bridgitTime: 4 },
    sliders: [
      { key: 'yousefTime', label: "Yousef's Solo Time", min: 2, max: 15, step: 0.5, unit: 'days', desc: "Days for Yousef alone" },
      { key: 'bridgitTime', label: "Bridgit's Solo Time", min: 1, max: 10, step: 0.5, unit: 'days', desc: "Days for Bridgit alone" }
    ],
    solver: (p) => {
      // Job = 1 job. Rates in job/day. Variable t = together time.
      const D = 1;
      const tY = p.yousefTime, tB = p.bridgitTime;
      const rY = D / tY, rB = D / tB;                     // 1/6 and 1/4
      const rTog = rY + rB;                                 // = 1/t
      const tTog = D / rTog;                               // 12/5 = 2.4 days
      const distY = rY * tTog, distB = rB * tTog;
      return {
        calculatedValues: { tY, tB, tTog, rY, rB, rTog, D, distY, distB, maxTime: tTog },
        table: [
          { name: 'Yousef',   rate: '1/6 job/day',  time: '6 days',  dist: '1 job' },
          { name: 'Bridgit',  rate: '1/4 job/day',  time: '4 days',  dist: '1 job' },
          { name: 'Together', rate: '1/t job/day',  time: 't days',  dist: '1 job' }
        ],
        steps: [
          { title: 'Set up the rate table (1 job total)',
            desc: `Yousef alone: 1 job in ${tY} days → rate 1/${tY}. Bridgit alone: 1 job in ${tB} days → rate 1/${tB}. Together: 1 job in t days → rate 1/t.`,
            eq: `\\text{Yousef: } \\frac{1}{${tY}} \\text{ job/day} \\quad \\text{Bridgit: } \\frac{1}{${tB}} \\text{ job/day} \\quad \\text{Together: } \\frac{1}{t} \\text{ job/day}` },
          { title: 'Rates add when working together',
            desc: 'Their combined rate equals the sum of their individual rates.',
            eq: `\\frac{1}{${tY}} + \\frac{1}{${tB}} = \\frac{1}{t}` },
          { title: 'Solve for t',
            desc: 'Add the fractions on the left, then take the reciprocal of the sum.',
            eq: `\\frac{1}{${tY}} + \\frac{1}{${tB}} = \\frac{${tB}+${tY}}{${(tY*tB)|0}} = \\frac{${tY+tB}}{${(tY*tB)|0}} \\\\ t = \\frac{${(tY*tB)|0}}{${tY+tB}} = ${tTog.toFixed(2)} \\text{ days}` }
        ],
        finalAnswer: `Together: ${tTog.toFixed(2)} days`,
        quiz: { prompt: `Yousef's rate is 1/${tY} and Bridgit's is 1/${tB} job/day. What is t (the together time)?`, answer: parseFloat(tTog.toFixed(2)), unit: 'days' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tY = p.yousefTime, tB = p.bridgitTime;
      const rY = D / tY, rB = D / tB;
      const tTog = D / (rY + rB);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'job',
        doneLabel: 'JOB DONE!',
        rateUnit: 'job/day',
        people: [
          { name: 'Yousef',  rate: rY, color: '#0ea5e9', side: 'left' },
          { name: 'Bridgit', rate: rB, color: '#d946ef', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 job = the task  •  together: ${tTog.toFixed(2)} days`
      });
    }
  },
  {
    id: 'q-27',
    title: 'Question 27',
    isExample: false,
    category: 'worktime',
    timeUnit: 'days',
    text: 'Working alone, Maryam can do a piece of work in <span class="highlight">3 days</span> that Noor can do in <span class="highlight">4 days</span> and Elana can do in <span class="highlight">5 days</span>. How long will it take them to do it working together?',
    defaultParams: { maryamTime: 3, noorTime: 4, elanaTime: 5 },
    sliders: [
      { key: 'maryamTime', label: "Maryam's Solo Time", min: 1, max: 8, step: 0.5, unit: 'days', desc: "Days for Maryam alone" },
      { key: 'noorTime', label: "Noor's Solo Time", min: 2, max: 10, step: 0.5, unit: 'days', desc: "Days for Noor alone" },
      { key: 'elanaTime', label: "Elana's Solo Time", min: 3, max: 12, step: 0.5, unit: 'days', desc: "Days for Elana alone" }
    ],
    solver: (p) => {
      // Job = 1 job. Rates in job/day. Variable t = together time.
      const D = 1;
      const tM = p.maryamTime, tN = p.noorTime, tE = p.elanaTime;
      const rM = D / tM, rN = D / tN, rE = D / tE;      // 1/3, 1/4, 1/5
      const rTog = rM + rN + rE;                           // = 1/t
      const tTog = D / rTog;
      const distM = rM * tTog, distN = rN * tTog, distE = rE * tTog;
      return {
        calculatedValues: { tM, tN, tE, tTog, rM, rN, rE, rTog, D, distM, distN, distE, maxTime: tTog },
        table: [
          { name: 'Maryam',   rate: '1/3 job/day',  time: '3 days',  dist: '1 job' },
          { name: 'Noor',     rate: '1/4 job/day',  time: '4 days',  dist: '1 job' },
          { name: 'Elana',    rate: '1/5 job/day',  time: '5 days',  dist: '1 job' },
          { name: 'Together', rate: '1/t job/day',  time: 't days',  dist: '1 job' }
        ],
        steps: [
          { title: 'Set up the rate table (1 job total)',
            desc: `Each person completes 1 job alone: Maryam in ${tM} days (rate 1/${tM}), Noor in ${tN} days (rate 1/${tN}), Elana in ${tE} days (rate 1/${tE}). Together: 1 job in t days (rate 1/t).`,
            eq: `\\frac{1}{${tM}} + \\frac{1}{${tN}} + \\frac{1}{${tE}} = \\frac{1}{t}` },
          { title: 'Sum the three rates',
            desc: 'Find a common denominator and add the fractions on the left.',
            eq: `\\frac{1}{${tM}} + \\frac{1}{${tN}} + \\frac{1}{${tE}} = \\frac{${(tN*tE)+(tM*tE)+(tM*tN)}}{${(tM*tN*tE)|0}} = \\frac{${(tN*tE)+(tM*tE)+(tM*tN)}}{${(tM*tN*tE)|0}}` },
          { title: 'Take the reciprocal to get t',
            desc: 'Since the combined rate equals 1/t, t is the reciprocal of the sum.',
            eq: `t = \\frac{${(tM*tN*tE)|0}}{${(tN*tE)+(tM*tE)+(tM*tN)}} = ${tTog.toFixed(2)} \\text{ days}` }
        ],
        finalAnswer: `Together: ${tTog.toFixed(2)} days`,
        quiz: { prompt: `Maryam's rate is 1/${tM}, Noor's is 1/${tN}, Elana's is 1/${tE} job/day. What is t (the together time)?`, answer: parseFloat(tTog.toFixed(2)), unit: 'days' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tM = p.maryamTime, tN = p.noorTime, tE = p.elanaTime;
      const rM = D / tM, rN = D / tN, rE = D / tE;
      const tTog = D / (rM + rN + rE);
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'job',
        doneLabel: 'JOB DONE!',
        rateUnit: 'job/day',
        people: [
          { name: 'Maryam', rate: rM, color: '#f43f5e', side: 'left' },
          { name: 'Noor',   rate: rN, color: '#22d3ee', side: 'right' },
          { name: 'Elana',  rate: rE, color: '#fbbf24', side: 'left' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 job = the task  •  3 workers together: ${tTog.toFixed(2)} days`
      });
    }
  },
  {
    id: 'q-28',
    title: 'Question 28',
    isExample: false,
    category: 'worktime',
    timeUnit: 'h',
    text: 'It takes <span class="highlight">10 hours</span> to fill a pool with the inlet pipe. It can be emptied in <span class="highlight">15 hours</span> with the outlet pipe. If the pool is <span class="highlight">half full</span> to begin with, how long will it take to fill from there if both pipes are open?',
    defaultParams: { fillTime: 10, drainTime: 15, startLevel: 0.5 },
    sliders: [
      { key: 'fillTime', label: "Fill Time (inlet)", min: 5, max: 20, step: 0.5, unit: 'h', desc: "Hours for inlet pipe to fill the pool" },
      { key: 'drainTime', label: "Drain Time (outlet)", min: 8, max: 30, step: 0.5, unit: 'h', desc: "Hours for outlet pipe to empty the pool" },
      { key: 'startLevel', label: "Initial Fill Level", min: 0.1, max: 0.9, step: 0.1, unit: '', desc: "Fraction of pool already full" }
    ],
    solver: (p) => {
      // Job = 1 pool. Rates in pool/h. Variable t = time to fill the remaining portion.
      // Clamp fill time so the inlet always outpaces the outlet (keeps the pool fillable).
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime, start = p.startLevel;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;      // 1/10 and 1/15
      const netRate = rFill - rDrain;                     // 1/10 - 1/15 = 1/30
      const remaining = D * (1 - start);                  // 1/2 pool to fill
      const tNet = netRate > 0 ? remaining / netRate : Infinity; // 15 h
      return {
        calculatedValues: { tFill, tDrain, start, rFill, rDrain, netRate, remaining, tNet, D, maxTime: tNet },
        table: [
          { name: 'Inlet (in)',   rate: '1/10 pool/h',   time: 't h', dist: '(1/10)t pool' },
          { name: 'Outlet (out)', rate: '−1/15 pool/h',  time: 't h', dist: '−(1/15)t pool' },
          { name: 'Net',          rate: '1/30 pool/h',   time: 't h', dist: `${fracStr(remaining)} pool` }
        ],
        steps: [
          { title: 'Set up the rate table (1 pool = full)',
            desc: `Inlet fills 1 pool in ${tFill} h (rate 1/${tFill}); outlet empties 1 pool in ${tDrain} h (rate 1/${tDrain}).`,
            eq: `\\text{Inlet: } \\frac{1}{${tFill}} \\text{ pool/h} \\quad \\text{Outlet: } \\frac{1}{${tDrain}} \\text{ pool/h}` },
          { title: 'Net rate = fill − drain',
            desc: 'With both open, the net fill rate is the difference of the two rates.',
            eq: `\\frac{1}{${tFill}} - \\frac{1}{${tDrain}} = \\frac{${tDrain-tFill}}{${(tFill*tDrain)|0}} = \\frac{1}{30} \\text{ pool/h}` },
          { title: 'Solve for t (fill the remaining portion)',
            desc: `The pool is already ${(start*100).toFixed(0)}% full, so only ${fracStr(remaining)} of a pool remains to fill.`,
            eq: `t = \\frac{${fracStr(remaining)}}{\\frac{1}{30}} = ${tNet.toFixed(2)} \\text{ hours}` }
        ],
        finalAnswer: `Time to fill from ${(start * 100).toFixed(0)}%: ${tNet.toFixed(2)} hours`,
        quiz: { prompt: `Net fill rate is 1/30 pool/h and ${fracStr(remaining)} pool remains. What is t (time to fill)?`, answer: parseFloat(tNet.toFixed(2)), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime, start = p.startLevel;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;
      const netRate = rFill - rDrain;
      const remaining = D * (1 - start);
      const tNet = netRate > 0 ? remaining / netRate : D;
      const activeTime = Math.min(canvasTime, tNet * 1.2);
      const fillLevel = Math.min(1, start + netRate * activeTime / D);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const isDark = state.theme === 'dark';
      ctx.fillStyle = isDark ? '#0b1329' : '#f0f9ff'; ctx.fillRect(0, 0, w, h);
      drawTankVisualization(ctx, w, h, fillLevel, rFill, rDrain, 'h');
      ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`net: ${fracStr(netRate)} pool/h  •  start ${(start*100).toFixed(0)}%  •  fill time: ${tNet.toFixed(2)} h`, w / 2, 22);
      ctx.fillStyle = '#22d3ee'; ctx.font = '10px var(--font-mono)'; ctx.textAlign = 'left';
      ctx.fillText(`t = ${activeTime.toFixed(2)} h  |  level: ${(fillLevel * 100).toFixed(1)}%`, 10, h - 8);
    }
  },
  {
    id: 'q-29',
    title: 'Question 29',
    isExample: false,
    category: 'worktime',
    timeUnit: 'min',
    text: 'A sink is <span class="highlight">¼ full</span> when both the faucet and the drain are opened. The faucet alone can fill the sink in <span class="highlight">6 minutes</span>, while it takes <span class="highlight">8 minutes</span> to empty it with the drain. How long will it take to fill the remaining ¾ of the sink?',
    defaultParams: { fillTime: 6, drainTime: 8, startLevel: 0.25 },
    sliders: [
      { key: 'fillTime', label: "Faucet Fill Time", min: 3, max: 15, step: 0.5, unit: 'min', desc: "Minutes for the faucet alone to fill the sink" },
      { key: 'drainTime', label: "Drain Empty Time", min: 4, max: 20, step: 0.5, unit: 'min', desc: "Minutes for the drain alone to empty the sink" },
      { key: 'startLevel', label: "Starting Fill Level", min: 0.1, max: 0.9, step: 0.05, unit: '', desc: "Fraction of sink already filled" }
    ],
    solver: (p) => {
      // Job = 1 sink (full). Rates in sink/min. Variable t = time to fill the remaining portion.
      // Clamp fill time so the faucet always outpaces the drain (keeps the sink fillable).
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime, start = p.startLevel;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;      // 1/6 and 1/8
      const netRate = rFill - rDrain;                     // 1/6 - 1/8 = 1/24
      const remaining = D * (1 - start);                  // 3/4 sink to fill
      const tNet = netRate > 0 ? remaining / netRate : Infinity; // 18 min
      return {
        calculatedValues: { tFill, tDrain, start, rFill, rDrain, netRate, remaining, tNet, D, maxTime: tNet },
        table: [
          { name: 'Faucet (in)', rate: '1/6 sink/min',   time: 't min', dist: '(1/6)t sink' },
          { name: 'Drain (out)', rate: '−1/8 sink/min',  time: 't min', dist: '−(1/8)t sink' },
          { name: 'Net',         rate: '1/24 sink/min',  time: 't min', dist: `${fracStr(remaining)} sink` }
        ],
        steps: [
          { title: 'Set up the rate table (1 sink = full)',
            desc: `Faucet fills 1 sink in ${tFill} min (rate 1/${tFill}); drain empties 1 sink in ${tDrain} min (rate 1/${tDrain}).`,
            eq: `\\text{Faucet: } \\frac{1}{${tFill}} \\text{ sink/min} \\quad \\text{Drain: } \\frac{1}{${tDrain}} \\text{ sink/min}` },
          { title: 'Net rate = fill − drain',
            desc: 'With both open, the net fill rate is the difference of the two rates.',
            eq: `\\frac{1}{${tFill}} - \\frac{1}{${tDrain}} = \\frac{${tDrain-tFill}}{${(tFill*tDrain)|0}} = \\frac{1}{24} \\text{ sink/min}` },
          { title: 'Solve for t (fill the remaining portion)',
            desc: `The sink is already ${(start*100).toFixed(0)}% full, so only ${fracStr(remaining)} of a sink remains.`,
            eq: `t = \\frac{${fracStr(remaining)}}{\\frac{1}{24}} = ${tNet.toFixed(2)} \\text{ minutes}` }
        ],
        finalAnswer: `Time to fill from ${(start * 100).toFixed(0)}%: ${tNet.toFixed(2)} minutes`,
        quiz: { prompt: `Net fill rate is 1/24 sink/min and ${fracStr(remaining)} sink remains. What is t (time to fill)?`, answer: parseFloat(tNet.toFixed(2)), unit: 'min' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const tFill = Math.min(p.fillTime, p.drainTime - 0.5), tDrain = p.drainTime, start = p.startLevel;
      const D = 1;
      const rFill = D / tFill, rDrain = D / tDrain;
      const netRate = rFill - rDrain;
      const remaining = D * (1 - start);
      const tNet = netRate > 0 ? remaining / netRate : D;
      const activeTime = Math.min(canvasTime, tNet * 1.2);
      const fillLevel = Math.min(1, start + netRate * activeTime / D);
      const w = canvas.clientWidth, h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const isDark = state.theme === 'dark';
      ctx.fillStyle = isDark ? '#0b1329' : '#f0f9ff'; ctx.fillRect(0, 0, w, h);
      drawTankVisualization(ctx, w, h, fillLevel, rFill, rDrain, 'min');
      ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`net: ${fracStr(netRate)} sink/min  •  start ${(start*100).toFixed(0)}%  •  fill time: ${tNet.toFixed(2)} min`, w / 2, 22);
      ctx.fillStyle = '#22d3ee'; ctx.font = '10px var(--font-mono)'; ctx.textAlign = 'left';
      ctx.fillText(`t = ${activeTime.toFixed(2)} min  |  level: ${(fillLevel * 100).toFixed(1)}%`, 10, h - 8);
    }
  },
  {
    id: 'q-30',
    title: 'Question 30',
    isExample: false,
    category: 'worktime',
    timeUnit: 'h',
    text: 'A water tank is being filled by two inlet pipes. Pipe A can fill the tank in <span class="highlight">4.5 hours</span>, while both pipes together can fill the tank in <span class="highlight">2 hours</span>. How long does it take to fill the tank using only Pipe B?',
    defaultParams: { pipeATime: 4.5, togetherTime: 2 },
    sliders: [
      { key: 'pipeATime', label: "Pipe A Solo Time", min: 2, max: 12, step: 0.5, unit: 'h', desc: "Hours for Pipe A alone to fill the tank" },
      { key: 'togetherTime', label: "Together Time (A+B)", min: 0.5, max: 6, step: 0.25, unit: 'h', desc: "Hours for both pipes together to fill the tank" }
    ],
    solver: (p) => {
      // Job = 1 tank. Rates in tank/h. Variable t = Pipe B's solo time.
      const D = 1;
      const tA = p.pipeATime, tTog = p.togetherTime;
      const rA = D / tA;                                   // 1/4.5 = 2/9
      const rTog = D / tTog;                               // 1/2
      const rB = Math.max(0.001, rTog - rA);               // 1/2 - 2/9 = 5/18
      const tB = D / rB;                                   // 18/5 = 3.6 h
      const distA = rA * tTog, distB = rB * tTog;
      return {
        calculatedValues: { tA, tTog, tB, rA, rB, rTog, D, distA, distB, maxTime: tTog },
        table: [
          { name: 'Pipe A',       rate: '2/9 tank/h',  time: '4.5 h', dist: '1 tank' },
          { name: 'Pipe B',       rate: '1/t tank/h',  time: 't h',   dist: '1 tank' },
          { name: 'Together',     rate: '1/2 tank/h',  time: '2 h',   dist: '1 tank' }
        ],
        steps: [
          { title: 'Set up the rate table (1 tank = full)',
            desc: `Pipe A fills 1 tank in ${tA} h, so its rate is 1/${tA} = 2/9 tank/h. Together they fill 1 tank in ${tTog} h (rate 1/${tTog} = 1/2 tank/h). Let Pipe B take t hours alone (rate 1/t).`,
            eq: `\\text{A: } \\frac{1}{${tA}} = \\frac{2}{9} \\text{ tank/h} \\quad \\text{B: } \\frac{1}{t} \\text{ tank/h} \\quad \\text{Together: } \\frac{1}{${tTog}} = \\frac{1}{2} \\text{ tank/h}` },
          { title: 'Rates add when both pipes work',
            desc: 'The combined rate equals the sum of the two individual rates.',
            eq: `\\frac{2}{9} + \\frac{1}{t} = \\frac{1}{2}` },
          { title: 'Solve for t (Pipe B\'s solo time)',
            desc: 'Isolate 1/t, then take the reciprocal.',
            eq: `\\frac{1}{t} = \\frac{1}{2} - \\frac{2}{9} = \\frac{9-4}{18} = \\frac{5}{18} \\quad \\Rightarrow \\quad t = \\frac{18}{5} = ${tB.toFixed(2)} \\text{ hours}` }
        ],
        finalAnswer: `Pipe B solo time: ${tB.toFixed(2)} hours`,
        quiz: { prompt: `Pipe A rate is 2/9 tank/h and together is 1/2 tank/h. What is t (Pipe B's solo time)?`, answer: parseFloat(tB.toFixed(2)), unit: 'h' }
      };
    },
    draw: (ctx, canvasTime, p) => {
      const D = 1;
      const tA = p.pipeATime, tTog = p.togetherTime;
      const rA = D / tA, rTog = D / tTog, rB = Math.max(0.001, rTog - rA);
      const tB = D / rB;
      drawWorkTogether(ctx, canvas, {
        jobUnitLabel: 'tank',
        doneLabel: 'TANK FILLED!',
        rateUnit: 'tank/h',
        people: [
          { name: 'Pipe A', rate: rA, color: '#22c55e', side: 'left' },
          { name: 'Pipe B', rate: rB, color: '#06b6d4', side: 'right' }
        ],
        totalTime: tTog,
        canvasTime,
        caption: `1 tank = the job  •  A: ${tA} h, B: ${tB.toFixed(2)} h, together: ${tTog} h`
      });
    }
  },
  ];

  // Helper to parse question strings and dynamically extract details
  // Note: Since raw algebra parser is complex, we map each of the 22 questions to its corresponding category template.
  const practiceQuestionsMetadata = [
    { id: 'q-1', cat: 'opposite', isTowards: true, dParams: { rate1: 20, rate2: 25, totalDist: 60 } },
    { id: 'q-2', cat: 'opposite', isTowards: true, dParams: { diff: 5, time: 6, totalDist: 276 } },
    { id: 'q-3', cat: 'opposite', isTowards: false, dParams: { rate1: 25, rate2: 40, totalDist: 195 } },
    { id: 'q-4', cat: 'opposite', isTowards: false, dParams: { rate1: 20, time: 5, totalDist: 150 } },
    { id: 'q-5', cat: 'opposite', isTowards: true, dParams: { diff: 15, time: 4, totalDist: 300 } },
    { id: 'q-6', cat: 'opposite', isTowards: false, dParams: { rate1: 25, rate2: 35, totalDist: 180 } },
    { id: 'q-7', cat: 'roundtrip', dParams: { rate1: 10, rate2: 3, totalTime: 10 } },
    { id: 'q-8', cat: 'roundtrip', dParams: { rate1: 4, rate2: 20, totalTime: 3 } },
    { id: 'q-9', cat: 'roundtrip', dParams: { rate1: 28, rate2: 4, totalTime: 2 } },
    { id: 'q-10', cat: 'roundtrip', dParams: { rate1: 15, rate2: 10, totalTime: 5 } },
    { id: 'q-11', cat: 'roundtrip', dParams: { rate1: 30, rate2: 50, totalTime: 8 } },
    { id: 'q-12', cat: 'roundtrip', dParams: { rate1: 90, rate2: 120, totalTime: 7 } },
    { id: 'q-13', cat: 'catchup', dParams: { rate1: 4, rate2: 6, delay: 2 } },
    { id: 'q-14', cat: 'catchup', dParams: { rate1: 5, rate2: 8, delay: 6 } },
    { id: 'q-15', cat: 'catchup', dParams: { rate1: 8, rate2: 16, delay: 2 } },
    { id: 'q-16', cat: 'catchup', dParams: { rate1: 6, rate2: 8, delay: 1 } },
    { id: 'q-17', cat: 'opposite', isTowards: false, dParams: { rate1: 20, rate2: 30, totalDist: 300 } },
    { id: 'q-18', cat: 'opposite', isTowards: false, dParams: { diff: 6, time: 4, totalDist: 168 } },
    { id: 'q-19', cat: 'opposite', isTowards: false, dParams: { factor: 2, time: 3, totalDist: 72 } },
    { id: 'q-20', cat: 'opposite', isTowards: false, dParams: { diff: 25, time: 2, totalDist: 430 } },
    { id: 'q-21', cat: 'split', dParams: { speed1: 55, speed2: 40, totalDist: 130, totalTime: 2.5 } },
    { id: 'q-22', cat: 'roundtrip', dParams: { rate1: 8, rate2: 3, totalTime: 55, unit: 'm/s' } }
  ];

  const rawQuestionsTexts = [
    "A is 60 kilometres from B. An automobile at A starts for B at the rate of 20 km/h at the same time that an automobile at B starts for A at the rate of 25 km/h. How long will it be before the automobiles meet?",
    "Two automobiles are 276 kilometres apart and start to travel toward each other at the same time. They travel at rates differing by 5 km/h. If they meet after 6 h, find the rate of each.",
    "Two trains starting at the same station head in opposite directions. They travel at the rates of 25 and 40 km/h, respectively. If they start at the same time, how soon will they be 195 kilometres apart?",
    "Two bike messengers, Jerry and Susan, ride in opposite directions. If Jerry rides at the rate of 20 km/h, at what rate must Susan ride if they are 150 kilometres apart in 5 hours?",
    "A passenger and a freight train start toward each other at the same time from two points 300 kilometres apart. If the rate of the passenger train exceeds the rate of the freight train by 15 km/h, and they meet after 4 hours, what must the rate of each be?",
    "Two automobiles started travelling in opposite directions at the same time from the same point. Their rates were 25 and 35 km/h, respectively. After how many hours were they 180 kilometres apart?",
    "A man having ten hours at his disposal made an excursion by bike, riding out at the rate of 10 km/h and returning on foot at the rate of 3 km/h. Find the distance he rode.",
    "A man walks at the rate of 4 km/h. How far can he walk into the country and ride back on a trolley that travels at the rate of 20 km/h, if he must be back home 3 hours from the time he started?",
    "A boy rides away from home in an automobile at the rate of 28 km/h and walks back at the rate of 4 km/h. The round trip requires 2 hours. How far does he ride?",
    "A motorboat leaves a harbour and travels at an average speed of 15 km/h toward an island. The average speed on the return trip was 10 km/h. How far was the island from the harbour if the trip took a total of 5 hours?",
    "A family drove to a resort at an average speed of 30 km/h and later returned over the same road at an average speed of 50 km/h. Find the distance to the resort if the total driving time was 8 hours.",
    "As part of his flight training, a student pilot was required to fly to an airport and then return. The average speed to the airport was 90 km/h, and the average speed returning was 120 km/h. Find the distance between the two airports if the total flying time was 7 hours.",
    "Sam starts travelling at 4 km/h from a campsite 2 hours ahead of Sue, who travels 6 km/h in the same direction. How many hours will it take for Sue to catch up to Sam?",
    "A man travels 5 km/h. After travelling for 6 hours, another man starts at the same place as the first man did, following at the rate of 8 km/h. When will the second man overtake the first?",
    "A motorboat leaves a harbour and travels at an average speed of 8 km/h toward a small island. Two hours later, a cabin cruiser leaves the same harbour and travels at an average speed of 16 km/h toward the same island. How many hours after the cabin cruiser leaves will it be alongside the motorboat?",
    "A long distance runner started on a course, running at an average speed of 6 km/h. One hour later, a second runner began the same course at an average speed of 8 km/h. How long after the second runner started will they overtake the first runner?",
    "Two men are travelling in opposite directions at the rate of 20 and 30 km/h at the same time and from the same place. In how many hours will they be 300 kilometres apart?",
    "Two trains start at the same time from the same place and travel in opposite directions. If the rate of one is 6 km/h more than the rate of the other and they are 168 kilometres apart at the end of 4 hours, what is the rate of each?",
    "Two cyclists start from the same point and ride in opposite directions. One cyclist rides twice as fast as the other. In three hours, they are 72 kilometres apart. Find the rate of each cyclist.",
    "Two small planes start from the same point and fly in opposite directions. The first plane is flying 25 km/h slower than the second plane. In two hours, the planes are 430 kilometres apart. Find the rate of each plane.",
    "On a 130-kilometre trip, a car travelled at an average speed of 55 km/h and then reduced its speed to 40 km/h for the remainder of the trip. The trip took a total of 2.5 hours. For how long did the car travel at 40 km/h?",
    "Running at an average rate of 8 m/s, a sprinter ran to the end of a track and then jogged back to the starting point at an average of 3 m/s. The sprinter took 55 s to run to the end of the track and jog back. Find the length of the track."
  ];

  // Populating the practice questions into the main database array
  practiceQuestionsMetadata.forEach((meta, index) => {
    const rawText = rawQuestionsTexts[index];
    let highlightText = rawText;
    
    // Simple text highlighting for numbers/units
    highlightText = highlightText.replace(/(\b\d+(\.\d+)?\b\s*(kilometres|km\/h|hours|h|h\b|hours\b|meters|m\/s|s\b|seconds))/gi, '<span class="highlight">$1</span>');

    const prob = {
      id: meta.id,
      title: `Question ${index + 1}`,
      isExample: false,
      category: meta.cat,
      text: highlightText,
      defaultParams: meta.dParams,
      sliders: [],
      solver: null,
      draw: null
    };

    // Category based sliders and solvers
    if (meta.cat === 'opposite') {
      if (meta.dParams.rate1 !== undefined && meta.dParams.rate2 !== undefined) {
        prob.sliders = [
          { key: 'rate1', label: "Speed of A / Train 1", min: 5, max: 80, step: 1, unit: 'km/h' },
          { key: 'rate2', label: "Speed of B / Train 2", min: 5, max: 80, step: 1, unit: 'km/h' },
          { key: 'totalDist', label: "Total Distance", min: 10, max: 800, step: 5, unit: 'km' }
        ];
        prob.solver = (p) => {
          const r1 = p.rate1;
          const r2 = p.rate2;
          const D = p.totalDist;
          const t = D / (r1 + r2);
          return {
            calculatedValues: { r1, r2, D, t },
            table: [
              { name: "Object 1", rate: `${r1} km/h`, time: "t", dist: `${r1}t` },
              { name: "Object 2", rate: `${r2} km/h`, time: "t", dist: `${r2}t` }
            ],
            steps: [
              {
                title: "Define Variables",
                desc: "Let the travel time until they meet be <i>t</i> hours.",
                eq: `\\text{Dist 1} = ${r1}t, \\quad \\text{Dist 2} = ${r2}t`
              },
              {
                title: "Create distance sum equation",
                desc: "The sum of their distances equals the total initial distance separation.",
                eq: `${r1}t + ${r2}t = ${D}`
              },
              {
                title: "Solve for Time (t)",
                desc: "Combine rates and divide the distance.",
                eq: `${(r1 + r2)}t = ${D} \\\\ t = \\frac{${D}}{${r1 + r2}} = ${t.toFixed(2)} \\text{ hours}`
              }
            ],
            finalAnswer: `Meeting Time: ${t.toFixed(2)} hours (${(t*60).toFixed(0)} mins)`,
            quiz: {
              prompt: `How long will they take to meet if Speed 1 is ${r1} km/h, Speed 2 is ${r2} km/h, and Distance is ${D} km?`,
              answer: parseFloat(t.toFixed(2)),
              unit: 'h'
            }
          };
        };
        prob.draw = (ctx, canvasTime, p) => {
          const r1 = p.rate1;
          const r2 = p.rate2;
          const D = p.totalDist;
          const t_meet = D / (r1 + r2);
          const t_max = t_meet * 1.15;
          const activeTime = Math.min(canvasTime, t_max);
          
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          const centerY = Math.round(h * 0.63);
          const centerX = w / 2;
          
          drawBackground(ctx, w, h, centerY);
          
          const margin = 70;
          const startX = margin;
          const endX = w - margin;
          const travelWidth = endX - startX;
          
          const dist1 = r1 * activeTime;
          const dist2 = r2 * activeTime;
          
          let pos1, pos2;
          
          if (meta.isTowards) {
            const scale = travelWidth / D;
            pos1 = startX + dist1 * scale;
            pos2 = endX - dist2 * scale;
            
            // Draw objects (moving towards each other)
            drawCar(ctx, pos1, centerY - 12, "Car A", '#38bdf8', activeTime * r1 * 2);
            drawSpeedArrow(ctx, pos1, centerY - 50, 25, '#38bdf8', `${r1} km/h`);
            
            drawCar(ctx, pos2, centerY - 12, "Car B", '#ec4899', activeTime * r2 * 2, true);
            drawSpeedArrow(ctx, pos2, centerY - 50, -25, '#ec4899', `${r2} km/h`);
            
            drawRuler(ctx, startX, pos1, centerY + 30, `${dist1.toFixed(1)} km`, '#38bdf8');
            drawRuler(ctx, pos2, endX, centerY + 30, `${dist2.toFixed(1)} km`, '#ec4899');
            drawRuler(ctx, startX, endX, centerY + 65, `Total Distance: ${D} km`, '#4ade80');
            
            if (activeTime >= t_meet) {
              ctx.fillStyle = '#22c55e';
              ctx.beginPath();
              ctx.arc(startX + t_meet * r1 * scale, centerY - 12, 10, 0, Math.PI*2);
              ctx.fill();
              ctx.fillStyle = '#000';
              ctx.font = 'bold 9px sans-serif';
              ctx.fillText("COLLIDE", startX + t_meet * r1 * scale, centerY - 9);
            }
          } else {
            // Moving away from each other (opposite directions starting from center)
            const maxFinalDist = Math.max(r1 * t_max, r2 * t_max);
            const scale = maxFinalDist > 0 ? (centerX - margin) / maxFinalDist : 1;
            pos1 = centerX - dist1 * scale;
            pos2 = centerX + dist2 * scale;
            
            // Draw objects (moving away)
            drawCar(ctx, pos1, centerY - 12, "Train A", '#38bdf8', activeTime * r1 * 2, true);
            drawSpeedArrow(ctx, pos1, centerY - 50, -25, '#38bdf8', `${r1} km/h`);
            
            drawCar(ctx, pos2, centerY - 12, "Train B", '#ec4899', activeTime * r2 * 2, false);
            drawSpeedArrow(ctx, pos2, centerY - 50, 25, '#ec4899', `${r2} km/h`);
            
            drawRuler(ctx, centerX, pos1, centerY + 30, `${dist1.toFixed(1)} km`, '#38bdf8');
            drawRuler(ctx, centerX, pos2, centerY + 30, `${dist2.toFixed(1)} km`, '#ec4899');
            drawRuler(ctx, pos1, pos2, centerY + 65, `Distance Apart: ${(dist1 + dist2).toFixed(1)} km`, '#4ade80');
          }
        };
      } 
      else if (meta.dParams.diff !== undefined && meta.dParams.time !== undefined) {
        prob.sliders = [
          { key: 'diff', label: "Speed Difference", min: 1, max: 30, step: 1, unit: 'km/h' },
          { key: 'time', label: "Travel Time", min: 1, max: 12, step: 0.5, unit: 'h' },
          { key: 'totalDist', label: "Total Distance", min: 50, max: 1000, step: 10, unit: 'km' }
        ];
        prob.solver = (p) => {
          // Equation: t * r + t * (r + diff) = totalDist -> 2rt + t*diff = D -> 2rt = D - t*diff -> r = (D - t*diff) / (2t)
          const diff = p.diff;
          const t = p.time;
          const D = p.totalDist;
          let r1 = (D - t * diff) / (2 * t);
          if (r1 < 1) r1 = 1;
          const r2 = r1 + diff;
          
          return {
            calculatedValues: { r1, r2, diff, t, D },
            table: [
              { name: "Object 1 (Slow)", rate: "r", time: `${t} h`, dist: `${t}r` },
              { name: "Object 2 (Fast)", rate: `r + ${diff}`, time: `${t} h`, dist: `${t}(r + ${diff})` }
            ],
            steps: [
              {
                title: "Define Variable rates",
                desc: "Let the rate of the slower automobile be <i>r</i>. The faster automobile rides at <i>r + " + diff + "</i>.",
                eq: `\\text{Slow rate} = r, \\quad \\text{Fast rate} = r + ${diff}`
              },
              {
                title: "Equate total distance",
                desc: "Since they drive toward each other and meet, the sum of their distances equals the total starting separation.",
                eq: `${t}r + ${t}(r + ${diff}) = ${D}`
              },
              {
                title: "Solve for rate (r)",
                desc: "Simplify and isolate <i>r</i>.",
                eq: `${t}r + ${t}r + ${t*diff} = ${D} \\\\ ${2*t}r = ${D - t*diff} \\\\ r = \\frac{${(D - t*diff)}}{${2*t}} = ${r1.toFixed(2)} \\text{ km/h}`
              }
            ],
            finalAnswer: `Slow Rate: ${r1.toFixed(2)} km/h | Fast Rate: ${r2.toFixed(2)} km/h`,
            quiz: {
              prompt: `Find the slower rate if they are ${D} km apart, meet in ${t} hours, and speeds differ by ${diff} km/h.`,
              answer: parseFloat(r1.toFixed(2)),
              unit: 'km/h'
            }
          };
        };
        prob.draw = (ctx, canvasTime, p) => {
          const diff = p.diff;
          const t = p.time;
          const D = p.totalDist;
          let r1 = (D - t * diff) / (2 * t);
          if (r1 < 1) r1 = 1;
          const r2 = r1 + diff;
          
          const t_max = t * 1.15;
          const activeTime = Math.min(canvasTime, t_max);
          
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          const centerY = Math.round(h * 0.63);
          const centerX = w / 2;
          
          drawBackground(ctx, w, h, centerY);
          
          const margin = 70;
          const startX = margin;
          const endX = w - margin;
          const travelWidth = endX - startX;
          
          const dist1 = r1 * activeTime;
          const dist2 = r2 * activeTime;
          
          let pos1, pos2;
          
          if (meta.isTowards) {
            const scale = travelWidth / D;
            pos1 = startX + dist1 * scale;
            pos2 = endX - dist2 * scale;
            
            drawCar(ctx, pos1, centerY - 12, "Slow Car", '#38bdf8', activeTime * r1 * 2);
            drawSpeedArrow(ctx, pos1, centerY - 50, 20, '#38bdf8', `${r1.toFixed(1)} km/h`);
            
            drawCar(ctx, pos2, centerY - 12, "Fast Car", '#ec4899', activeTime * r2 * 2, true);
            drawSpeedArrow(ctx, pos2, centerY - 50, -30, '#ec4899', `${r2.toFixed(1)} km/h`);
            
            drawRuler(ctx, startX, pos1, centerY + 30, `${dist1.toFixed(1)} km`, '#38bdf8');
            drawRuler(ctx, pos2, endX, centerY + 30, `${dist2.toFixed(1)} km`, '#ec4899');
          } else {
            // Moving away
            const maxFinalDist = Math.max(r1 * t_max, r2 * t_max);
            const scale = maxFinalDist > 0 ? (centerX - margin) / maxFinalDist : 1;
            pos1 = centerX - dist1 * scale;
            pos2 = centerX + dist2 * scale;
            
            drawCar(ctx, pos1, centerY - 12, "Slow Car", '#38bdf8', activeTime * r1 * 2, true);
            drawSpeedArrow(ctx, pos1, centerY - 50, -20, '#38bdf8', `${r1.toFixed(1)} km/h`);
            
            drawCar(ctx, pos2, centerY - 12, "Fast Car", '#ec4899', activeTime * r2 * 2, false);
            drawSpeedArrow(ctx, pos2, centerY - 50, 30, '#ec4899', `${r2.toFixed(1)} km/h`);
            
            drawRuler(ctx, centerX, pos1, centerY + 30, `${dist1.toFixed(1)} km`, '#38bdf8');
            drawRuler(ctx, centerX, pos2, centerY + 30, `${dist2.toFixed(1)} km`, '#ec4899');
            drawRuler(ctx, pos1, pos2, centerY + 65, `Distance Apart: ${(dist1 + dist2).toFixed(1)} km`, '#4ade80');
          }
        };
      }
      else if (meta.dParams.rate1 !== undefined && meta.dParams.time !== undefined) {
        // Question 4: Two bike messengers opposite directions. Jerry 20, Jerry/Susan 150 km in 5 h.
        prob.sliders = [
          { key: 'rate1', label: "Jerry's Speed", min: 5, max: 40, step: 1, unit: 'km/h' },
          { key: 'time', label: "Time Rode", min: 1, max: 10, step: 0.5, unit: 'h' },
          { key: 'totalDist', label: "Final Distance", min: 50, max: 400, step: 5, unit: 'km' }
        ];
        prob.solver = (p) => {
          // Equation: t*r_jerry + t*r_susan = totalDist -> t*r1 + t*r2 = D -> r2 = (D - t*r1)/t
          const r1 = p.rate1;
          const t = p.time;
          const D = p.totalDist;
          let r2 = (D - t * r1) / t;
          if (r2 < 1) r2 = 1;
          
          return {
            calculatedValues: { r1, r2, t, D },
            table: [
              { name: "Jerry", rate: `${r1} km/h`, time: `${t} h`, dist: `${r1 * t} km` },
              { name: "Susan", rate: "r", time: `${t} h`, dist: `${t}r` }
            ],
            steps: [
              {
                title: "Identify variables",
                desc: "Let Susan's speed be <i>r</i>. Fill the table using distance = rate &times; time.",
                eq: `\\text{Jerry Distance} = ${r1} \\times ${t} = ${r1 * t} \\text{ km}, \\quad \\text{Susan Distance} = ${t}r`
              },
              {
                title: "Set up the sum equation",
                desc: "They ride in opposite directions, so their distances add up to the total distance separation.",
                eq: `${r1 * t} + ${t}r = ${D}`
              },
              {
                title: "Solve for Susan's Rate (r)",
                desc: "Subtract Jerry's distance and divide by time.",
                eq: `${t}r = ${D - r1*t} \\\\ r = \\frac{${D - r1*t}}{${t}} = ${r2.toFixed(2)} \\text{ km/h}`
              }
            ],
            finalAnswer: `Susan's Speed: ${r2.toFixed(2)} km/h`,
            quiz: {
              prompt: `Find Susan's speed if Jerry rides at ${r1} km/h, they are apart ${D} km in ${t} hours.`,
              answer: parseFloat(r2.toFixed(2)),
              unit: 'km/h'
            }
          };
        };
        prob.draw = (ctx, canvasTime, p) => {
          const r1 = p.rate1;
          const t = p.time;
          const D = p.totalDist;
          let r2 = (D - t * r1) / t;
          if (r2 < 1) r2 = 1;
          
          const t_max = t;
          const activeTime = Math.min(canvasTime, t_max);
          
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          const centerY = Math.round(h * 0.63);
          const centerX = w / 2;
          
          drawBackground(ctx, w, h, centerY);
          
          const margin = 70;
          const maxFinalDist = Math.max(r1 * t_max, r2 * t_max);
          const scale = maxFinalDist > 0 ? (centerX - margin) / maxFinalDist : 1;
          
          const posX_jerry = centerX - r1 * activeTime * scale;
          const posX_susan = centerX + r2 * activeTime * scale;
          
          drawPersonOnVehicle(ctx, posX_jerry, centerY, "Jerry", '#38bdf8', activeTime * r1 * 2, 'bike', true);
          drawSpeedArrow(ctx, posX_jerry, centerY - 65, -30, '#38bdf8', `${r1} km/h`);
          
          drawPersonOnVehicle(ctx, posX_susan, centerY, "Susan", '#ec4899', activeTime * r2 * 2, 'bike', false);
          drawSpeedArrow(ctx, posX_susan, centerY - 65, 30, '#ec4899', `${r2.toFixed(1)} km/h`);
          
          drawRuler(ctx, centerX, posX_jerry, centerY + 30, `${(r1 * activeTime).toFixed(1)} km`, '#38bdf8');
          drawRuler(ctx, centerX, posX_susan, centerY + 30, `${(r2 * activeTime).toFixed(1)} km`, '#ec4899');
        };
      }
      else if (meta.dParams.factor !== undefined) {
        // Question 19: Cyclists in opposite directions, one twice as fast. 3h, 72km.
        prob.sliders = [
          { key: 'factor', label: "Speed Multiple (Fast/Slow)", min: 1.5, max: 4, step: 0.5, unit: 'x' },
          { key: 'time', label: "Time Rode", min: 1, max: 8, step: 0.5, unit: 'h' },
          { key: 'totalDist', label: "Final Distance", min: 20, max: 300, step: 5, unit: 'km' }
        ];
        prob.solver = (p) => {
          // Equation: t*r + t*(factor*r) = D -> t*r*(1 + factor) = D -> r = D / (t * (1 + factor))
          const k = p.factor;
          const t = p.time;
          const D = p.totalDist;
          const r1 = D / (t * (1 + k));
          const r2 = k * r1;
          
          return {
            calculatedValues: { r1, r2, k, t, D },
            table: [
              { name: "Slow Cyclist", rate: "r", time: `${t} h`, dist: `${t}r` },
              { name: "Fast Cyclist", rate: `${k}r`, time: `${t} h`, dist: `${t}(${k}r)` }
            ],
            steps: [
              {
                title: "Identify Rates",
                desc: "Let the slow cyclist's rate be <i>r</i>. The fast cyclist's rate is <i>" + k + "r</i>.",
                eq: `\\text{Slow Rate} = r, \\quad \\text{Fast Rate} = ${k}r`
              },
              {
                title: "Equate Distances",
                desc: "Sum of distances equals total distance apart.",
                eq: `${t}r + ${t}(${k}r) = ${D}`
              },
              {
                title: "Solve for Slow Rate (r)",
                desc: "Combine terms and solve.",
                eq: `${t*(1+k)}r = ${D} \\\\ r = \\frac{${D}}{${t*(1+k)}} = ${r1.toFixed(2)} \\text{ km/h}`
              },
              {
                title: "Calculate Fast Rate",
                desc: "Multiply slow rate by speed multiple.",
                eq: `\\text{Fast Speed} = ${k}r = ${k} \\times ${r1.toFixed(2)} = ${r2.toFixed(2)} \\text{ km/h}`
              }
            ],
            finalAnswer: `Slow speed: ${r1.toFixed(2)} km/h | Fast speed: ${r2.toFixed(2)} km/h`,
            quiz: {
              prompt: `Find the speed of the slower cyclist if they are ${D} km apart in ${t} hours and one is ${k} times faster.`,
              answer: parseFloat(r1.toFixed(2)),
              unit: 'km/h'
            }
          };
        };
        prob.draw = (ctx, canvasTime, p) => {
          const k = p.factor;
          const t = p.time;
          const D = p.totalDist;
          const r1 = D / (t * (1 + k));
          const r2 = k * r1;
          
          const t_max = t;
          const activeTime = Math.min(canvasTime, t_max);
          
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          const centerY = Math.round(h * 0.63);
          const centerX = w / 2;
          
          drawBackground(ctx, w, h, centerY);
          
          const margin = 70;
          const maxFinalDist = Math.max(r1 * t_max, r2 * t_max);
          const scale = maxFinalDist > 0 ? (centerX - margin) / maxFinalDist : 1;
          
          const posX_slow = centerX - r1 * activeTime * scale;
          const posX_fast = centerX + r2 * activeTime * scale;
          
          drawPersonOnVehicle(ctx, posX_slow, centerY, "Slow", '#38bdf8', activeTime * r1 * 2, 'bike', true);
          drawSpeedArrow(ctx, posX_slow, centerY - 65, -20, '#38bdf8', `${r1.toFixed(1)} km/h`);
          
          drawPersonOnVehicle(ctx, posX_fast, centerY, "Fast", '#ec4899', activeTime * r2 * 2, 'bike', false);
          drawSpeedArrow(ctx, posX_fast, centerY - 65, 35, '#ec4899', `${r2.toFixed(1)} km/h`);
        };
      }
    } 
    else if (meta.cat === 'roundtrip') {
      const isMeters = (meta.dParams.unit === 'm/s');
      const rUnit = isMeters ? 'm/s' : 'km/h';
      const tUnit = isMeters ? 's' : 'h';
      const dUnit = isMeters ? 'm' : 'km';
      
      prob.sliders = [
        { key: 'rate1', label: `Outward Speed (${rUnit})`, min: isMeters ? 1 : 2, max: isMeters ? 15 : 150, step: 0.5, unit: rUnit },
        { key: 'rate2', label: `Return Speed (${rUnit})`, min: isMeters ? 1 : 2, max: isMeters ? 15 : 150, step: 0.5, unit: rUnit },
        { key: 'totalTime', label: `Total Trip Time (${tUnit})`, min: isMeters ? 10 : 0.5, max: isMeters ? 200 : 15, step: isMeters ? 5 : 0.25, unit: tUnit }
      ];
      prob.solver = (p) => {
        // Equation: r1 * t = r2 * (totalTime - t) -> (r1 + r2)t = r2 * totalTime -> t = r2 * totalTime / (r1 + r2)
        // distance = r1 * t
        const r1 = p.rate1;
        const r2 = p.rate2;
        const T = p.totalTime;
        const t_out = (r2 * T) / (r1 + r2);
        const t_back = T - t_out;
        const dist = r1 * t_out;
        
        return {
          calculatedValues: { r1, r2, T, t_out, t_back, dist },
          table: [
            { name: "Outward", rate: `${r1} ${rUnit}`, time: "t", dist: `${r1}(t)` },
            { name: "Return", rate: `${r2} ${rUnit}`, time: `${T} - t`, dist: `${r2}(${T} - t)` }
          ],
          steps: [
            {
              title: "Identify Times",
              desc: `Let outward time be <i>t</i>. Return time is <i>total time - t</i>, which is <i>${T} - t</i>.`,
              eq: `\\text{Out time} = t, \\quad \\text{Return time} = ${T} - t`
            },
            {
              title: "Equate Distances",
              desc: "The outward distance must equal the return distance because they travel the same path.",
              eq: `${r1}t = ${r2}(${T} - t)`
            },
            {
              title: "Solve for t",
              desc: "Isolate <i>t</i> mathematically.",
              eq: `${r1}t = ${(r2*T).toFixed(1)} - ${r2}t \\\\ ${(r1 + r2)}t = ${(r2*T).toFixed(1)} \\\\ t = \\frac{${(r2*T).toFixed(1)}}{${r1 + r2}} = ${t_out.toFixed(2)} \\text{ ${tUnit}}`
            },
            {
              title: "Calculate Distance",
              desc: `Distance = Outward Speed &times; Outward Time.`,
              eq: `\\text{Distance} = ${r1} \\times ${t_out.toFixed(2)} = ${dist.toFixed(2)} \\text{ ${dUnit}}`
            }
          ],
          finalAnswer: `One-way Distance: ${dist.toFixed(2)} ${dUnit} (Out Time: ${t_out.toFixed(2)} ${tUnit})`,
          quiz: {
            prompt: `Calculate the distance if Outward Speed is ${r1} ${rUnit}, Return Speed is ${r2} ${rUnit}, and Total Time is ${T} ${tUnit}.`,
            answer: parseFloat(dist.toFixed(2)),
            unit: dUnit
          }
        };
      };
      prob.draw = (ctx, canvasTime, p) => {
        const r1 = p.rate1;
        const r2 = p.rate2;
        const T = p.totalTime;
        const t_out = (r2 * T) / (r1 + r2);
        
        const activeTime = Math.min(canvasTime, T);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerY = Math.round(h * 0.63);
        
        drawBackground(ctx, w, h, centerY);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        let posX;
        let isOutward = true;
        let dCurrent = 0;
        
        if (activeTime <= t_out) {
          const ratio = t_out > 0 ? activeTime / t_out : 1;
          posX = startX + ratio * travelWidth;
          dCurrent = r1 * activeTime;
          isOutward = true;
        } else {
          const ratio = (T - t_out) > 0 ? (activeTime - t_out) / (T - t_out) : 1;
          posX = endX - ratio * travelWidth;
          dCurrent = r1 * t_out - r2 * (activeTime - t_out);
          isOutward = false;
        }
        
        // Draw car
        drawCar(ctx, posX, centerY - 12, "Runner", isOutward ? '#38bdf8' : '#ec4899', activeTime * 20, !isOutward);
        
        if (isOutward) {
          drawSpeedArrow(ctx, posX, centerY - 50, 25, '#38bdf8', `${r1} ${rUnit}`);
        } else {
          drawSpeedArrow(ctx, posX, centerY - 50, -20, '#ec4899', `${r2} ${rUnit}`);
        }
        
        drawRuler(ctx, startX, endX, centerY + 30, `Total Distance Track: ${(r1 * t_out).toFixed(1)} ${dUnit}`, '#4ade80');
      };
    }
    else if (meta.cat === 'catchup') {
      prob.sliders = [
        { key: 'rate1', label: "Slow Speed (Actor 1)", min: 2, max: 40, step: 1, unit: 'km/h' },
        { key: 'rate2', label: "Fast Speed (Actor 2)", min: 10, max: 120, step: 2, unit: 'km/h' },
        { key: 'delay', label: "Head Start / Delay", min: 0.5, max: 10, step: 0.5, unit: 'h' }
      ];
      prob.solver = (p) => {
        const r1 = p.rate1;
        const r2 = Math.max(p.rate2, r1 + 3);
        const d = p.delay;
        const t1 = (r2 * d) / (r2 - r1);
        const t2 = t1 - d;
        const dist = r1 * t1;
        
        return {
          calculatedValues: { r1, r2, d, t1, t2, dist },
          table: [
            { name: "First Traveler", rate: `${r1} km/h`, time: "t", dist: `${r1}(t)` },
            { name: "Second Traveler", rate: `${r2} km/h`, time: `t - ${d}`, dist: `${r2}(t - ${d})` }
          ],
          steps: [
            {
              title: "Identify Times",
              desc: `Let Traveler 1 time be <i>t</i>. Traveler 2 starts <i>${d} h</i> later, so their time is <i>t - ${d}</i>.`,
              eq: `\\text{Time 1} = t, \\quad \\text{Time 2} = t - ${d}`
            },
            {
              title: "Equate Distances",
              desc: "They catch up at the same point, so distances are equal.",
              eq: `${r1}t = ${r2}(t - ${d})`
            },
            {
              title: "Solve for t (Traveler 1 time)",
              desc: "Distribute and isolate <i>t</i>.",
              eq: `${r1}t = ${r2}t - ${r2 * d} \\\\ ${(r2 - r1)}t = ${r2 * d} \\\\ t = \\frac{${r2 * d}}{${r2 - r1}} = ${t1.toFixed(2)} \\text{ hours}`
            },
            {
              title: "Calculate catch-up duration",
              desc: "Subtract the delay to find how long Traveler 2 traveled.",
              eq: `\\text{Traveler 2 Time} = t - ${d} = ${t1.toFixed(2)} - ${d} = ${t2.toFixed(2)} \\text{ hours}`
            }
          ],
          finalAnswer: `Catch-up Time: ${t2.toFixed(2)} hours | Distance: ${dist.toFixed(1)} km`,
          quiz: {
            prompt: `How long (in hours) will it take the second traveler to catch up if Speed 1 is ${r1} km/h, Speed 2 is ${r2} km/h, and delay is ${d} hours?`,
            answer: parseFloat(t2.toFixed(2)),
            unit: 'h'
          }
        };
      };
      prob.draw = (ctx, canvasTime, p) => {
        const r1 = p.rate1;
        const r2 = Math.max(p.rate2, r1 + 3);
        const d = p.delay;
        const t_meet = (r2 * d) / (r2 - r1);
        const t_max = t_meet * 1.15;
        
        const activeTime = Math.min(canvasTime, t_max);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const lane1Y = Math.round(h * 0.46);
        const lane2Y = Math.round(h * 0.72);
        
        drawBackground2Lanes(ctx, w, h, lane1Y, lane2Y);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        const terryDistMax = r1 * t_max;
        const sallyDistMax = r2 * (t_max - d);
        const maxDist = Math.max(terryDistMax, sallyDistMax);
        const scale = maxDist > 0 ? travelWidth / maxDist : 1;
        
        const d1 = r1 * activeTime;
        const posX1 = startX + d1 * scale;
        
        let d2 = 0;
        let posX2 = startX;
        if (activeTime > d) {
          d2 = r2 * (activeTime - d);
          posX2 = startX + d2 * scale;
        }
        
        drawPersonOnVehicle(ctx, posX1, lane1Y, "Runner 1", '#38bdf8', activeTime * 20, 'runner');
        drawSpeedArrow(ctx, posX1, lane1Y - 82, 20, '#38bdf8', `${r1} km/h`);
        
        if (activeTime > d) {
          drawPersonOnVehicle(ctx, posX2, lane2Y, "Runner 2", '#ec4899', (activeTime - d) * 25, 'runner');
          drawSpeedArrow(ctx, posX2, lane2Y - 82, 30, '#ec4899', `${r2} km/h`);
        } else {
          drawPersonOnVehicle(ctx, startX, lane2Y, "Waiting", '#64748b', 0, 'runner');
        }
        
        drawRuler(ctx, startX, posX1, lane1Y + 30, `${d1.toFixed(1)} km`, '#38bdf8');
        if (activeTime > d) {
          drawRuler(ctx, startX, posX2, lane2Y + 30, `${d2.toFixed(1)} km`, '#ec4899');
        }
      };
    }
    else if (meta.cat === 'split') {
      prob.sliders = [
        { key: 'totalDist', label: "Total Distance", min: 30, max: 300, step: 5, unit: 'km' },
        { key: 'speed1', label: "First Speed", min: 20, max: 120, step: 2, unit: 'km/h' },
        { key: 'speed2', label: "Second Speed", min: 10, max: 80, step: 2, unit: 'km/h' },
        { key: 'totalTime', label: "Total Time", min: 1, max: 8, step: 0.25, unit: 'h' }
      ];
      prob.solver = (p) => {
        const r1 = p.speed1;
        const r2 = p.speed2;
        const D = p.totalDist;
        const T = p.totalTime;
        
        const eff_r1 = Math.max(r1, r2 + 5);
        let t1 = (D - r2 * T) / (eff_r1 - r2);
        if (t1 < 0) t1 = 0;
        if (t1 > T) t1 = T;
        const t2 = T - t1;
        
        return {
          calculatedValues: { r1: eff_r1, r2, D, T, t1, t2 },
          table: [
            { name: "Stage 1", rate: `${eff_r1} km/h`, time: "t", dist: `${eff_r1}t` },
            { name: "Stage 2", rate: `${r2} km/h`, time: `${T} - t`, dist: `${r2}(${T} - t)` }
          ],
          steps: [
            {
              title: "Define Stage Times",
              desc: `Let Stage 1 time be <i>t</i>. Stage 2 time is <i>total time - t</i>, which is <i>${T} - t</i>.`,
              eq: `\\text{Stage 1 time} = t, \\quad \\text{Stage 2 time} = ${T} - t`
            },
            {
              title: "Set up distance equation",
              desc: "The sum of distances equals total distance.",
              eq: `${eff_r1}t + ${r2}(${T} - t) = ${D}`
            },
            {
              title: "Solve for t (Stage 1 time)",
              desc: "Isolate variable <i>t</i>.",
              eq: `${eff_r1}t + ${(r2*T).toFixed(1)} - ${r2}t = ${D} \\\\ ${(eff_r1 - r2)}t = ${(D - r2*T).toFixed(1)} \\\\ t = \\frac{${(D - r2*T).toFixed(1)}}{${eff_r1 - r2}} = ${t1.toFixed(2)} \\text{ hours}`
            },
            {
              title: "Find Stage 2 time",
              desc: "Subtract from total time.",
              eq: `\\text{Stage 2 time} = ${T} - ${t1.toFixed(2)} = ${t2.toFixed(2)} \\text{ hours}`
            }
          ],
          finalAnswer: `Time spent at slow speed: ${t2.toFixed(2)} hours`,
          quiz: {
            prompt: `Calculate the Stage 2 time (at ${r2} km/h) if Total Distance is ${D} km, Stage 1 speed is ${eff_r1} km/h, Stage 2 speed is ${r2} km/h, and Total Time is ${T} hours.`,
            answer: parseFloat(t2.toFixed(2)),
            unit: 'h'
          }
        };
      };
      prob.draw = (ctx, canvasTime, p) => {
        const r1 = p.speed1;
        const r2 = p.speed2;
        const D = p.totalDist;
        const T = p.totalTime;
        
        const eff_r1 = Math.max(r1, r2 + 5);
        let t1 = (D - r2 * T) / (eff_r1 - r2);
        if (t1 < 0) t1 = 0;
        if (t1 > T) t1 = T;
        
        const activeTime = Math.min(canvasTime, T);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        const centerY = Math.round(h * 0.63);
        
        drawBackground(ctx, w, h, centerY);
        
        const margin = 70;
        const startX = margin;
        const endX = w - margin;
        const travelWidth = endX - startX;
        
        const splitRatio = t1 / T;
        const splitX = startX + splitRatio * travelWidth;
        
        let posX;
        let isStage1 = true;
        if (activeTime <= t1) {
          const ratio = t1 > 0 ? activeTime / t1 : 1;
          posX = startX + ratio * (splitX - startX);
          isStage1 = true;
        } else {
          const ratio = (T - t1) > 0 ? (activeTime - t1) / (T - t1) : 1;
          posX = splitX + ratio * (endX - splitX);
          isStage1 = false;
        }
        
        drawCar(ctx, posX, centerY - 12, "Car", isStage1 ? '#38bdf8' : '#ec4899', activeTime * 20);
        
        if (isStage1) {
          drawSpeedArrow(ctx, posX, centerY - 50, 25, '#38bdf8', `${eff_r1} km/h`);
        } else {
          drawSpeedArrow(ctx, posX, centerY - 50, 18, '#ec4899', `${r2} km/h`);
        }
        
        drawRuler(ctx, startX, splitX, centerY + 30, `Stage 1: ${(eff_r1 * t1).toFixed(1)} km`, '#38bdf8');
        drawRuler(ctx, splitX, endX, centerY + 30, `Stage 2: ${(r2 * (T - t1)).toFixed(1)} km`, '#ec4899');
      };
    }

    problems.push(prob);
  });

  // Fetch the selected problem details from database
  function getSelectedProblem() {
    return problems.find(p => p.id === state.selectedProblemId);
  }

  // --- DRAWING UTILITIES ---

  // Format a small decimal as a tidy fraction string (e.g. 0.3333 -> "1/3", 0.4167 -> "5/12").
  // Falls back to a rounded decimal if no clean fraction is found within tolerance.
  function fracStr(x) {
    if (Math.abs(x - Math.round(x)) < 1e-4) return String(Math.round(x));
    const sign = x < 0 ? '-' : '';
    const v = Math.abs(x);
    for (let d = 1; d <= 24; d++) {
      const n = v * d;
      if (Math.abs(n - Math.round(n)) < 1e-3) {
        return `${sign}${Math.round(n)}/${d}`;
      }
    }
    return v.toFixed(2);
  }

  // ── Shared Work/Time visualization helper ──────────────────────────────
  // Draws two (or three) people walking TOWARD each other from opposite ends
  // of a single track. They "meet" when the job is fully done. This makes the
  // "working together is faster" idea visible: the gap closes from both ends.
  //
  // opts: {
  //   jobUnitLabel: 'room' | 'job' | 'shed' | 'car' | 'tank' ...   (singular unit of "1 job")
  //   doneLabel:    'ROOM CLEAN!' | 'JOB DONE!' ...                  (banner shown at meeting point)
  //   rateUnit:     'room/h' | 'job/day' | 'sink/min' ...           (displayed under each arrow)
  //   people: [ {name, rate, color, side:'left'|'right'}, ... ]     (1..3 people)
  //   totalTime:    number — simulated time at which the job is complete
  //   canvasTime:   number — current animation time
  //   caption:      string — header text
  // }
  function drawWorkTogether(ctx, canvas, opts) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const n = opts.people.length;
    const totalTime = opts.totalTime;
    const activeTime = Math.min(opts.canvasTime, totalTime * 1.2);

    // Lay out lanes evenly
    const lanes = [];
    if (n === 1) lanes.push(Math.round(h * 0.5));
    else if (n === 2) { lanes.push(Math.round(h * 0.37)); lanes.push(Math.round(h * 0.63)); }
    else { lanes.push(Math.round(h * 0.27)); lanes.push(Math.round(h * 0.5)); lanes.push(Math.round(h * 0.73)); }
    if (n <= 2) drawWorkTrackBackground(ctx, w, h, lanes[0], lanes[1] || lanes[0]);
    else drawWorkTrackBackground3(ctx, w, h, lanes[0], lanes[1], lanes[2]);

    const margin = 80, startX = margin, endX = w - margin;
    const trackW = endX - startX;

    // Total combined rate = sum of individual rates (1 job / totalTime by construction)
    const sumRate = opts.people.reduce((s, p) => s + p.rate, 0) || 1;

    // Meeting point is where the job is done — visually place it at the centre
    // for the 2-person "closing the gap" metaphor; each person covers a share
    // proportional to their rate.
    const meetX = startX + trackW / 2;
    const meetTime = totalTime;

    // Meeting flag at centre
    const topY = Math.min(...lanes) - 28;
    const botY = Math.max(...lanes) + 28;
    if (activeTime >= meetTime * 0.98) {
      ctx.fillStyle = '#22c55e';
      const bw = Math.max(90, ctx.measureText(opts.doneLabel).width + 28);
      ctx.beginPath(); ctx.roundRect(meetX - bw / 2, (topY + botY) / 2 - 11, bw, 22, 6); ctx.fill();
      ctx.fillStyle = '#000000'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(opts.doneLabel, meetX, (topY + botY) / 2 + 4);
    } else {
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(meetX, topY); ctx.lineTo(meetX, botY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('MEET HERE', meetX, topY - 6);
    }

    // Start markers
    ctx.fillStyle = state.theme === 'dark' ? '#94a3b8' : '#475569';
    ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
    const leftPeople = opts.people.filter(p => p.side !== 'right');
    const rightPeople = opts.people.filter(p => p.side === 'right');
    if (leftPeople.length) ctx.fillText(`${opts.jobUnitLabel.toUpperCase()} START`, startX, lanes[leftPeople[0] ? opts.people.indexOf(leftPeople[0]) : 0] - 38);
    if (rightPeople.length) ctx.fillText(`${opts.jobUnitLabel.toUpperCase()} START`, endX, lanes[opts.people.indexOf(rightPeople[0])] - 38);

    // Draw each person walking toward the centre
    opts.people.forEach((person, i) => {
      const laneY = lanes[i];
      const share = person.rate / sumRate;            // fraction of track this person covers
      const traveledFrac = (person.rate * Math.min(activeTime, meetTime)) / 1; // in "job units" so far
      const traveledTrackFrac = Math.min(traveledFrac, share); // clamp to own share
      // map [0, share] -> [startX/endX, meetX]
      let pos;
      if (person.side === 'right') {
        pos = endX - (traveledTrackFrac / share) * (trackW / 2);
      } else {
        pos = startX + (traveledTrackFrac / share) * (trackW / 2);
      }
      const facingLeft = person.side === 'right';
      drawPerson(ctx, pos, laneY, person.name, person.color, activeTime * person.rate * 30, facingLeft);
      const arrowDir = facingLeft ? -28 : 28;
      drawSpeedArrow(ctx, pos, laneY - 56, arrowDir, person.color, `${fracStr(person.rate)} ${opts.rateUnit}`);

      // Share ruler
      const rulerStart = person.side === 'right' ? pos : startX;
      const rulerEnd = person.side === 'right' ? endX : pos;
      drawRuler(ctx, rulerStart, rulerEnd, laneY + 30, `${fracStr(person.rate * Math.min(activeTime, meetTime))} ${opts.jobUnitLabel}`, person.color);
    });

    // Combined job progress bar
    const jobPct = Math.min(sumRate * activeTime / 1 * 100, 100);
    drawJobProgressBar(ctx, w, h, jobPct, '#4ade80');

    // Header caption
    ctx.fillStyle = state.theme === 'dark' ? '#f1f5f9' : '#1e293b';
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(opts.caption, w / 2, 22);
  }

  // Standard Ground and Background
  function drawBackground(ctx, w, h, centerY) {
    ctx.clearRect(0, 0, w, h);
    
    // Draw sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, centerY);
    const isDark = (state.theme === 'dark');
    
    skyGrad.addColorStop(0, isDark ? '#0b1329' : '#e0f2fe');
    skyGrad.addColorStop(1, isDark ? '#1c2541' : '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, centerY);
    
    // Draw stars or clouds
    if (isDark) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      const starOffsets = [
        {x: 50, y: 30}, {x: 180, y: 70}, {x: 320, y: 40}, 
        {x: 480, y: 80}, {x: 650, y: 25}, {x: 750, y: 60}
      ];
      starOffsets.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
        ctx.fill();
      });
    } else {
      // Draw friendly clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      drawCloud(ctx, 120, 60, 30);
      drawCloud(ctx, 550, 50, 40);
    }
    
    // Draw mountains outline (subtle background element)
    ctx.fillStyle = isDark ? '#111827' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(100, centerY - 40);
    ctx.lineTo(220, centerY);
    ctx.lineTo(380, centerY - 60);
    ctx.lineTo(500, centerY);
    ctx.lineTo(680, centerY - 30);
    ctx.lineTo(w, centerY);
    ctx.fill();

    // Draw Ground
    ctx.fillStyle = isDark ? '#1f2937' : '#cbd5e1';
    ctx.fillRect(0, centerY, w, h - centerY);
    
    // Draw Grass line
    ctx.fillStyle = isDark ? '#065f46' : '#86efac';
    ctx.fillRect(0, centerY, w, 6);
    
    // Draw Road/Track line
    ctx.strokeStyle = isDark ? '#374151' : '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, centerY + 18);
    ctx.lineTo(w, centerY + 18);
    ctx.stroke();
  }

  function drawBackground2Lanes(ctx, w, h, lane1Y, lane2Y) {
    ctx.clearRect(0, 0, w, h);
    
    const isDark = (state.theme === 'dark');
    
    // Fill background
    ctx.fillStyle = isDark ? '#0b1329' : '#f1f5f9';
    ctx.fillRect(0, 0, w, h);
    
    // Draw lanes
    const drawLane = (y) => {
      ctx.fillStyle = isDark ? '#1f2937' : '#cbd5e1';
      ctx.fillRect(0, y - 20, w, 40);
      
      // Middle line
      ctx.strokeStyle = isDark ? '#4b5563' : '#94a3b8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
      
      // Grass boundary above/below
      ctx.fillStyle = isDark ? '#065f46' : '#86efac';
      ctx.fillRect(0, y - 23, w, 3);
      ctx.fillRect(0, y + 20, w, 3);
    };
    
    drawLane(lane1Y);
    drawLane(lane2Y);
    
    // Sidebar signpost labels
    ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("LANE 1 (Terry / Runner 1)", 15, lane1Y - 28);
    ctx.fillText("LANE 2 (Sally / Runner 2)", 15, lane2Y - 28);
  }

  // Draw water scene for canoe roundtrip
  function drawWaterBackground(ctx, w, h, centerY) {
    ctx.clearRect(0, 0, w, h);
    const isDark = (state.theme === 'dark');
    
    // Sky
    ctx.fillStyle = isDark ? '#0c1a30' : '#bae6fd';
    ctx.fillRect(0, 0, w, centerY - 20);
    
    // Mountains
    ctx.fillStyle = isDark ? '#080f1e' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(0, centerY - 20);
    ctx.lineTo(150, centerY - 70);
    ctx.lineTo(350, centerY - 20);
    ctx.lineTo(550, centerY - 90);
    ctx.lineTo(w, centerY - 20);
    ctx.fill();

    // River
    const waterGrad = ctx.createLinearGradient(0, centerY - 20, 0, h);
    waterGrad.addColorStop(0, isDark ? '#1d4ed8' : '#38bdf8');
    waterGrad.addColorStop(1, isDark ? '#1e3a8a' : '#0284c7');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, centerY - 20, w, h - centerY + 20);
    
    // Water ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (let y = centerY; y < h; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 40) {
        ctx.quadraticCurveTo(x + 20, y - 4, x + 40, y);
      }
      ctx.stroke();
    }
  }

  // Draw work/time 2-lane track background
  function drawWorkTrackBackground(ctx, w, h, lane1Y, lane2Y) {
    ctx.clearRect(0, 0, w, h);
    const isDark = (state.theme === 'dark');
    ctx.fillStyle = isDark ? '#0b1329' : '#f0f9ff';
    ctx.fillRect(0, 0, w, h);
    [lane1Y, lane2Y].forEach(y => {
      ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
      ctx.fillRect(0, y - 22, w, 44);
      ctx.strokeStyle = isDark ? '#4b5563' : '#94a3b8';
      ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#065f46' : '#86efac';
      ctx.fillRect(0, y - 25, w, 3);
      ctx.fillRect(0, y + 22, w, 3);
    });
  }

  // Draw work/time 3-lane track background
  function drawWorkTrackBackground3(ctx, w, h, lane1Y, lane2Y, lane3Y) {
    ctx.clearRect(0, 0, w, h);
    const isDark = (state.theme === 'dark');
    ctx.fillStyle = isDark ? '#0b1329' : '#f0f9ff';
    ctx.fillRect(0, 0, w, h);
    [lane1Y, lane2Y, lane3Y].forEach(y => {
      ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
      ctx.fillRect(0, y - 16, w, 32);
      ctx.strokeStyle = isDark ? '#4b5563' : '#94a3b8';
      ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = isDark ? '#065f46' : '#86efac';
      ctx.fillRect(0, y - 18, w, 2);
      ctx.fillRect(0, y + 16, w, 2);
    });
  }

  // Draw job completion progress bar at bottom of canvas
  function drawJobProgressBar(ctx, w, h, pct, color) {
    const barH = 12, barY = h - 26, barX = 80, barW = w - 160;
    const isDark = (state.theme === 'dark');
    ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
    ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 6); ctx.fill();
    const fillW = Math.max(0, Math.min(pct / 100, 1) * barW);
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
      grad.addColorStop(0, color); grad.addColorStop(1, '#22d3ee');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.roundRect(barX, barY, fillW, barH, 6); ctx.fill();
    }
    ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
    ctx.font = 'bold 10px var(--font-mono)'; ctx.textAlign = 'center';
    ctx.fillText(`Job Progress: ${Math.min(pct, 100).toFixed(1)}%`, w / 2, barY - 5);
  }

  // Draw animated water tank for fill/drain problems
  function drawTankVisualization(ctx, w, h, fillLevel, inRate, outRate, timeUnit) {
    const isDark = (state.theme === 'dark');
    const tankW = 150, tankH = 160;
    const tankX = w / 2 - tankW / 2, tankY = h / 2 - tankH / 2 - 10;
    ctx.fillStyle = isDark ? '#1e293b' : '#f8fafc';
    ctx.strokeStyle = isDark ? '#475569' : '#94a3b8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(tankX, tankY, tankW, tankH, 8); ctx.fill(); ctx.stroke();
    const waterH = Math.max(0, Math.min(fillLevel, 1)) * (tankH - 10);
    if (waterH > 0) {
      const waterY = tankY + tankH - 5 - waterH;
      const waterGrad = ctx.createLinearGradient(tankX, waterY, tankX, waterY + waterH);
      waterGrad.addColorStop(0, 'rgba(56,189,248,0.65)'); waterGrad.addColorStop(1, 'rgba(2,132,199,0.9)');
      ctx.fillStyle = waterGrad;
      ctx.beginPath(); ctx.roundRect(tankX + 3, waterY, tankW - 6, waterH, [0, 0, 5, 5]); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(tankX + 5, waterY + 5); ctx.lineTo(tankX + tankW - 5, waterY + 5); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = isDark ? '#f1f5f9' : '#1e293b'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(`${(Math.min(fillLevel, 1) * 100).toFixed(1)}% Full`, tankX + tankW / 2, tankY - 12);
    if (inRate > 0) {
      ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tankX + 28, tankY - 28); ctx.lineTo(tankX + 28, tankY + 2); ctx.stroke();
      ctx.fillStyle = '#22c55e'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`+${inRate.toFixed(1)}/${timeUnit}`, tankX + 28, tankY - 33);
    }
    if (outRate > 0) {
      ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tankX + tankW - 28, tankY + tankH - 2); ctx.lineTo(tankX + tankW - 28, tankY + tankH + 25); ctx.stroke();
      ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`-${outRate.toFixed(1)}/${timeUnit}`, tankX + tankW - 28, tankY + tankH + 38);
    }
  }

  // Draw simple cloud
  function drawCloud(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.6, y - size * 0.3, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size * 1.2, y, size * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Person
  function drawPerson(ctx, x, y, name, color, cycleTime, facingLeft = false) {
    const isDark = (state.theme === 'dark');
    
    ctx.save();
    ctx.translate(x, y - 25); // Set origin to hips
    
    // Walking leg animation using sine waves
    const legSwing = Math.sin(cycleTime) * 12;
    
    // Legs
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    
    // Left Leg
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(legSwing, 25);
    ctx.stroke();
    
    // Right Leg
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-legSwing, 25);
    ctx.stroke();
    
    // Torso
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -20);
    ctx.stroke();
    
    // Arms
    const armSwing = Math.sin(cycleTime + Math.PI) * 10;
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(armSwing, -5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(-armSwing, -5);
    ctx.stroke();
    
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, -28, 7, 0, Math.PI * 2);
    ctx.fill();
    
    // Label text
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, 0, -42);
    
    ctx.restore();
  }

  // Draw Person on Vehicle (Bike or Scooter)
  function drawPersonOnVehicle(ctx, x, y, name, color, cycleTime, vehicleType = 'bike', facingLeft = false) {
    const isDark = (state.theme === 'dark');
    
    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) {
      ctx.scale(-1, 1);
    }
    
    // Draw Vehicle base
    if (vehicleType === 'bike') {
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 3;
      // Frame
      ctx.beginPath();
      ctx.moveTo(-15, -10); // Back wheel hub
      ctx.lineTo(0, -10);   // Crank
      ctx.lineTo(12, -22);  // Stem
      ctx.lineTo(-6, -22);  // Seat post
      ctx.lineTo(-15, -10); // Tri back
      ctx.moveTo(0, -10);
      ctx.lineTo(-6, -22);  // seat tube
      ctx.moveTo(12, -22);
      ctx.lineTo(0, -10);   // down tube
      ctx.stroke();
      
      // Handlebars
      ctx.strokeStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(12, -22);
      ctx.lineTo(12, -28);
      ctx.lineTo(8, -28);
      ctx.stroke();
      
      // Wheels
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      
      ctx.beginPath();
      ctx.arc(-15, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(15, -10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (vehicleType === 'scooter') {
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 3;
      // Deck
      ctx.beginPath();
      ctx.moveTo(-18, -6);
      ctx.lineTo(12, -6);
      ctx.lineTo(15, -24); // Steering column
      ctx.lineTo(10, -24); // Handles
      ctx.stroke();
      
      // Small wheels
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-15, -6, 4, 0, Math.PI*2);
      ctx.arc(12, -6, 4, 0, Math.PI*2);
      ctx.fill();
    } else if (vehicleType === 'runner') {
      // Just drawn as a person running fast
      ctx.restore();
      drawPerson(ctx, x, y, name, color, cycleTime, facingLeft);
      return;
    }
    
    // Draw Rider (Person simplified sitting on bike)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    // Back to seat
    ctx.beginPath();
    ctx.moveTo(-6, -23); // Seat
    ctx.lineTo(-4, -36); // Torso
    ctx.lineTo(8, -32);  // Arm reaching to bars
    ctx.stroke();
    
    // Head
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-3, -44, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // Leg/Pedal animation (cycling cycle)
    const pedalAngle = cycleTime;
    const pedalX = Math.cos(pedalAngle) * 5;
    const pedalY = -10 + Math.sin(pedalAngle) * 5;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(-6, -23); // Hip
    ctx.lineTo(pedalX, pedalY); // Foot
    ctx.stroke();
    
    ctx.restore();
    
    // Draw Label text correctly regardless of flip
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - 48);
  }

  // Draw Car
  function drawCar(ctx, x, y, name, color, animSpin, facingLeft = false) {
    const isDark = (state.theme === 'dark');
    
    ctx.save();
    ctx.translate(x, y);
    if (facingLeft) {
      ctx.scale(-1, 1);
    }
    
    // Car Body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-24, -14, 48, 14, [4, 4, 1, 1]);
    ctx.fill();
    
    // Car Roof / Cabin
    ctx.fillStyle = isDark ? '#0f172a' : '#bae6fd';
    ctx.beginPath();
    ctx.roundRect(-14, -24, 26, 12, [5, 5, 0, 0]);
    ctx.fill();
    
    // Windows separator line
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-2, -24);
    ctx.lineTo(-2, -14);
    ctx.stroke();
    
    // Wheels
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    
    // Front wheel
    ctx.beginPath();
    ctx.arc(14, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Back wheel
    ctx.beginPath();
    ctx.arc(-14, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Spokes spin animation
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const drawSpokes = (wx, wy) => {
      ctx.beginPath();
      ctx.moveTo(wx - Math.cos(animSpin) * 5, wy - Math.sin(animSpin) * 5);
      ctx.lineTo(wx + Math.cos(animSpin) * 5, wy + Math.sin(animSpin) * 5);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(wx - Math.sin(animSpin) * 5, wy + Math.cos(animSpin) * 5);
      ctx.lineTo(wx + Math.sin(animSpin) * 5, wy - Math.cos(animSpin) * 5);
      ctx.stroke();
    };
    
    drawSpokes(14, 0);
    drawSpokes(-14, 0);
    
    ctx.restore();
    
    // Label text
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - 30);
  }

  // Draw Canoe
  function drawCanoe(ctx, x, y, name, color, animSpin, facingLeft = true) {
    const isDark = (state.theme === 'dark');
    
    ctx.save();
    ctx.translate(x, y);
    if (!facingLeft) {
      ctx.scale(-1, 1); // Flip horizontal if heading right (wait, downstream is right)
    }
    
    // Boat hull (semi ellipse)
    ctx.fillStyle = '#d97706'; // Wooden canoe
    ctx.beginPath();
    ctx.arc(0, -6, 25, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Seat and passengers
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(-6, -12, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -12, 4.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Paddlers bodies
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-6, -8);
    ctx.lineTo(-6, -2);
    ctx.moveTo(8, -8);
    ctx.lineTo(8, -2);
    ctx.stroke();
    
    // Paddle oar animation
    const paddleTilt = Math.sin(animSpin) * 0.4;
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(8 - Math.sin(paddleTilt) * 16, 4 + Math.cos(paddleTilt) * 6);
    ctx.stroke();
    
    ctx.restore();
    
    // Label
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(name, x, y - 20);
  }

  // Draw campsites
  function drawCamp(ctx, x, y, label, color) {
    const isDark = (state.theme === 'dark');
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y - 20);
    ctx.lineTo(x - 12, y - 20);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x + 12, y - 20);
    ctx.stroke();
    
    // Text label
    ctx.fillStyle = isDark ? '#ffffff' : '#000000';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 14);
  }

  // Vector Speed Arrow
  function drawSpeedArrow(ctx, x, y, dx, color, text) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y);
    ctx.stroke();
    
    // Arrowhead
    ctx.beginPath();
    if (dx > 0) {
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx - 6, y - 4);
      ctx.lineTo(x + dx - 6, y + 4);
    } else {
      ctx.moveTo(x + dx, y);
      ctx.lineTo(x + dx + 6, y - 4);
      ctx.lineTo(x + dx + 6, y + 4);
    }
    ctx.closePath();
    ctx.fill();
    
    // Arrow Label
    ctx.font = '9px var(--font-mono)';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + dx/2, y - 8);
  }

  // Bracket Ruler for distances
  function drawRuler(ctx, x1, x2, y, text, color) {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 1.5;
    
    ctx.beginPath();
    ctx.moveTo(x1, y - 5);
    ctx.lineTo(x1, y + 5);
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.moveTo(x2, y - 5);
    ctx.lineTo(x2, y + 5);
    ctx.stroke();
    
    // Label in the middle
    ctx.font = '10px var(--font-mono)';
    ctx.textAlign = 'center';
    // Draw background label box for readability
    const textWidth = ctx.measureText(text).width + 8;
    ctx.fillStyle = (state.theme === 'dark') ? '#1e293b' : '#f1f5f9';
    ctx.fillRect((x1 + x2)/2 - textWidth/2, y - 7, textWidth, 14);
    
    ctx.fillStyle = color;
    ctx.fillText(text, (x1 + x2)/2, y + 3);
  }

  // --- UI GENERATORS & UPDATERS ---

  // Re-generate list items in the sidebar
  function renderProblemList() {
    problemListContainer.innerHTML = '';
    
    // Filter list
    const filtered = problems.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
                            p.text.toLowerCase().includes(state.searchQuery.toLowerCase());
      
      const isCorrectMode = (state.mode === 'examples' && p.isExample) || 
                            (state.mode === 'practice' && !p.isExample);
                            
      const isCorrectCategory = (state.activeCategory === 'all' || p.category === state.activeCategory);
      
      return matchesSearch && isCorrectMode && isCorrectCategory;
    });

    if (filtered.length === 0) {
      problemListContainer.innerHTML = '<div class="problem-preview" style="padding: 12px; text-align: center;">No matching problems found.</div>';
      return;
    }

    filtered.forEach(p => {
      const item = document.createElement('div');
      item.className = `problem-item ${state.selectedProblemId === p.id ? 'active' : ''}`;
      item.dataset.id = p.id;
      
      // Category tag label
      let tagLabel = p.category;
      if (p.category === 'opposite') tagLabel = 'Opposite';
      if (p.category === 'roundtrip') tagLabel = 'Round Trip';
      if (p.category === 'catchup') tagLabel = 'Catch Up';
      if (p.category === 'split') tagLabel = 'Split';
      if (p.category === 'worktime') tagLabel = 'Work/Time';
      
      item.innerHTML = `
        <div class="problem-item-header">
          <span class="problem-number">${p.title}</span>
          <span class="problem-tag tag-${p.category}">${tagLabel}</span>
        </div>
        <p class="problem-preview">${p.text.replace(/<[^>]*>/g, '')}</p>
      `;
      
      item.addEventListener('click', () => {
        selectProblem(p.id);
      });
      
      problemListContainer.appendChild(item);
    });
  }

  // Select a problem and reset controls
  function selectProblem(id) {
    state.selectedProblemId = id;
    state.isPlaying = false;
    state.animationTime = 0;
    state.customParams = {};
    
    // Reset play icon
    playPauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    
    // Highlight list
    const items = problemListContainer.querySelectorAll('.problem-item');
    items.forEach(item => {
      if (item.dataset.id === id) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    const prob = getSelectedProblem();
    if (!prob) return;
    
    // Initialize custom variables with defaults
    Object.assign(state.customParams, prob.defaultParams);
    
    // Rebuild UI panels
    problemTitleDisplay.textContent = prob.title;
    problemTextDisplay.innerHTML = prob.text;
    
    // Generate sliders
    buildSliders(prob);
    
    // Recalculate and update math table & explanation
    updateMathOutput();
    
    // Setup timeline slider max based on time parameters
    updateTimelineControls();
    
    // Trigger redrawing
    requestRedraw();
  }

  // Set up timeline limit according to the time variable of the problem
  function updateTimelineControls() {
    const prob = getSelectedProblem();
    const solved = prob.solver(state.customParams);
    
    // Max animation time depends on the problem context
    let maxHours = 5.0;
    if (prob.category === 'opposite') {
      maxHours = solved.calculatedValues.t * 1.15;
    } else if (prob.category === 'roundtrip') {
      maxHours = solved.calculatedValues.T;
    } else if (prob.category === 'catchup') {
      maxHours = solved.calculatedValues.t1 * 1.15;
    } else if (prob.category === 'split') {
      maxHours = solved.calculatedValues.T;
    } else if (prob.category === 'worktime') {
      maxHours = solved.calculatedValues.maxTime * 1.2;
    }
    
    const timeUnit = prob.id === 'q-22' ? 's' : (prob.timeUnit || 'h');
    timelineSlider.min = "0";
    timelineSlider.max = maxHours.toFixed(2);
    timelineSlider.step = (maxHours / 100).toFixed(4);
    timelineSlider.value = "0";
    
    timelineValDisplay.textContent = `0.00 ${timeUnit}`;
  }

  // Create Parameter Sliders in the Playground Card
  function buildSliders(prob) {
    slidersContainer.innerHTML = '';
    
    prob.sliders.forEach(slider => {
      const container = document.createElement('div');
      container.className = 'slider-group';
      
      const key = slider.key;
      const initialVal = state.customParams[key];
      
      container.innerHTML = `
        <div class="slider-group-header">
          <span class="slider-label">${slider.label}</span>
          <span class="slider-val-display" id="val-${key}">${initialVal} ${slider.unit}</span>
        </div>
        <input type="range" class="slider" id="slider-${key}" min="${slider.min}" max="${slider.max}" step="${slider.step}" value="${initialVal}">
        ${slider.desc ? `<div class="slider-desc">${slider.desc}</div>` : ''}
      `;
      
      // Slider movement listener
      const inputEl = container.querySelector('input');
      inputEl.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        state.customParams[key] = val;
        document.getElementById(`val-${key}`).textContent = `${val} ${slider.unit}`;
        
        // Recalculate formulas and redraw
        updateMathOutput();
        updateTimelineControls();
        state.animationTime = 0; // Reset animation
        requestRedraw();
      });
      
      slidersContainer.appendChild(container);
    });
  }

  // Update algebraic steps, tables, final answers
  function updateMathOutput() {
    const prob = getSelectedProblem();
    const result = prob.solver(state.customParams);
    
    // 1. Populate rate table
    mathTableBody.innerHTML = '';
    result.table.forEach((row, i) => {
      const tr = document.createElement('tr');
      if (i === 0) tr.className = 'highlighted';
      tr.innerHTML = `
        <td><b>${row.name}</b></td>
        <td><span class="math-expr">${row.rate}</span></td>
        <td><span class="math-expr">${row.time}</span></td>
        <td><span class="math-expr">${row.dist}</span></td>
      `;
      mathTableBody.appendChild(tr);
    });
    
    // 2. Populate Step-by-Step explanation
    stepsContainer.innerHTML = '';
    result.steps.forEach((step, i) => {
      const item = document.createElement('div');
      item.className = `step-item ${i === 0 ? 'active' : ''}`;
      
      // Formatting equation with standard html tags (supports nested lines)
      let cleanEq = step.eq;
      cleanEq = cleanEq.replace(/\\\\/g, '<br>'); // Handles line breaks
      cleanEq = cleanEq.replace(/\\quad/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
      cleanEq = cleanEq.replace(/\\text{(.*?)}/g, '<span>$1</span>');
      cleanEq = cleanEq.replace(/\\frac{(.*?)}{(.*?)}/g, '<span class="math-fraction"><span class="math-numerator">$1</span><span class="math-denominator">$2</span></span>');
      
      item.innerHTML = `
        <div class="step-number">${i + 1}</div>
        <div class="step-content">
          <div class="step-title">${step.title}</div>
          <div class="step-desc">${step.desc}</div>
          <div class="step-equation">${cleanEq}</div>
        </div>
      `;
      stepsContainer.appendChild(item);
    });
    
    // 3. Final answer box
    finalAnswerValDisplay.textContent = result.finalAnswer;
    
    // 4. Update quiz prompt
    quizPrompt.textContent = result.quiz.prompt;
    quizUnits.textContent = result.quiz.unit;
    quizInput.value = '';
    quizFeedback.style.display = 'none';
  }

  // --- ANIMATION LOOP MANAGER ---

  function requestRedraw() {
    const prob = getSelectedProblem();
    if (!prob) return;
    
    // Keep canvas scaling appropriate for HighDPI screens
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    // Draw
    const timeSliderMax = parseFloat(timelineSlider.max) || 1.0;
    const progress = Math.min(state.animationTime / timeSliderMax, 1.0);
    
    prob.draw(ctx, state.animationTime, state.customParams, progress);
  }

  let lastTimestamp = 0;
  function animationTick(timestamp) {
    if (!state.isPlaying) return;
    
    if (!lastTimestamp) lastTimestamp = timestamp;
    const elapsedSecs = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;
    
    // Scale animation speed per wall-clock second
    const prob = getSelectedProblem();
    const isSecs = (prob.id === 'q-22');
    const isMin = (prob.timeUnit === 'min');
    const isDays = (prob.timeUnit === 'days');
    // Speed factor: simulated time-units per real second
    const speedFactor = isSecs ? 5 : isMin ? 3 : isDays ? 0.08 : 0.4;
    
    state.animationTime += elapsedSecs * speedFactor * state.speedMultiplier;
    
    // Clamp to max time limit
    const timeLimit = parseFloat(timelineSlider.max);
    if (state.animationTime >= timeLimit) {
      state.animationTime = timeLimit;
      state.isPlaying = false;
      playPauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }
    
    // Update timeline values
    const unit = isSecs ? 's' : (prob.timeUnit || 'h');
    timelineSlider.value = state.animationTime.toFixed(4);
    timelineValDisplay.textContent = `${state.animationTime.toFixed(2)} ${unit}`;
    
    requestRedraw();
    
    state.animationFrameId = requestAnimationFrame(animationTick);
  }

  // --- EVENTS BINDING ---

  // Play / Pause Button click
  playPauseBtn.addEventListener('click', () => {
    state.isPlaying = !state.isPlaying;
    
    if (state.isPlaying) {
      // Switch icon to pause (double bar)
      playPauseIcon.innerHTML = '<rect x="4" y="3" width="4" height="18"></rect><rect x="14" y="3" width="4" height="18"></rect>';
      // Reset timestamp to avoid time jump
      lastTimestamp = 0;
      state.animationFrameId = requestAnimationFrame(animationTick);
    } else {
      // Switch icon to play
      playPauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      if (state.animationFrameId) {
        cancelAnimationFrame(state.animationFrameId);
      }
    }
  });

  // Reset Button click
  resetBtn.addEventListener('click', () => {
    state.animationTime = 0;
    timelineSlider.value = "0";
    const prob = getSelectedProblem();
    const resetUnit = prob.id === 'q-22' ? 's' : (prob.timeUnit || 'h');
    timelineValDisplay.textContent = `0.00 ${resetUnit}`;
    
    requestRedraw();
  });

  // Manual scrub on timeline slider
  timelineSlider.addEventListener('input', (e) => {
    state.animationTime = parseFloat(e.target.value);
    const prob = getSelectedProblem();
    const scrubUnit = prob.id === 'q-22' ? 's' : (prob.timeUnit || 'h');
    timelineValDisplay.textContent = `${state.animationTime.toFixed(2)} ${scrubUnit}`;
    
    requestRedraw();
  });

  // Playback speed multiplier selector
  speedMultiplierSelect.addEventListener('change', (e) => {
    state.speedMultiplier = parseFloat(e.target.value);
  });

  // Search filter box
  searchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderProblemList();
  });

  // Category filter buttons
  categoryFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      state.activeCategory = btn.dataset.category;
      renderProblemList();
    });
  });

  // Mode Selection: Examples vs Practice
  modeExamplesBtn.addEventListener('click', () => {
    modeExamplesBtn.classList.add('active');
    modePracticeBtn.classList.remove('active');
    state.mode = 'examples';
    state.selectedProblemId = 'ex-1';
    renderProblemList();
    selectProblem('ex-1');
  });

  modePracticeBtn.addEventListener('click', () => {
    modePracticeBtn.classList.add('active');
    modeExamplesBtn.classList.remove('active');
    state.mode = 'practice';
    state.selectedProblemId = 'q-1';
    renderProblemList();
    selectProblem('q-1');
  });

  // Theme Toggler
  themeToggleBtn.addEventListener('click', () => {
    const isDark = (state.theme === 'dark');
    state.theme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', state.theme);
    
    // Update SVG icon representation
    if (state.theme === 'light') {
      themeIcon.innerHTML = `
        <!-- Sun Icon -->
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      themeIcon.innerHTML = `
        <!-- Moon Icon -->
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
    
    requestRedraw();
  });

  // Quiz submission validator
  quizSubmitBtn.addEventListener('click', () => {
    const prob = getSelectedProblem();
    const result = prob.solver(state.customParams);
    
    const userVal = parseFloat(quizInput.value);
    const correctVal = result.quiz.answer;
    
    quizFeedback.className = 'quiz-feedback';
    
    if (isNaN(userVal)) {
      quizFeedback.textContent = "Please enter a numeric answer!";
      quizFeedback.classList.add('feedback-error');
      return;
    }
    
    // Allow small float tolerance (0.05)
    const margin = 0.05;
    if (Math.abs(userVal - correctVal) <= margin) {
      quizFeedback.textContent = `Correct! Well done. The answer is ${correctVal} ${result.quiz.unit}.`;
      quizFeedback.classList.add('feedback-success');
    } else {
      quizFeedback.textContent = `Try again! (Hint: Look at the final value in the algebraic step-by-step box).`;
      quizFeedback.classList.add('feedback-error');
    }
  });

  // Handle resizing of canvas
  state.canvasResizeObserver = new ResizeObserver(() => {
    requestRedraw();
  });
  state.canvasResizeObserver.observe(canvas);

  // Initialize App on startup
  renderProblemList();
  selectProblem('ex-1');
});
