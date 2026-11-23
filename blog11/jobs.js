const demoProfile = {
  name: "Maya Chen",
  email: "maya.chen@example.com",
  resume: "Maya_Chen_Resume.pdf",
};

const jobs = [
  {
    id: "northstar", company: "Northstar Systems", mark: "north", tone: "pine",
    title: "Associate Software Engineer", location: "Boston, MA", age: 1, experience: "Entry level",
    type: "Full-time", pay: "$82,000–$98,000", route: "hosted",
    intro: "Northstar Systems builds scheduling software for independent clinics. Join a product team improving the tools care coordinators use to manage busy appointment calendars.",
    duties: ["Build and test scheduling workflows in TypeScript and React.", "Investigate issues with a teammate and document what you learn.", "Pair with engineers and designers to ship small, frequent improvements."],
    skills: "A project that uses JavaScript or TypeScript, familiarity with Git, and an interest in building dependable interfaces.",
    workplace: "Hybrid. This team works from our Boston office on Tuesdays and Thursdays. You can work from home on the other weekdays.",
  },
  {
    id: "cedar", company: "Cedar Labs", mark: "cedar", tone: "lilac",
    title: "Software Engineer I", location: "United States", age: 2, experience: "Entry level",
    type: "Full-time", pay: "$88,000–$105,000", route: "hosted",
    intro: "Cedar Labs makes payment reconciliation easier for independent retailers. You’ll join the integrations team and help build software that turns raw payment events into clear daily reports.",
    duties: ["Build and maintain API integrations in Python.", "Write tests for payment events and reconciliation workflows.", "Pair with a mentor on your first production releases."],
    skills: "Up to two years of experience or equivalent project work. Familiarity with Python or JavaScript, SQL, and Git is welcome.",
    workplace: "Remote. You can work from anywhere in the United States. The team keeps four hours of overlap with Eastern Time, with no office attendance required.",
  },
  {
    id: "ironwood", company: "Ironwood Robotics", mark: "iron", tone: "peach",
    title: "Junior Software Engineer", location: "Pittsburgh, PA", age: 4, experience: "Entry level",
    type: "Full-time", pay: "$78,000–$94,000", route: "employer",
    intro: "Ironwood Robotics builds tools that help warehouse teams move inventory safely. You’ll write software that lets engineers see what’s happening across our test fleet.",
    duties: ["Add features to internal fleet monitoring tools.", "Help maintain automated tests for sensor data.", "Work with the test team to reproduce reported issues."],
    skills: "Experience from coursework or projects in Python, C++, or JavaScript. Interest in debugging systems that interact with hardware.",
    workplace: "On-site. You’ll work from our Pittsburgh test facility five days a week and use hardware available in the lab.",
  },
  {
    id: "fieldnote", company: "Fieldnote", mark: "field", tone: "blue",
    title: "Software Engineer, New Grad", location: "Seattle, WA", age: 6, experience: "Entry level",
    type: "Full-time", pay: "$92,000–$113,000", route: "hosted",
    intro: "Fieldnote helps infrastructure crews organize their inspections and maintenance records. As a new-grad engineer, you’ll work on the team responsible for the inspection editor.",
    duties: ["Build editor components with React.", "Improve performance and accessibility in existing workflows.", "Participate in code reviews and sprint planning."],
    skills: "Comfort writing or reading JavaScript and an interest in product engineering. Coursework and personal projects count.",
    workplace: "Hybrid. The team meets in Seattle Monday through Wednesday. Thursday and Friday are flexible.",
  },
  {
    id: "relay", company: "Relay Studio", mark: "relay", tone: "pink",
    title: "Associate Frontend Software Engineer", location: "Chicago, IL", age: 7, experience: "Entry level",
    type: "Contract", pay: "$40–$48 an hour", route: "employer",
    intro: "Relay Studio builds catalog and ticketing tools for museums. You’ll help maintain the shared components used across visitor-facing sites.",
    duties: ["Build accessible React components.", "Fix cross-browser layout issues.", "Write documentation and examples for the component library."],
    skills: "Experience with HTML, CSS, and JavaScript. Share a small project that demonstrates your approach to building interfaces.",
    workplace: "Hybrid. This six-month contract requires two days a week at our Chicago studio.",
  },
  {
    id: "meridian", company: "Meridian Cloud", mark: "meridian", tone: "yellow",
    title: "Junior Backend Software Engineer", location: "United States", age: 8, experience: "Entry level",
    type: "Full-time", pay: "$90,000–$108,000", route: "employer",
    intro: "Meridian Cloud builds observability tools for small engineering teams. You’ll help maintain the services that collect metrics and turn them into reliable alerts.",
    duties: ["Build and test APIs in Go or Python.", "Improve how services report errors and retries.", "Work with a mentor to ship a scoped backend project."],
    skills: "Familiarity with a programming language, logging, and HTTP APIs. Up to two years of work experience, including internships.",
    workplace: "Remote. The role is open anywhere in the contiguous United States. Team meetings are usually held between noon and 4 p.m. Eastern Time.",
  },
  {
    id: "tandem", company: "Tandem Health", mark: "tandem", tone: "pine",
    title: "Software Engineer I, Web Platform", location: "Raleigh, NC", age: 10, experience: "Entry level",
    type: "Full-time", pay: "$84,000–$102,000", route: "hosted",
    intro: "Tandem Health builds secure intake and appointment tools for outpatient practices. You’ll work on the shared web platform that supports those tools.",
    duties: ["Maintain shared forms and components.", "Test changes with a QA partner.", "Improve the reliability of the build pipeline."],
    skills: "Experience with modern JavaScript and some exposure to automated testing.",
    workplace: "On-site. The engineering and practice support teams work from our Raleigh office each weekday.",
  },
  {
    id: "slope", company: "Slope Analytics", mark: "slope", tone: "lilac",
    title: "Junior Full Stack Software Engineer", location: "United States", age: 12, experience: "Entry level",
    type: "Full-time", pay: "$83,000–$103,000", route: "hosted",
    intro: "Slope Analytics gives nonprofit teams a simpler way to understand campaign performance. You’ll help turn reporting requirements into clear, usable dashboards.",
    duties: ["Build features in a React and PostgreSQL stack.", "Work with customer support to reproduce issues.", "Add automated checks for key reporting flows."],
    skills: "Experience building a small web app, using a database, or working with an API.",
    workplace: "Remote. Work from any U.S. state with shared hours from 10 a.m. to 2 p.m. Pacific Time.",
  },
  {
    id: "bramble", company: "Bramble Commerce", mark: "cedar", tone: "peach",
    title: "Software Engineering Intern", location: "Austin, TX", age: 1, experience: "Internship",
    type: "Internship", pay: "$30–$36 an hour", route: "hosted",
    intro: "Bramble Commerce builds inventory tools for local shops. Take ownership of a small product improvement with help from a dedicated engineering mentor.",
    duties: ["Build a feature in the merchant dashboard.", "Add tests and share a short demo with the team."],
    skills: "Some experience with a web programming language through coursework or projects.",
    workplace: "Hybrid. Interns work from our Austin office on Mondays and Wednesdays.",
  },
  {
    id: "basin", company: "Basin Data", mark: "field", tone: "blue",
    title: "Software Engineer II", location: "Denver, CO", age: 5, experience: "Mid level",
    type: "Full-time", pay: "$110,000–$134,000", route: "employer",
    intro: "Basin Data builds data pipelines for community water utilities. You’ll design features that help operators monitor incoming measurements.",
    duties: ["Maintain Python data services.", "Review reliability metrics and investigate issues."],
    skills: "Three or more years of software engineering experience and familiarity with data pipelines.",
    workplace: "On-site. The team works from our Denver office five days a week.",
  },
];

const jobById = id => jobs.find(job => job.id === id);
const readJobs = key => {
  try { return JSON.parse(sessionStorage.getItem(key)) || []; }
  catch { return []; }
};
const writeJobs = (key, ids) => sessionStorage.setItem(key, JSON.stringify(ids));
