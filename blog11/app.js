const app = document.querySelector("#app");
const modal = document.querySelector("#application");
const searchSlot = document.querySelector("#search-slot");
const defaults = {
  query: "remote entry-level software engineer", location: "United States",
  experience: "Entry level", date: "", company: "", type: "", sort: "Relevant",
};
const symbols = {
  search: '<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4 4"/>',
  pin: '<path d="M20 10c0 5-8 10-8 10s-8-5-8-10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/>',
  chevron: '<path d="m7 10 5 5 5-5"/>',
  brief: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12a22 22 0 0 0 18 0"/>',
  bookmark: '<path d="M6 4h12v16l-6-4-6 4V4Z"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  file: '<path d="M6 3h8l4 4v14H6zM14 3v5h4M9 13h6m-6 4h6"/>',
};
const icon = name => '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + symbols[name] + "</svg>";
const escapeText = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

let filters = { ...defaults };
try { filters = { ...defaults, ...JSON.parse(sessionStorage.getItem("jobboard-search")) }; }
catch { /* Use the default search if the session data is invalid. */ }
let saved = readJobs("jobboard-saved");
let applied = readJobs("jobboard-applied");
let myTab = "saved";
let searchOrigin = "";
let hasRendered = false;
let lastHash = location.hash;
history.scrollRestoration = "manual";

function saveSearch() {
  sessionStorage.setItem("jobboard-search", JSON.stringify(filters));
}

function logo(job) {
  return `<span class="company-mark ${job.tone}" aria-hidden="true"><i class="mark-${job.mark}"></i></span>`;
}

function select(key, label, options) {
  const value = filters[key];
  return `<label class="select-pill ${value && key !== "sort" ? "selected" : ""}">
    <select aria-label="${label}" data-filter="${key}">${options.map(([optionValue, text]) =>
      `<option value="${optionValue}" ${optionValue === value ? "selected" : ""}>${text}</option>`).join("")}</select>
    ${icon("chevron")}
  </label>`;
}

function jobCard(job) {
  const hasApplied = applied.includes(job.id);
  return `<article class="job-card">
    <a class="job-link" href="#job/${job.id}">${logo(job)}
      <div class="job-copy">
        <h3>${job.title}</h3>
        <p>${job.company}</p>
        <p class="job-location">${job.location}</p>
        <div class="card-meta"><span>${job.type}</span><span>${job.age === 1 ? "1 day ago" : job.age + " days ago"}</span></div>
      </div>
    </a>
    <div class="card-actions">
      <button class="button button-outline card-apply" data-apply="${job.id}" ${hasApplied ? "disabled" : ""}>${hasApplied ? "Applied" : "Apply"}</button>
    </div>
  </article>`;
}

function matchingJobs() {
  const keywords = filters.query.toLowerCase().replace(/\b(?:remote|entry[ -]level|jobs?|in|for|a|an)\b/g, "")
    .trim().split(/\s+/).filter(Boolean);
  const location = filters.location.trim().toLowerCase();
  const anywhereInUS = ["", "united states", "usa", "us", "u.s.", "u.s.a."].includes(location);
  const matching = jobs.filter(job => {
    const titleAndCompany = (job.title + " " + job.company).toLowerCase();
    return keywords.every(keyword => titleAndCompany.includes(keyword)) &&
      (anywhereInUS || job.location.toLowerCase().includes(location)) &&
      (!filters.experience || job.experience === filters.experience) &&
      (!filters.company || job.company === filters.company) &&
      (!filters.type || job.type === filters.type) &&
      (!filters.date || job.age <= Number(filters.date));
  });
  return filters.sort === "Recent" ? matching.sort((a, b) => a.age - b.age) : matching;
}

function resultList() {
  const matches = matchingJobs();
  return `<div class="results-heading">
      <div><h1 id="results-title">Search results</h1><p id="results-count" role="status">${matches.length} ${matches.length === 1 ? "job" : "jobs"}${filters.location ? " · " + escapeText(filters.location) : ""}</p></div>
      <div class="sort"><span>Sort by</span>${select("sort", "Sort by", [["Relevant", "Most relevant"], ["Recent", "Most recent"]])}</div>
    </div>
    <div class="job-list">${matches.length ? matches.map(jobCard).join("") : `<div class="empty"><h2>No jobs found</h2><p>Try a different title, location or combination of filters.</p><button class="button button-outline" data-action="clear-all">Reset search</button></div>`}</div>`;
}

function searchForm() {
  return `<form id="search-form" class="search-form" role="search">
    <label>${icon("search")}<span class="sr-only">Job title or keyword</span><input name="query" value="${escapeText(filters.query)}" placeholder="Job title or keyword" autocomplete="off"></label>
    <label>${icon("pin")}<span class="sr-only">Location</span><input name="location" value="${escapeText(filters.location)}" placeholder="Location" autocomplete="off"></label>
    <button class="button search-button" type="submit">Search<span class="sr-only"> jobs</span></button>
  </form>`;
}

