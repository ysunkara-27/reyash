# ProviderTask

Interactive implementation of the final KY Behavioral Health homepage and Provider Directory designs supplied in task1.pdf and the three reference screenshots. The final detailed designs govern styling and layout; the earlier survey homepage is not used.

- `/ProviderTask/` shows all resource groups with larger text, clear category headings, and blue provider-directory links. On phones those links appear first within their category. The homepage stays before the directory, without a task prompt or preselected search criteria.
- `#directory` supports independent provider-name and keyword search and optional health-plan, service, provider-type and county filters.
- Steps animate closed/open, retain selections, show answered/skipped status, and remain editable.
- All 120 Kentucky counties have actual geographic boundaries. Map and autocomplete selections share state; hover previews the county; tags remove selections; the statewide and county reset controls are always visible in the location step.
- Search scrolls to matching results. Labeled filters can be removed above results; empty results explain how to broaden the search; details open in a keyboard-accessible dialog.
- The directory contains 500 distinct sample provider records, including at least four local records per Kentucky county and statewide telehealth examples. All eight health plans, six services, and six provider types have coverage. Records are explicitly labeled throughout the directory. No search inputs leave the browser; records are illustrative rather than an official healthcare directory. The official source was unreachable during implementation.
- Other resource cards demonstrate off-task navigation with a “Not implemented” message.

`counties.json` derives Kentucky FIPS 21 county boundaries from the public Plotly US county GeoJSON dataset, https://github.com/plotly/datasets/blob/master/geojson-counties-fips.json .

Static HTML/CSS/JavaScript. No install or build step is needed for the page. The portfolio build copies the directory to dist/ProviderTask.
