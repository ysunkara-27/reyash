const query = new URLSearchParams(location.search);
const job = jobById(query.get("job"));
const main = document.querySelector("#employer-content");
const source = query.get("from") || "";
const returnHref = ["", "#my-jobs", "#job/" + job?.id].includes(source) ? "index.html" + source : "index.html";
const returnLink = `<a href="${returnHref}" class="text-button" data-return>Return to Jobboard</a>`;

if (!job || job.route !== "employer") {
  main.innerHTML = `<div class="empty"><h1>Application unavailable</h1>${returnLink}</div>`;
} else {
  document.title = `Apply for ${job.title} | ${job.company} Careers`;
  document.querySelector("#employer-brand").textContent = job.company;
  document.querySelector("#employer-footer").textContent = job.company;
  if (readJobs("jobboard-applied").includes(job.id)) showConfirmation();
  else showForm();
}

function showForm() {
  main.innerHTML = `<div class="employer-intro"><p class="employer-label">Job application</p><h1>${job.title}</h1><p>${job.company} · ${job.location}</p></div>
    <form id="employer-form" class="employer-form">
      <h2>Candidate information</h2>
      <div class="form-fields">
        <label>Full name<input name="name" value="${demoProfile.name}" autocomplete="off" required></label>
        <label>Email address<input name="email" value="${demoProfile.email}" type="email" autocomplete="off" required></label>
      </div>
      <h2>Application questions</h2>
      <div class="form-fields">
        <label>Are you authorized to work in the United States?
          <select name="authorization" aria-label="Are you authorized to work in the United States?" required><option value="">Select an answer</option><option>Yes</option><option>No</option></select>
        </label>
        <label>Why are you interested in this role? <span class="optional">(Optional)</span>
          <textarea name="motivation" rows="3" autocomplete="off" placeholder="Tell us a little about yourself"></textarea>
        </label>
        <label>Résumé
          <select name="resume" required><option>${demoProfile.resume}</option></select>
        </label>
      </div>
      <div class="employer-actions">${returnLink}<button class="button employer-submit" type="submit">Submit application</button></div>
    </form>`;
}

function showConfirmation() {
  main.innerHTML = `<div class="employer-form employer-confirmation">
    <p class="employer-label">${job.company} Careers</p>
    <h1>Application received</h1>
    <p>Your simulated application for ${job.title} is complete.</p>
    ${returnLink}
  </div>`;
}

main.addEventListener("submit", event => {
  event.preventDefault();
  const applied = readJobs("jobboard-applied");
  writeJobs("jobboard-applied", [...new Set([...applied, job.id])]);
  showConfirmation();
  window.scrollTo(0, 0);
  const title = main.querySelector("h1");
  title.tabIndex = -1;
  title.focus({ preventScroll: true });
});

main.addEventListener("click", event => {
  if (!event.target.closest("[data-return]") || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const referrer = document.referrer && new URL(document.referrer);
  if (referrer && referrer.origin === location.origin && [new URL("./", location.href).pathname, new URL("index.html", location.href).pathname].includes(referrer.pathname)) {
    event.preventDefault();
    history.back();
  }
});