function searchView() {
  const companies = jobs.map(job => job.company).sort();
  return `<div class="filter-strip">
    <div class="shell filter-bar" role="group" aria-label="Job filters">
      <span class="jobs-category">Jobs</span>
      ${select("date", "Date posted", [["", "Date posted"], ["1", "Past 24 hours"], ["7", "Past week"], ["30", "Past month"]])}
      ${select("experience", "Experience level", [["", "Experience level"], ["Entry level", "Entry level"], ["Internship", "Internship"], ["Mid level", "Mid level"]])}
      ${select("company", "Company", [["", "Company"], ...companies.map(company => [company, company])])}
      ${select("type", "Job type", [["", "Job type"], ["Full-time", "Full-time"], ["Contract", "Contract"], ["Internship", "Internship"]])}
      <button class="text-button clear" data-action="clear-filters">Clear filters</button>
    </div>
  </div>
  <div class="shell search-page">
    <div class="results-layout">
      <section id="results" aria-labelledby="results-title">${resultList()}</section>
      <aside class="search-sidebar" aria-label="Your job search">
        <section class="side-card">
          <div class="side-title"><span class="side-icon">${icon("brief")}</span><h2>My jobs</h2></div>
          <a class="text-button side-link" href="#my-jobs">Saved jobs and applications</a>
        </section>
        <section class="side-card recent">
          <h2>Recent search</h2>
          <button type="button" class="recent-search" data-action="restore-search">
            ${icon("clock")}<span>Remote entry-level software engineer<small>United States</small></span>
          </button>
        </section>
      </aside>
    </div>
  </div>`;
}

function jobView(job) {
  const isSaved = saved.includes(job.id);
  const hasApplied = applied.includes(job.id);
  return `<div class="shell detail-page">
    <a class="text-button back-link" href="${searchOrigin}" data-action="back-results">${searchOrigin === "#my-jobs" ? "Back to my jobs" : "Back to results"}</a>
    <article class="detail-card">
      <header class="detail-head">
        <div class="employer-line">${logo(job)}<span>${job.company}</span></div>
        <h1>${job.title}</h1>
        <p class="detail-meta">${job.location} <span>·</span> Posted ${job.age} ${job.age === 1 ? "day" : "days"} ago</p>
        <div class="detail-tags"><span>${job.type}</span><span>${job.experience}</span><span>${job.pay}</span></div>
        <div class="detail-actions">
          <button class="button button-primary" data-apply="${job.id}" ${hasApplied ? "disabled" : ""}>${hasApplied ? "Applied" : "Apply"}</button>
          <button class="button button-outline" data-save="${job.id}" aria-pressed="${isSaved}">${icon("bookmark")} <span>${isSaved ? "Saved" : "Save"}</span></button>
        </div>
      </header>
      <div class="detail-body">
        <section><h2>About the job</h2><p>${job.intro}</p></section>
        <section><h2>What you’ll do</h2><ul>${job.duties.map(duty => `<li>${duty}</li>`).join("")}</ul></section>
        <section><h2>What you’ll bring</h2><p>${job.skills}</p></section>
        <section><h2>Workplace requirements</h2><p>${job.workplace}</p></section>
      </div>
    </article>
  </div>`;
}

function myView() {
  const ids = myTab === "saved" ? saved : applied;
  return `<div class="shell my-page">
    <h1>My jobs</h1>
    <div class="my-tabs" aria-label="My jobs views">
      <button data-tab="saved" aria-pressed="${myTab === "saved"}">Saved (${saved.length})</button>
      <button data-tab="applied" aria-pressed="${myTab === "applied"}">Applied (${applied.length})</button>
    </div>
    <div class="job-list">${ids.length ? ids.map(jobById).filter(Boolean).map(jobCard).join("") :
      `<div class="empty"><h2>${myTab === "saved" ? "No saved jobs yet" : "No applications yet"}</h2><a class="text-button" href="#">Browse jobs</a></div>`}</div>
  </div>`;
}

