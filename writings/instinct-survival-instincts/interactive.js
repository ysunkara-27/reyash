(function () {
  const $ = (id) => document.getElementById(id);
  const fmt = {
    money(x, dp) { const sign = x < 0 ? '−' : ''; const a = Math.abs(x); if (dp === undefined) dp = a < 100 ? 2 : 0; return sign + '$' + a.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }); },
    big(x) { const sign = x < 0 ? '−' : ''; const a = Math.abs(x); if (a >= 1e9) return sign + '$' + (a / 1e9).toFixed(a >= 1e10 ? 0 : 1) + 'B'; if (a >= 1e6) return sign + '$' + (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M'; if (a >= 1e3) return sign + '$' + (a / 1e3).toFixed(0) + 'K'; return sign + '$' + a.toFixed(0); },
    int(x) { return Math.round(x).toLocaleString('en-US'); },
  };
  const logMap = (min, max) => ({ from: (v) => min * Math.pow(max / min, v / 100), to: (x) => 100 * Math.log(x / min) / Math.log(max / min) });
  const clearActive = (sel) => document.querySelectorAll(sel).forEach(b => b.classList.remove('is-active'));

  /* ---------------- Unit economics calculator ---------------- */
  (function calculator() {
    const inTasks = $('in-tasks'), inCost = $('in-cost'), inJobs = $('in-jobs'), inJobCost = $('in-jobcost'), inSpend = $('in-spend'), inTake = $('in-take'), inUsers = $('in-users');
    const costMap = logMap(0.01, 20), jobMap = logMap(0.5, 200), usersMap = logMap(1e4, 1e8);
    let costExact = null, jobExact = null;
    const roundUsers = (u) => { const mag = Math.pow(10, Math.floor(Math.log10(u)) - 1); return Math.round(u / mag) * mag; };

    function read() {
      return {
        tasks: +inTasks.value,
        cost: costExact !== null ? costExact : costMap.from(+inCost.value),
        jobs: +inJobs.value,
        jobCost: jobExact !== null ? jobExact : jobMap.from(+inJobCost.value),
        spend: +inSpend.value,
        take: +inTake.value / 100,
        users: roundUsers(usersMap.from(+inUsers.value)),
      };
    }
    function render() {
      const s = read();
      const taskCost = s.tasks * s.cost, jobCost = s.jobs * s.jobCost, cost = taskCost + jobCost;
      const rev = s.spend * s.take, contrib = rev - cost, be = s.take > 0 ? cost / s.take : Infinity, total = contrib * s.users;
      $('out-tasks').textContent = s.tasks;
      $('out-cost').textContent = fmt.money(s.cost, 2);
      $('out-jobs').textContent = s.jobs % 1 === 0 ? s.jobs : s.jobs.toFixed(1);
      $('out-jobcost').textContent = fmt.money(s.jobCost, 2);
      $('out-spend').textContent = fmt.money(s.spend, 0);
      $('out-take').textContent = (s.take * 100).toFixed(1) + '%';
      $('out-users').textContent = fmt.int(s.users);
      $('r-rev').textContent = fmt.money(rev);
      $('r-cost').textContent = fmt.money(cost);
      $('r-cost-sub').textContent = fmt.money(taskCost) + ' tasks + ' + fmt.money(jobCost) + ' jobs';
      const c = $('r-contrib');
      c.textContent = (contrib >= 0 ? '+' : '') + fmt.money(contrib);
      const cls = contrib > 0.005 ? 'pos' : (contrib < -0.005 ? 'neg' : '');
      c.className = cls;
      $('r-contrib-sub').textContent = contrib > 0.005 ? 'makes money on each user' : (contrib < -0.005 ? 'loses money on each user' : 'breaks even on each user');
      $('r-be').textContent = isFinite(be) ? fmt.money(be, be < 100 ? 2 : 0) : 'no take rate, never';
      $('r-total').textContent = fmt.big(total);
      $('r-total').className = cls;
      $('r-total-sub').textContent = 'per month, ' + fmt.big(total * 12) + ' a year';
      const mx = Math.max(cost, rev, 0.01);
      $('bar-cost').style.width = (100 * taskCost / mx) + '%';
      $('bar-jobs').style.width = (100 * jobCost / mx) + '%';
      $('bar-rev').style.width = (100 * rev / mx) + '%';
    }
    const presets = {
      optimistic: { tasks: 40, cost: 0.10, jobs: 0.5, jobCost: 4, spend: 600, take: 4 },
      baseline: { tasks: 50, cost: 0.25, jobs: 1, jobCost: 5, spend: 400, take: 2 },
      pessimistic: { tasks: 60, cost: 0.50, jobs: 2, jobCost: 7.5, spend: 200, take: 1 },
      mymonth: { tasks: 47, cost: 0.79, jobs: 10, jobCost: 24.75, spend: 0, take: 2 },
    };
    function setCost(c) { costExact = c; inCost.value = costMap.to(c).toFixed(2); }
    function setJobCost(c) { jobExact = c; inJobCost.value = jobMap.to(c).toFixed(2); }
    function applyPreset(name) {
      const p = presets[name];
      inTasks.value = p.tasks; setCost(p.cost); inJobs.value = p.jobs; setJobCost(p.jobCost); inSpend.value = p.spend; inTake.value = p.take;
      document.querySelectorAll('.preset[data-preset]').forEach(b => b.classList.toggle('is-active', b.dataset.preset === name));
      render();
    }
    document.querySelectorAll('.preset[data-preset]').forEach(b => b.addEventListener('click', () => applyPreset(b.dataset.preset)));
    $('calc-reset').addEventListener('click', () => { inUsers.value = 50; applyPreset('baseline'); });
    [inTasks, inCost, inJobs, inJobCost, inSpend, inTake, inUsers].forEach(el => el.addEventListener('input', () => {
      if (el === inCost) costExact = null;
      if (el === inJobCost) jobExact = null;
      clearActive('.preset[data-preset]');
      render();
    }));

    // User mix
    const profiles = {
      casual: { tasks: 15, cost: 0.20, jobs: 0, jobCost: 0, spend: 100 },
      regular: { tasks: 60, cost: 0.40, jobs: 1, jobCost: 8, spend: 400 },
      super: { tasks: 150, cost: 0.60, jobs: 8, jobCost: 20, spend: 1200 },
    };
    const mixEls = { casual: $('mix-casual'), regular: $('mix-regular'), super: $('mix-super') };
    function shares() { const r = { casual: +mixEls.casual.value, regular: +mixEls.regular.value, super: +mixEls.super.value }; const sum = r.casual + r.regular + r.super || 1; return { casual: r.casual / sum, regular: r.regular / sum, super: r.super / sum }; }
    function blended() {
      const sh = shares(); let tasks = 0, taskCost = 0, jobs = 0, jobCost = 0, spend = 0;
      for (const k in profiles) { const p = profiles[k]; tasks += sh[k] * p.tasks; taskCost += sh[k] * p.tasks * p.cost; jobs += sh[k] * p.jobs; jobCost += sh[k] * p.jobs * p.jobCost; spend += sh[k] * p.spend; }
      return { tasks, cost: tasks > 0 ? taskCost / tasks : 0, jobs, jobCost: jobs > 0 ? jobCost / jobs : 0, spend };
    }
    function renderMix() {
      const sh = shares();
      $('out-mix-casual').textContent = Math.round(sh.casual * 100) + '%';
      $('out-mix-regular').textContent = Math.round(sh.regular * 100) + '%';
      $('out-mix-super').textContent = Math.round(sh.super * 100) + '%';
      const b = blended();
      $('mix-summary').textContent = 'Blended: ' + Math.round(b.tasks) + ' tasks at ' + fmt.money(b.cost, 2) + ', ' + b.jobs.toFixed(1) + ' jobs at ' + fmt.money(b.jobCost, 2) + ', ' + fmt.money(b.spend, 0) + ' spend';
    }
    Object.values(mixEls).forEach(el => el.addEventListener('input', renderMix));
    $('mix-apply').addEventListener('click', () => {
      const b = blended();
      inTasks.value = Math.round(b.tasks);
      setCost(Math.max(0.01, Math.min(20, b.cost)));
      inJobs.value = Math.round(b.jobs * 2) / 2;
      setJobCost(Math.max(0.5, Math.min(200, b.jobCost || 0.5)));
      inSpend.value = Math.round(b.spend / 10) * 10;
      clearActive('.preset[data-preset]');
      render();
      $('calculator').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    applyPreset('baseline');
    renderMix();
  })();

  /* ---------------- Model pricing simulator ---------------- */
  (function simulator() {
    const MODELS = {
      astra: { name: 'GPT-6 Astra', inp: 10, cached: 1.0, out: 50 },
      sol: { name: 'GPT-6.1 Sol', inp: 2, cached: 0.10, out: 10 },
      luna: { name: 'GPT-6 Luna', inp: 0.10, cached: 0.01, out: 0.50 },
    };
    const stepsMap = logMap(100, 100000), ctxMap = logMap(1000, 200000);
    const el = { steps: $('sim-steps'), long: $('sim-long'), ctx: $('sim-ctx'), cache: $('sim-cache'), out: $('sim-out'), eff: $('sim-eff') };
    let stepsExact = null, ctxExact = null;

    function prices(side) {
      const sel = $('sim-' + side).value;
      if (sel !== 'custom') return Object.assign({}, MODELS[sel]);
      return { name: 'Custom', inp: +$('sim-' + side + '-in').value || 0, cached: +$('sim-' + side + '-cached').value || 0, out: +$('sim-' + side + '-out').value || 0 };
    }
    function stepCost(p, ctx, cacheShare, out) {
      return (ctx * (1 - cacheShare) * p.inp + ctx * cacheShare * p.cached + out * p.out) / 1e6;
    }
    function render() {
      const steps = stepsExact !== null ? stepsExact : Math.round(stepsMap.from(+el.steps.value));
      const ctx = ctxExact !== null ? ctxExact : Math.round(ctxMap.from(+el.ctx.value) / 100) * 100;
      const cache = +el.cache.value / 100, out = +el.out.value, eff = +el.eff.value, longShare = +el.long.value / 100;
      $('out-sim-steps').textContent = fmt.int(steps);
      $('out-sim-long').textContent = Math.round(longShare * 100) + '%';
      $('out-sim-ctx').textContent = fmt.int(ctx) + ' tokens';
      $('out-sim-cache').textContent = Math.round(cache * 100) + '%';
      $('out-sim-out').textContent = fmt.int(out);
      $('out-sim-eff').textContent = eff.toFixed(1) + '×';

      const res = {};
      for (const side of ['a', 'b']) {
        const p = prices(side);
        $('sim-custom-' + side).hidden = $('sim-' + side).value !== 'custom';
        const sc = stepCost(p, ctx, cache, out) / eff;
        const month = sc * steps;
        res[side] = { p, sc, month };
        $('sim-' + side + '-price').textContent = fmt.money(p.inp, 2) + ' in · ' + fmt.money(p.cached, 2) + ' cached · ' + fmt.money(p.out, 2) + ' out, per million tokens';
        $('sim-' + side + '-step').textContent = sc < 0.01 ? '$' + sc.toFixed(4) : fmt.money(sc, sc < 1 ? 3 : 2);
        $('sim-' + side + '-month').textContent = fmt.money(month, month < 100 ? 2 : 0);
        $('sim-' + side + '-year').textContent = fmt.money(month * 12, 0) + ' a year · ' + fmt.money(month * longShare, 0) + ' of it from long-running jobs';
      }
      const mx = Math.max(res.a.month, res.b.month, 1e-9);
      $('sim-a-bar').style.width = (100 * res.a.month / mx) + '%';
      $('sim-b-bar').style.width = (100 * res.b.month / mx) + '%';
      const v = $('sim-verdict');
      if (Math.abs(res.a.month - res.b.month) < 0.005) v.textContent = 'Same cost either way.';
      else {
        const cheap = res.a.month < res.b.month ? 'a' : 'b', dear = cheap === 'a' ? 'b' : 'a';
        const ratio = res[dear].month / Math.max(res[cheap].month, 1e-9);
        v.textContent = res[cheap].p.name + ' runs this month for ' + fmt.money(res[cheap].month, res[cheap].month < 100 ? 2 : 0) + ', ' + (ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)) + '× cheaper than ' + res[dear].p.name + ' at ' + fmt.money(res[dear].month, res[dear].month < 100 ? 2 : 0) + '. The gap is ' + fmt.money(Math.abs(res.a.month - res.b.month), 0) + ' per user per month.';
      }
    }
    const workloads = {
      mymonth: { steps: 14424, long: 92, ctx: 25000, cache: 70, out: 300, eff: 1 },
      casual: { steps: 400, long: 0, ctx: 10000, cache: 80, out: 200, eff: 1 },
      watcher: { steps: 1800, long: 100, ctx: 20000, cache: 90, out: 150, eff: 1 },
    };
    function applyWorkload(name) {
      const w = workloads[name];
      stepsExact = w.steps; el.steps.value = stepsMap.to(w.steps).toFixed(2);
      el.long.value = w.long;
      ctxExact = w.ctx; el.ctx.value = ctxMap.to(w.ctx).toFixed(2);
      el.cache.value = w.cache; el.out.value = w.out; el.eff.value = w.eff;
      document.querySelectorAll('.preset[data-sim]').forEach(b => b.classList.toggle('is-active', b.dataset.sim === name));
      render();
    }
    document.querySelectorAll('.preset[data-sim]').forEach(b => b.addEventListener('click', () => applyWorkload(b.dataset.sim)));
    $('sim-reset').addEventListener('click', () => { $('sim-a').value = 'sol'; $('sim-b').value = 'astra'; applyWorkload('mymonth'); });
    Object.values(el).forEach(x => x.addEventListener('input', () => {
      if (x === el.steps) stepsExact = null;
      if (x === el.ctx) ctxExact = null;
      clearActive('.preset[data-sim]');
      render();
    }));
    ['sim-a', 'sim-b', 'sim-a-in', 'sim-a-cached', 'sim-a-out', 'sim-b-in', 'sim-b-cached', 'sim-b-out'].forEach(id => $(id).addEventListener('input', render));
    applyWorkload('mymonth');
  })();
})();
