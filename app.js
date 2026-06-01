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
    }
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
    
    // Max animation hours depends on the problem context
    let maxHours = 5.0;
    if (prob.category === 'opposite') {
      maxHours = solved.calculatedValues.t * 1.15;
    } else if (prob.category === 'roundtrip') {
      maxHours = solved.calculatedValues.T;
    } else if (prob.category === 'catchup') {
      maxHours = solved.calculatedValues.t1 * 1.15;
    } else if (prob.category === 'split') {
      maxHours = solved.calculatedValues.T;
    }
    
    timelineSlider.min = "0";
    timelineSlider.max = maxHours.toFixed(2);
    timelineSlider.step = (maxHours / 100).toFixed(4);
    timelineSlider.value = "0";
    
    timelineValDisplay.textContent = `0.00 ${prob.id === 'q-22' ? 's' : 'h'}`;
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
    
    // Scale animation speed (hours or seconds simulated per wall second)
    const prob = getSelectedProblem();
    const isSecs = (prob.id === 'q-22');
    // For hours, we make it speed through. E.g., 0.5 hours per wall-clock second
    const speedFactor = isSecs ? 5 : 0.4; // hours per wall-clock second
    
    state.animationTime += elapsedSecs * speedFactor * state.speedMultiplier;
    
    // Clamp to max time limit
    const timeLimit = parseFloat(timelineSlider.max);
    if (state.animationTime >= timeLimit) {
      state.animationTime = timeLimit;
      state.isPlaying = false;
      playPauseIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
    }
    
    // Update timeline values
    timelineSlider.value = state.animationTime.toFixed(4);
    const unit = isSecs ? 's' : 'h';
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
    timelineValDisplay.textContent = `0.00 ${prob.id === 'q-22' ? 's' : 'h'}`;
    
    requestRedraw();
  });

  // Manual scrub on timeline slider
  timelineSlider.addEventListener('input', (e) => {
    state.animationTime = parseFloat(e.target.value);
    const prob = getSelectedProblem();
    timelineValDisplay.textContent = `${state.animationTime.toFixed(2)} ${prob.id === 'q-22' ? 's' : 'h'}`;
    
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