function render() {
  if (modal.open) modal.close();
  saved = readJobs("jobboard-saved");
  applied = readJobs("jobboard-applied");
  const hash = location.hash;
  lastHash = hash;
  const job = hash.startsWith("#job/") && jobById(hash.slice(5));
  const isMyJobs = hash === "#my-jobs";
  searchOrigin = history.state?.fromMyJobs ? "#my-jobs" : "#";
  document.title = job ? `${job.title} | Jobboard` : `${isMyJobs ? "My jobs" : "Jobs"} | Jobboard`;
  for (const link of document.querySelectorAll("[data-nav]")) {
    if ((link.dataset.nav === "my") === (isMyJobs || Boolean(job && history.state?.fromMyJobs))) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  searchSlot.innerHTML = searchForm();
  app.innerHTML = job ? jobView(job) : isMyJobs ? myView() : searchView();
  if (hasRendered || hash) {
    window.scrollTo(0, 0);
    const title = app.querySelector("h1");
    title.tabIndex = -1;
    title.focus({ preventScroll: true });
  }
  hasRendered = true;
}

function updateResults() {
  const results = document.querySelector("#results");
  results.innerHTML = resultList();
}

function showApplication(job) {
  modal.innerHTML = `<div class="dialog-header"><h2 id="application-title">Apply to ${job.company}</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="Close application">${icon("close")}</button></div>
    <form id="hosted-form" data-job="${job.id}">
      <div class="dialog-body">
        <p class="form-role">${job.title}</p>
        <h3>Contact information</h3>
        <div class="form-fields">
          <label>Full name<input name="name" value="${demoProfile.name}" required autocomplete="off"></label>
          <label>Email address<input name="email" type="email" value="${demoProfile.email}" required autocomplete="off"></label>
        </div>
        <h3>Résumé</h3>
        <label class="file-option"><input type="radio" name="resume" checked required>${icon("file")} ${demoProfile.resume}</label>
      </div>
      <div class="dialog-footer"><button type="button" class="button button-outline" data-action="close-modal">Cancel</button><button class="button button-primary" type="submit">Submit application</button></div>
    </form>`;
  modal.showModal();
}

document.addEventListener("submit", event => {
  if (event.target.id === "search-form") {
    event.preventDefault();
    const form = new FormData(event.target);
    filters.query = form.get("query").trim();
    filters.location = form.get("location").trim();
    saveSearch();
    if (location.hash) location.hash = "";
    else {
      updateResults();
      window.scrollTo(0, 0);
    }
  }
  if (event.target.id === "hosted-form") {
    event.preventDefault();
    const job = jobById(event.target.dataset.job);
    applied = [...new Set([...applied, job.id])];
    writeJobs("jobboard-applied", applied);
    const applyButton = app.querySelector(`[data-apply="${job.id}"]`);
    applyButton.textContent = "Applied";
    applyButton.disabled = true;
    modal.innerHTML = `<div class="dialog-header"><h2 id="application-title">Application submitted</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="Close confirmation">${icon("close")}</button></div>
      <div class="dialog-body"><p>Your simulated application for ${job.title} at ${job.company} is complete.</p></div>
      <div class="dialog-footer"><button class="button button-primary" data-action="close-modal" autofocus>Done</button></div>`;
    modal.querySelector("[autofocus]").focus();
  }
});

app.addEventListener("change", event => {
  const key = event.target.dataset.filter;
  if (!key) return;
  filters[key] = event.target.value;
  saveSearch();
  event.target.parentElement.classList.toggle("selected", Boolean(filters[key]) && key !== "sort");
  if (key === "sort") {
    const matches = matchingJobs();
    if (matches.length) document.querySelector(".job-list").innerHTML = matches.map(jobCard).join("");
  } else updateResults();
});

document.addEventListener("click", event => {
  const target = event.target.closest("button, a");
  if (!target || event.defaultPrevented) return;
  const jobLink = target.matches(".job-link");
  if (jobLink && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault();
    history.pushState({ fromListing: true, fromMyJobs: location.hash === "#my-jobs" }, "", target.getAttribute("href"));
    render();
  }
  if (target.dataset.apply) {
    const job = jobById(target.dataset.apply);
    if (job.route === "hosted") showApplication(job);
    else {
      const query = new URLSearchParams({ job: job.id, from: location.hash });
      location.assign("employer.html?" + query);
    }
  }
  if (target.dataset.save) {
    const id = target.dataset.save;
    const wasSaved = saved.includes(id);
    saved = wasSaved ? saved.filter(jobId => jobId !== id) : [...saved, id];
    writeJobs("jobboard-saved", saved);
    target.setAttribute("aria-pressed", String(!wasSaved));
    target.querySelector("span").textContent = wasSaved ? "Save" : "Saved";
  }
  if (target.dataset.tab) {
    myTab = target.dataset.tab;
    app.innerHTML = myView();
    app.querySelector(`[data-tab="${myTab}"]`).focus();
  }
  switch (target.dataset.action) {
    case "back-results":
      if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && history.state?.fromListing) {
        event.preventDefault();
        history.back();
      }
      break;
    case "close-modal":
      modal.close();
      break;
    case "clear-filters":
      Object.assign(filters, { experience: "", date: "", company: "", type: "" });
      saveSearch();
      for (const select of app.querySelectorAll(".filter-bar select")) {
        select.value = "";
        select.parentElement.classList.remove("selected");
      }
      updateResults();
      break;
    case "restore-search":
    case "clear-all":
      filters = { ...defaults };
      saveSearch();
      render();
      break;
  }
});

modal.addEventListener("click", event => {
  if (event.target === modal) modal.close();
});
modal.addEventListener("close", () => {
  if (document.activeElement === document.body) app.querySelector("h1")?.focus({ preventScroll: true });
});

function onNavigation() {
  if (lastHash === location.hash) return;
  lastHash = location.hash;
  render();
}
window.addEventListener("hashchange", onNavigation);
window.addEventListener("popstate", onNavigation);
window.addEventListener("pageshow", event => {
  if (event.persisted) render();
});
render();
