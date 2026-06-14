(function () {
  var currentLang = localStorage.getItem("kaamkaroLang") || localStorage.getItem("kkLang") || "en";
  var currentScreen = "landing";
  var currentRole = localStorage.getItem("kkRole") || "worker";
  var menuReturn = "jobs";
  var pointerStartX = 0;
  var activeFilter = "all";
  var jobIndex = 0;
  var swipeCount = Number(localStorage.getItem("kkSwipeCount") || "0");
  var appliedToday = Number(localStorage.getItem("kkAppliedToday") || "0");
  var selectedJobId = "clerk";
  var selectedWorkerId = "john";
  var currentLegal = "terms";
  var locationMode = "city";
  var activeCity = localStorage.getItem("kkActiveCity") || "";
  var payOpen = true;
  var postVisibility = "";
  var reportContext = "general";
  var selectedReportJobId = null;
  var selectedConversationId = null;
  var publicProfileReturn = "jobs";
  var applicationsTab = "applied";
  var applicantsTab = "new";
  var chatListTab = "all";
  var selectedReportReason = "";
  var selectedLocations = {};
  var pendingRating = { score: 0, quick: "" };
  var editingProfileField = "";
  var editDraft = {};
  var editDirty = false;
  var pointerCard = null;
  var pointerDeltaX = 0;
  var lastSwipe = null;
  var undoTimer = null;
  var phoneUpdatePending = false;
  var pendingEmployerRoute = localStorage.getItem("kkPendingEmployerRoute") || "";
  var pendingWorkerRoute = localStorage.getItem("kkPendingWorkerRoute") || "";
  var setupReturnRoute = localStorage.getItem("kkSetupReturnRoute") || "";
  var isEditMode = false;
  var editReturnScreen = "";
  var profileEditMode = "";
  var swipeCooldownTimer = null;
  var swipeLimitHydrateKey = "";
  var WORKER_PLUS_ENABLED = false;
  var jobFormMode = "create";
  var editingJobId = "";
  var repostSourceJobId = "";
  var jobFormReturnScreen = "employerDash";
  var workerSwipePlans = {
    free: { dailyLimit: 25, cooldowns: [2 * 3600000, 8 * 3600000], workerPlusEnabled: WORKER_PLUS_ENABLED },
    plus: { dailyLimit: 25, cooldowns: [2 * 3600000, 8 * 3600000], workerPlusEnabled: false }
  };

  function isLocalPrototype() {
    return window.location.protocol === "file:" ||
      (window.location.protocol === "http:" && ["localhost", "127.0.0.1", ""].indexOf(window.location.hostname) >= 0);
  }
  function allowPrototypeFixtures() {
    return isLocalPrototype() && localStorage.getItem("kkDisableDemoData") !== "true";
  }

  var routeOrder = ["landing","otp","otpCode","role","workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","chat","search","applications","employerPublicProfile","employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","profile","employerProfile","notifications","menu","accountSettings","profileEdit","adminModeration","legal","report"];
  var workCategories = ["Delivery","Retail","Office Work","Helper","Driver","Cleaner","Waiter","Data Entry"];
  var skillOptions = ["Cleaning","Driving","Customer Service","Data Entry","Excel","Inventory Handling","Food Service","Basic Accounting","Communication","Sales","Packing","Warehouse Work"];
  var defaultJobs = [
    { id: "clerk", title: "Office Clerk", pay: "Rs 18,000/month", city: "Delhi", distance: "2 km away", type: "Full-time", employer: "Rick Retail Store", badge: "Verified", visibility: "boost", remote: false, desc: "Counter billing, records and basic customer help." },
    { id: "driver", title: "Delivery Driver", pay: "Rs 700/day", city: "Delhi", distance: "Nearby", type: "Daily wage", employer: "City Logistics", badge: "New", remote: false, desc: "Local deliveries, licence required." },
    { id: "cashier", title: "Cashier", pay: "Rs 16,000/month", city: "Delhi", distance: "4 km away", type: "Full-time", employer: "Fresh Mart", badge: "Verified", remote: false, desc: "Billing counter and cash handling." },
    { id: "remote-data", title: "Data Entry", pay: "Rs 12,000/month", city: "Remote", distance: "Remote", type: "Remote", employer: "AdminWorks", badge: "Verified", remote: true, desc: "Basic typing and spreadsheet work." }
  ];
  function cloneJobs() {
    if (!allowPrototypeFixtures()) return [];
    return defaultJobs.map(function (job) { return Object.assign({}, job); });
  }
  function freshAccountState(phone, userId, authUser) {
    return {
      workerComplete: false,
      employerComplete: false,
      worker: { id: "", name: "", gender: "", age: "", city: "", experience: "", skills: [], jobTypes: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: true, startAvailability: "", availableDays: [], shiftPreference: "", flexibleAvailability: false },
      employer: { id: "", ownerId: userId || "", name: "", business: "", phone: phone || "", type: "", city: "" },
      jobs: cloneJobs(),
      applications: [],
      conversations: [],
      messages: [],
      notifications: [],
      auditLogs: [],
      jobEditHistory: [],
      moderationLogs: [],
      reports: [],
      ratings: [],
      workerSwipeLimits: {},
      blockedPairs: [],
      businessProfiles: {},
      workerProfiles: {},
      defaultBusinessId: "",
      defaultWorkerId: "",
      postingHistory: [],
      user: {
        id: userId || ("demo-user-" + (phone || Date.now())),
        displayName: "",
        phone: phone || "",
        city: "",
        location: "",
        phoneVerified: true,
        photoVerificationStatus: "not_uploaded",
        photoVerified: false,
        authenticated: true,
        hasWorkerProfile: !!(authUser && authUser.has_worker_profile),
        hasEmployerProfile: !!(authUser && authUser.has_employer_profile),
        activeRole: (authUser && authUser.active_role) || "worker",
        language: (authUser && authUser.language) || currentLang
      }
    };
  }
  var state = JSON.parse(localStorage.getItem("kkState") || "null") || {
    workerComplete: false,
    employerComplete: false,
    worker: { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], jobTypes: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: true, startAvailability: "", availableDays: [], shiftPreference: "", flexibleAvailability: false },
    employer: { id: "", ownerId: "john", name: "", business: "", phone: "0000000000", type: "", city: "" },
    jobs: cloneJobs(),
    applications: [],
    conversations: [],
    messages: [],
    notifications: [],
    jobEditHistory: [],
    workerSwipeLimits: {}
  };
  state.worker = state.worker || { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: true };
  state.worker.id = state.worker.id || "john";
  state.worker.skills = Array.isArray(state.worker.skills) ? state.worker.skills : [];
  state.worker.preferredJob = state.worker.preferredJob || "Any Job";
  state.worker.jobTypes = Array.isArray(state.worker.jobTypes) ? state.worker.jobTypes : [];
  state.employer = state.employer || { id: "", ownerId: "john", name: "", business: "", phone: "0000000000", type: "", city: "" };
  if (!Array.isArray(state.jobs) || !state.jobs.length) state.jobs = cloneJobs();
  state.applications = Array.isArray(state.applications) ? state.applications : [];
  state.auditLogs = state.auditLogs || [];
  state.jobEditHistory = state.jobEditHistory || [];
  state.moderationLogs = state.moderationLogs || [];
  state.reports = state.reports || [];
  state.ratings = state.ratings || [];
  state.workerSwipeLimits = state.workerSwipeLimits || {};
  state.blockedPairs = state.blockedPairs || [];
  state.postingHistory = state.postingHistory || [];
  state.conversations = state.conversations || [];
  state.messages = state.messages || [];
  state.notifications = state.notifications || [];
  state.defaultBusinessId = state.defaultBusinessId || "";
  state.businessProfiles = state.businessProfiles || {};
  state.defaultWorkerId = state.defaultWorkerId || "";
  state.workerProfiles = state.workerProfiles || {};
  state.user = state.user || { id: "user-demo", displayName: state.worker.name || "", phone: state.employer.phone || "", city: state.worker.city || "", location: state.worker.city || "" };
  state.user.id = state.user.id || "user-demo";
  state.user.displayName = state.user.displayName || state.worker.name || "";
  state.user.phone = state.user.phone || state.employer.phone || "";
  state.user.city = state.user.city || state.worker.city || "";
  state.user.location = state.user.location || state.user.city || "";
  state.user.phoneVerified = !!(state.user.phoneVerified || state.worker.phoneVerified);
  state.user.photoVerificationStatus = state.user.photoVerificationStatus || (state.user.photoVerified || state.worker.photoVerified ? "verified" : "not_uploaded");
  state.user.photoVerified = state.user.photoVerificationStatus === "verified";
  state.worker.photoVerified = state.user.photoVerificationStatus === "verified";
  var oldDemoName = ["John","Kumar"].join(" ");
  var oldDemoPhone = "987" + "654" + "3210";
  var oldDemoCity = "Jai" + "pur";
  if (!state.workerComplete && !state.defaultWorkerId) {
    state.worker.name = "";
    state.worker.gender = "";
    state.worker.age = "";
    state.worker.city = "";
    state.worker.experience = "";
    state.worker.skills = [];
    state.worker.jobTypes = [];
    state.worker.preferredJob = "Any Job";
    state.worker.startAvailability = "";
    state.worker.availableDays = [];
    state.worker.shiftPreference = "";
    state.worker.flexibleAvailability = false;
  } else {
    if (state.worker.name === oldDemoName) state.worker.name = "Aman Lalh";
    if (state.worker.city === oldDemoCity) state.worker.city = "Delhi";
  }
  if (state.employer.phone === oldDemoPhone) state.employer.phone = "0000000000";
  if (state.user.displayName === oldDemoName) state.user.displayName = state.worker.name || "";
  if (!state.user.phone || state.user.phone === oldDemoPhone) state.user.phone = "0000000000";
  if (!state.user.city || state.user.city === oldDemoCity) { state.user.city = "Delhi"; state.user.location = "Delhi"; }
  state.worker.startAvailability = state.worker.startAvailability || "";
  state.worker.availableDays = Array.isArray(state.worker.availableDays) ? state.worker.availableDays : [];
  state.worker.shiftPreference = state.worker.shiftPreference || "";
  state.worker.flexibleAvailability = !!state.worker.flexibleAvailability;
  state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
  state.employer.moderationStatus = state.employer.moderationStatus || "active";
  state.jobs.forEach(function (job) {
    job.status = job.status || "approved";
    job.reportCount = job.reportCount || 0;
    job.flagReasons = job.flagReasons || [];
    job.riskScore = job.riskScore || 0;
    job.createdAt = job.createdAt || (Date.now() - 86400000);
    job.expiresAt = job.expiresAt || (job.visibility === "boost" ? job.createdAt + 28 * 86400000 : job.createdAt + 15 * 86400000);
    if ((job.status || "approved") === "approved" && Date.now() > job.expiresAt) job.status = "Expired";
  });
  state.jobs = state.jobs.filter(function (job) { return !job.expiresAt || Date.now() < job.expiresAt + 60 * 86400000; });
  if (!state.jobs.some(function (job) { return (job.status || "approved") === "approved"; })) {
    state.jobs = cloneJobs().concat(state.jobs);
  }

  var moderationRules = {
    prohibited: [
      { reason: "Adult or sexual services", words: ["adult service","escort","prostitution","massage girl","call girl","sex work"] },
      { reason: "Drugs or narcotics", words: ["drug","narcotic","ganja","cocaine","heroin","mdma","charas"] },
      { reason: "Weapons or explosives", words: ["weapon","gun","pistol","explosive","bomb","ammunition"] },
      { reason: "Trafficking, forced labour or child labour", words: ["forced labour","bonded labour","child labour","minor worker","under 18"] },
      { reason: "Scam or upfront payment request", words: ["registration fee","security deposit","pay first","upfront payment","joining fee","processing fee"] },
      { reason: "Gambling, betting or money laundering", words: ["betting","gambling","casino","money laundering","hawala"] },
      { reason: "Harassment or unsafe work", words: ["harass","abuse allowed","unsafe work","no safety"] }
    ],
    suspicious: [
      { reason: "WhatsApp-only contact", words: ["whatsapp only","only whatsapp","whatsapp me","wa only"] },
      { reason: "No interview or direct joining", words: ["no interview","direct joining","join immediately no questions"] },
      { reason: "Discrimination language", words: ["only male","only female","no muslim","no hindu","caste","religion only"] }
    ]
  };

  var copy = {
    en: { heroTitle: "Jobs near you.", heroSub: "Apply in one swipe. Chat after employer accepts.", heroVisual: "Swipe. Match. Start work.", continue: "Continue", enter_phone: "Enter your phone number", send_otp: "Send OTP", verify_otp: "Verify & continue", find_work: "Looking for work", hire_workers: "Hiring workers", basic_details: "Basic details", job_type: "Job type", skills_experience: "Skills & experience", availability: "Availability", job_feed: "Job Feed", search_city: "Search city", all: "All", near_me: "Near Me", remote: "Remote", profile: "Profile", settings: "Settings", change_phone: "Change Phone Number", notifications: "Notifications", privacy: "Privacy", delete_account: "Delete Account", help: "Help & FAQ", refer: "Refer & Earn", logout: "Logout" },
    hi: { heroTitle: "आपके पास नौकरियां।", heroSub: "एक स्वाइप में आवेदन करें। नियोक्ता स्वीकार करे तो चैट करें।", heroVisual: "स्वाइप करें। मैच करें। काम शुरू करें।", continue: "आगे बढ़ें", enter_phone: "अपना मोबाइल नंबर दर्ज करें", send_otp: "ओटीपी भेजें", verify_otp: "ओटीपी सत्यापित करें", find_work: "काम ढूंढें", hire_workers: "काम पर रखें", basic_details: "बुनियादी जानकारी", job_type: "काम का प्रकार", skills_experience: "कौशल और अनुभव", availability: "उपलब्धता", job_feed: "नौकरियां", search_city: "शहर खोजें", all: "सभी", near_me: "मेरे पास", remote: "घर से काम", profile: "प्रोफाइल", settings: "सेटिंग्स", change_phone: "फोन नंबर बदलें", notifications: "नोटिफिकेशन", privacy: "प्राइवेसी", delete_account: "अकाउंट हटाएं", help: "मदद", refer: "दोस्तों को आमंत्रित करें", logout: "लॉगआउट" }
  };
  var legal = {
    terms: ["Terms & Conditions", "Kaam Karo connects workers and employers. Use truthful information, do not post illegal jobs, and do not ask workers to pay for employment."],
    privacy: ["Privacy Policy", "We use phone numbers for login, account safety and trusted job updates. We do not publicly show your phone number in the app."],
    refund: ["Refund Policy", "Boosted post payments are reviewed case by case. Refunds may apply when a paid post is not published due to platform issues."],
    guidelines: ["Community Guidelines", "Be respectful. Do not ask for money to give a job. Report fake jobs, unsafe messages or wrong salary details."]
  };

  function save() {
    localStorage.setItem("kkState", JSON.stringify(state));
    saveAccountSnapshot();
    localStorage.setItem("kkActiveCity", activeCity || "");
  }
  function accountSnapshots() {
    try { return JSON.parse(localStorage.getItem("kkAccountStates") || "{}") || {}; }
    catch (error) { return {}; }
  }
  function accountKeyFor(snapshot) {
    var user = snapshot && snapshot.user ? snapshot.user : {};
    return user.phone || user.id || "";
  }
  function saveAccountSnapshot() {
    var key = accountKeyFor(state);
    if (!key) return;
    var snapshots = accountSnapshots();
    snapshots[key] = state;
    if (state.user && state.user.id) snapshots[state.user.id] = state;
    localStorage.setItem("kkAccountStates", JSON.stringify(snapshots));
  }
  function activateAccountState(authUser, phone) {
    var userId = (authUser && authUser.id) || ("demo-user-" + phone);
    var snapshots = accountSnapshots();
    var sameAccount = state.user && (state.user.phone === phone || state.user.id === userId);
    if (!sameAccount) saveAccountSnapshot();
    state = sameAccount ? state : (snapshots[phone] || snapshots[userId] || freshAccountState(phone, userId, authUser));
    state.user = state.user || {};
    state.user.id = userId;
    state.user.phone = phone;
    state.user.hasWorkerProfile = !!(authUser && authUser.has_worker_profile) || !!state.user.hasWorkerProfile || hasWorkerProfile();
    state.user.hasEmployerProfile = !!(authUser && authUser.has_employer_profile) || !!state.user.hasEmployerProfile || hasEmployerProfile();
    state.user.activeRole = (authUser && authUser.active_role) || state.user.activeRole || currentRole;
    state.user.language = (authUser && authUser.language) || state.user.language || currentLang;
    state.user.authenticated = true;
    state.user.phoneVerified = true;
    state.user.photoVerificationStatus = state.user.photoVerificationStatus || "not_uploaded";
    state.user.photoVerified = state.user.photoVerificationStatus === "verified";
    state.employer = state.employer || {};
    state.employer.phone = phone;
    state.worker = state.worker || {};
    state.worker.phoneVerified = true;
    state.postingHistory = state.postingHistory || [];
    state.applications = Array.isArray(state.applications) ? state.applications : [];
    state.conversations = Array.isArray(state.conversations) ? state.conversations : [];
    state.messages = Array.isArray(state.messages) ? state.messages : [];
    state.notifications = Array.isArray(state.notifications) ? state.notifications : [];
    state.workerSwipeLimits = state.workerSwipeLimits || {};
    if (!sameAccount) {
      activeCity = state.user.city || "";
      selectedConversationId = null;
      applicationsTab = "applied";
      applicantsTab = "new";
      chatListTab = "all";
      jobIndex = 0;
    }
  }
  function updateLocalAuthProfileFlags() {
    var phone = state.user && state.user.phone;
    if (!phone) return;
    try {
      var users = JSON.parse(localStorage.getItem("kkAuthUsers") || "{}") || {};
      if (!users[phone]) return;
      users[phone].has_worker_profile = hasWorkerProfile();
      users[phone].has_employer_profile = hasEmployerProfile();
      users[phone].active_role = currentRole;
      users[phone].updated_at = new Date().toISOString();
      localStorage.setItem("kkAuthUsers", JSON.stringify(users));
    } catch (error) {}
  }
  async function hydrateSupabaseSession() {
    if (!window.KaamKaroProfile || !window.KaamKaroProfile.hydrateSession) return;
    try {
      var remote = await window.KaamKaroProfile.hydrateSession(state);
      if (window.KaamKaroEmployer && window.KaamKaroEmployer.hydrateEmployer) await window.KaamKaroEmployer.hydrateEmployer(state);
      if (window.KaamKaroJobs && window.KaamKaroJobs.hydrateJobs) await window.KaamKaroJobs.hydrateJobs(state);
      if (window.KaamKaroApplications && window.KaamKaroApplications.hydrateApplications) await window.KaamKaroApplications.hydrateApplications(state);
      if (window.KaamKaroChat && window.KaamKaroChat.hydrateChats) await window.KaamKaroChat.hydrateChats(state);
      await hydrateSwipeLimitRemote(true);
      if (!remote) return;
      save();
      render();
    } catch (error) {
      console.warn("Supabase session hydrate skipped:", error);
    }
  }
  async function saveWorkerProfileRemote() {
    if (!window.KaamKaroProfile || !window.KaamKaroProfile.saveWorkerProfile) return null;
    try {
      var savedProfile = await window.KaamKaroProfile.saveWorkerProfile(state);
      if (savedProfile) save();
      return savedProfile;
    } catch (error) {
      console.warn("Worker profile Supabase save failed:", error);
      toast("Saved on this device. We will sync when connection is ready.");
      return null;
    }
  }
  async function saveEmployerProfileRemote() {
    if (!window.KaamKaroEmployer || !window.KaamKaroEmployer.saveEmployerProfile) return null;
    try {
      var savedProfile = await window.KaamKaroEmployer.saveEmployerProfile(state);
      if (savedProfile) save();
      return savedProfile;
    } catch (error) {
      console.warn("Employer profile Supabase save failed:", error);
      toast("Saved on this device. We will sync when connection is ready.");
      return null;
    }
  }
  async function saveJobRemote(job) {
    if (!window.KaamKaroJobs || !window.KaamKaroJobs.saveJob) return null;
    try {
      var savedJob = await window.KaamKaroJobs.saveJob(state, job);
      if (savedJob) save();
      return savedJob;
    } catch (error) {
      console.warn("Job Supabase save failed:", error);
      return null;
    }
  }
  async function payForBoostRemote(job) {
    if (!window.KaamKaroPayments || !window.KaamKaroPayments.payForBoost) throw new Error("Payment service is not ready.");
    return window.KaamKaroPayments.payForBoost(job);
  }
  async function saveApplicationRemote(app, job) {
    if (!window.KaamKaroApplications || !window.KaamKaroApplications.saveApplication) return null;
    try {
      var savedApp = await window.KaamKaroApplications.saveApplication(state, app, job);
      if (savedApp) save();
      return savedApp;
    } catch (error) {
      console.warn("Application Supabase save failed:", error);
      return null;
    }
  }
  async function hydrateSwipeLimitRemote(force) {
    if (!window.KaamKaroSwipeLimits || !window.KaamKaroSwipeLimits.loadSwipeLimit) return null;
    var identity = workerSwipeIdentity();
    var dateKey = indiaDateKey();
    var hydrateKey = [identity.userId, identity.workerId, dateKey].join("|");
    if (!force && swipeLimitHydrateKey === hydrateKey) return null;
    swipeLimitHydrateKey = hydrateKey;
    try {
      var remoteRecord = await window.KaamKaroSwipeLimits.loadSwipeLimit(identity, dateKey);
      if (!remoteRecord) return null;
      var localKey = swipeLimitRecordKey(identity, dateKey);
      state.workerSwipeLimits[localKey] = normalizeSwipeLimitRecord(remoteRecord, identity, dateKey);
      save();
      return state.workerSwipeLimits[localKey];
    } catch (error) {
      console.warn("Swipe limit Supabase hydrate failed:", error);
      return null;
    }
  }
  async function saveSwipeLimitRemote(record) {
    if (!window.KaamKaroSwipeLimits || !window.KaamKaroSwipeLimits.saveSwipeLimit) return null;
    try {
      return await window.KaamKaroSwipeLimits.saveSwipeLimit(record);
    } catch (error) {
      console.warn("Swipe limit Supabase save failed:", error);
      return null;
    }
  }
  async function updateApplicationStatusRemote(app) {
    if (!window.KaamKaroApplications || !window.KaamKaroApplications.updateApplicationStatus) return null;
    try {
      var savedApp = await window.KaamKaroApplications.updateApplicationStatus(state, app);
      if (savedApp) save();
      return savedApp;
    } catch (error) {
      console.warn("Application status Supabase update failed:", error);
      return null;
    }
  }
  async function saveConversationRemote(convo, app) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.saveConversation) return null;
    try {
      var savedConvo = await window.KaamKaroChat.saveConversation(state, convo, app);
      if (savedConvo) save();
      return savedConvo;
    } catch (error) {
      console.warn("Chat Supabase save failed:", error);
      return null;
    }
  }
  async function updateConversationRemote(convo) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.updateConversation) return null;
    try {
      return await window.KaamKaroChat.updateConversation(state, convo);
    } catch (error) {
      console.warn("Chat Supabase update failed:", error);
      return null;
    }
  }
  async function saveMessageRemote(convo, message) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.saveMessage) return null;
    try {
      var savedMessage = await window.KaamKaroChat.saveMessage(state, convo, message);
      if (savedMessage) save();
      return savedMessage;
    } catch (error) {
      console.warn("Message Supabase save failed:", error);
      return null;
    }
  }
  async function updateMessageRemote(message) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.updateMessageStatus) return null;
    try {
      return await window.KaamKaroChat.updateMessageStatus(state, message);
    } catch (error) {
      console.warn("Message status Supabase update failed:", error);
      return null;
    }
  }
  async function saveModerationLogRemote(log) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.saveModerationLog) return null;
    try {
      return await window.KaamKaroChat.saveModerationLog(state, log);
    } catch (error) {
      console.warn("Moderation Supabase save failed:", error);
      return null;
    }
  }
  async function saveReportRemote(report, convo) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.saveReport) return null;
    try {
      return await window.KaamKaroChat.saveReport(state, report, convo);
    } catch (error) {
      console.warn("Report Supabase save failed:", error);
      return null;
    }
  }
  async function saveRatingRemote(rating, convo) {
    if (!window.KaamKaroChat || !window.KaamKaroChat.saveRating) return null;
    try {
      return await window.KaamKaroChat.saveRating(state, rating, convo);
    } catch (error) {
      console.warn("Rating Supabase save failed:", error);
      return null;
    }
  }
  function track(name) {
    var events = JSON.parse(localStorage.getItem("kkAnalytics") || "[]");
    events.push({ name: name, at: new Date().toISOString(), screen: currentScreen });
    localStorage.setItem("kkAnalytics", JSON.stringify(events.slice(-100)));
  }
  function snapshotJob(job) {
    return { id: job.id, title: job.title, pay: job.pay, city: job.city, type: job.type, employer: job.employer, desc: job.desc, status: job.status };
  }
  function audit(action, reason, job, userId) {
    state.auditLogs.unshift({ userId: userId || "admin-001", action: action, reason: reason, jobSnapshot: job ? snapshotJob(job) : null, timestamp: new Date().toISOString() });
    state.auditLogs = state.auditLogs.slice(0, 50);
    save();
  }
  var indiaLocations = [
    { city: "Bainsa", district: "Shaheed Bhagat Singh Nagar", state: "Punjab", country: "India", formatted_location: "Bainsa, Shaheed Bhagat Singh Nagar, Punjab, India", place_id: "in-bainsa-sbsn-pb", lat: 31.105, lng: 76.38 },
    { city: "Gandhinagar", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar, Gujarat, India", place_id: "in-gandhinagar-gj", lat: 23.2156, lng: 72.6369 },
    { city: "Gandhinagar", district: "Kolhapur", state: "Maharashtra", country: "India", formatted_location: "Gandhinagar, Kolhapur, Maharashtra, India", place_id: "in-gandhinagar-kolhapur-mh", lat: 16.705, lng: 74.243 },
    { city: "Gandhinagar District", district: "Gandhinagar", state: "Gujarat", country: "India", formatted_location: "Gandhinagar District, Gujarat, India", place_id: "in-gandhinagar-district-gj", lat: 23.223, lng: 72.65 },
    { city: "Balachaur", district: "Nawanshahr", state: "Punjab", country: "India", formatted_location: "Balachaur, Nawanshahr, Punjab, India", place_id: "in-balachaur-pb", lat: 31.06, lng: 76.3 },
    { city: "Chandigarh", district: "Chandigarh", state: "Chandigarh", country: "India", formatted_location: "Chandigarh, India", place_id: "in-chandigarh", lat: 30.7333, lng: 76.7794 },
    { city: "Delhi", district: "Delhi", state: "Delhi", country: "India", formatted_location: "Delhi, India", place_id: "in-delhi", lat: 28.6139, lng: 77.209 },
    { city: "Pune", district: "Pune", state: "Maharashtra", country: "India", formatted_location: "Pune, Maharashtra, India", place_id: "in-pune-mh", lat: 18.5204, lng: 73.8567 },
    { city: "Kochi", district: "Ernakulam", state: "Kerala", country: "India", formatted_location: "Kochi, Ernakulam, Kerala, India", place_id: "in-kochi-kl", lat: 9.9312, lng: 76.2673 },
    { city: "Hyderabad", district: "Hyderabad", state: "Telangana", country: "India", formatted_location: "Hyderabad, Telangana, India", place_id: "in-hyderabad-ts", lat: 17.385, lng: 78.4867 },
    { city: "Mumbai", district: "Mumbai", state: "Maharashtra", country: "India", formatted_location: "Mumbai, Maharashtra, India", place_id: "in-mumbai-mh", lat: 19.076, lng: 72.8777 },
    { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", country: "India", formatted_location: "Bengaluru, Karnataka, India", place_id: "in-bengaluru-ka", lat: 12.9716, lng: 77.5946 },
    { city: "Jaipur", district: "Jaipur", state: "Rajasthan", country: "India", formatted_location: "Jaipur, Rajasthan, India", place_id: "in-jaipur-rj", lat: 26.9124, lng: 75.7873 },
    { city: "Surat", district: "Surat", state: "Gujarat", country: "India", formatted_location: "Surat, Gujarat, India", place_id: "in-surat-gj", lat: 21.1702, lng: 72.8311 },
    { city: "Amritsar", district: "Amritsar", state: "Punjab", country: "India", formatted_location: "Amritsar, Punjab, India", place_id: "in-amritsar-pb", lat: 31.634, lng: 74.8723 },
    { city: "Karimnagar", district: "Karimnagar", state: "Telangana", country: "India", formatted_location: "Karimnagar, Telangana, India", place_id: "in-karimnagar-ts", lat: 18.4386, lng: 79.1288 },
    { city: "Tiruchirappalli", district: "Tiruchirappalli", state: "Tamil Nadu", country: "India", formatted_location: "Tiruchirappalli, Tamil Nadu, India", place_id: "in-tiruchirappalli-tn", lat: 10.7905, lng: 78.7047 }
  ];
  if (window.KaamKaroLocation && window.KaamKaroLocation.fallbackLocations) indiaLocations = window.KaamKaroLocation.fallbackLocations;
  function locationApi() {
    return window.KaamKaroLocation || null;
  }
  function formatLocationLabel(loc) {
    var api = locationApi();
    return api && api.formatLabel ? api.formatLabel(loc) : [loc.city, loc.district, loc.state].filter(Boolean).join(", ");
  }
  function normalizeLocation(loc) {
    var api = locationApi();
    if (api && api.normalize) return api.normalize(loc);
    if (!loc) return null;
    return {
      city: loc.city || "",
      district: loc.district || loc.city || "",
      state: loc.state || loc.district || loc.city || "",
      country: loc.country || "India",
      formatted_location: loc.formatted_location || [loc.city, loc.district, loc.state, "India"].filter(Boolean).join(", "),
      place_id: loc.place_id || "",
      lat: loc.lat == null ? null : Number(loc.lat),
      lng: loc.lng == null ? null : Number(loc.lng)
    };
  }
  function locationMatches(query) {
    var api = locationApi();
    if (api && api.localSearch) return api.localSearch(query);
    var q = String(query || "").toLowerCase().trim();
    if (!q) return indiaLocations.slice(0, 8);
    return indiaLocations.filter(function (loc) {
      return [loc.city, loc.district, loc.state, loc.formatted_location].join(" ").toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8);
  }
  function fillLocationDatalist(query) {
    var list = byId("locationSuggestions");
    if (!list) return;
    list.innerHTML = locationMatches(query).map(function (loc) { return '<option value="' + escapeHtml(formatLocationLabel(loc)) + '"></option>'; }).join("");
  }
  function selectedLocationFromInput(value) {
    var api = locationApi();
    if (api && api.findByInput) return api.findByInput(value);
    var exact = String(value || "").trim().toLowerCase();
    return indiaLocations.find(function (loc) { return formatLocationLabel(loc).toLowerCase() === exact || loc.formatted_location.toLowerCase() === exact; }) || null;
  }
  function selectedLocationFromPlaceId(placeId) {
    var api = locationApi();
    if (api && api.findByPlaceId) return api.findByPlaceId(placeId);
    return indiaLocations.find(function (loc) { return loc.place_id === placeId; }) || null;
  }
  function saveLocationTo(target, loc) {
    loc = normalizeLocation(loc);
    if (!loc) return;
    selectedLocations[target] = loc;
    if (window.KaamKaroLocation && window.KaamKaroLocation.setSelected) window.KaamKaroLocation.setSelected(target, loc);
    if (target === "workerBasic") {
      state.worker.city = loc.city; state.worker.district = loc.district; state.worker.state = loc.state; state.worker.country = loc.country; state.worker.formatted_location = loc.formatted_location; state.worker.place_id = loc.place_id; state.worker.lat = loc.lat; state.worker.lng = loc.lng;
      state.user.city = loc.city; state.user.district = loc.district; state.user.state = loc.state; state.user.country = loc.country; state.user.location = loc.formatted_location;
    }
    if (target === "postJob") {
      selectedLocations.postJob = loc;
    }
    if (target === "businessSetup") {
      Object.assign(state.employer, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
    }
    if (target === "profileEdit") {
      editDraft.value = loc.formatted_location;
      editDraft.location = loc;
      markEditDirty();
    }
    save();
  }
  function renderHeroDynamicCard() {
    if (!byId("heroJobTitle") || !byId("heroJobMeta")) return;
    var titles = ["Chef","Driver","Electrician","Accountant","Nurse","Office Clerk","Retail Helper","Delivery Partner","Cleaner","Welder"];
    var cities = ["Delhi","Punjab","Kerala","Hyderabad","Pune","Surat","Chandigarh","Kochi","Amritsar","Jaipur"];
    var seed = Math.floor(Date.now() / 1000);
    byId("heroJobTitle").textContent = titles[seed % titles.length] + " job matched";
    byId("heroJobMeta").textContent = cities[(seed + 3) % cities.length] + " - " + ((seed % 10) + 1) + " km away";
  }
  function parseLocationParts(value) {
    var text = String(value || "").trim();
    var selected = selectedLocationFromInput(text);
    if (selected) return selected;
    return null;
  }
  function disconnectMatch(convo, reason) {
    if (!convo) return null;
    var now = Date.now();
    var app = state.applications.find(function (item) { return item.jobId === convo.jobId && item.workerId === convo.workerId; });
    if (app) {
      app.status = "Disconnected";
      app.disconnectedAt = now;
      app.disconnectReason = reason || "disconnected";
    }
    convo.status = "disconnected";
    convo.disconnectedBy = currentUserId();
    convo.disconnectedAt = now;
    convo.disconnectedReason = reason || "disconnected";
    state.blockedPairs = state.blockedPairs || [];
    if (!state.blockedPairs.some(function (pair) { return pair.conversationId === convo.id; })) {
      state.blockedPairs.push({ conversationId: convo.id, workerId: convo.workerId, employerId: convo.employerId, reason: reason || "disconnected", createdAt: now });
    }
    state.applications = state.applications.filter(function (item) { return !(item.jobId === convo.jobId && item.workerId === convo.workerId); });
    state.conversations = state.conversations.filter(function (c) { return c.id !== convo.id; });
    state.messages = state.messages.filter(function (m) { return m.conversationId !== convo.id; });
    selectedConversationId = null;
    save();
    return { application: app, conversation: convo };
  }
  function expireInactiveMatches() {
    var cutoff = Date.now() - 12 * 86400000;
    var expired = state.conversations.filter(function (convo) {
      return convo.status === "active" && (convo.lastActivityAt || convo.updatedAt || convo.createdAt || 0) < cutoff;
    });
    expired.forEach(function (convo) { disconnectMatch(convo, "inactive_12_days"); });
  }
  function markHiredConversation(convo) {
    if (!convo) return null;
    convo.status = "hired";
    convo.updatedAt = Date.now();
    convo.lastActivityAt = Date.now();
    var hiredApp = state.applications.find(function (a) { return a.jobId === convo.jobId && a.workerId === convo.workerId; });
    if (hiredApp) hiredApp.status = "Hired";
    var now = Date.now();
    var text = "Hired! Employer has marked this job as hired.";
    var hiredMessage = { id: "msg-" + now + "-hired", conversationId: convo.id, senderId: "rick", text: text, createdAt: now, status: "delivered", deliveryStatus: "delivered", flaggedRisk: false, isSystem: true };
    state.messages.push(hiredMessage);
    convo.lastMessage = text;
    state.ratings.push({ id: "rating-pending-" + now, conversationId: convo.id, jobId: convo.jobId, workerId: convo.workerId, employerId: convo.employerId, status: "pending", createdAt: now, showAfter: now + 6 * 3600000 });
    save();
    return { application: hiredApp || null, conversation: convo, message: hiredMessage };
  }
  async function disconnectMatchRemote(result) {
    if (!result) return;
    if (result.application) await updateApplicationStatusRemote(result.application);
    if (result.conversation) await updateConversationRemote(result.conversation);
  }
  function hasSubmittedRating(convo) {
    if (!convo) return true;
    return state.ratings.some(function (rating) {
      return rating.conversationId === convo.id && rating.fromRole === currentRole && rating.status === "submitted";
    });
  }
  function t(key) { return copy[currentLang] && copy[currentLang][key] ? copy[currentLang][key] : (copy.en && copy.en[key] ? copy.en[key] : key); }
  function byId(id) { return document.getElementById(id); }
  function toast(message) {
    var node = byId("toast");
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { node.classList.remove("show"); }, 1800);
  }
  function notify(text, target) {
    state.notifications.unshift({ id: "note-" + Date.now(), text: text, target: target || "notifications", read: false, createdAt: Date.now() });
    state.notifications = state.notifications.slice(0, 20);
    save();
  }
  function routeAfterOtp() {
    var hasWorker = hasWorkerProfile();
    var hasEmployer = hasEmployerProfile();
    var lastMode = localStorage.getItem("kkLastMode") || localStorage.getItem("kkRole");
    if (!hasWorker && !hasEmployer) return show("role");
    if (hasWorker && !hasEmployer) { currentRole = "worker"; localStorage.setItem("kkRole", "worker"); return show("jobs"); }
    if (hasEmployer && !hasWorker) { currentRole = "employer"; localStorage.setItem("kkRole", "employer"); return show("employerDash"); }
    if (lastMode === "employer") { currentRole = "employer"; localStorage.setItem("kkRole", "employer"); return show("employerDash"); }
    if (lastMode === "worker") { currentRole = "worker"; localStorage.setItem("kkRole", "worker"); return show("jobs"); }
    show("role");
  }
  function defaultEditReturnScreen() {
    return currentRole === "employer" ? "employerProfile" : "profile";
  }
  function unsafeEditReturnScreen(id) {
    return ["landing","otp","otpCode","role","workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","employerSetup"].indexOf(id) >= 0;
  }
  function safeEditReturnScreen(id) {
    if (!id || unsafeEditReturnScreen(id)) return defaultEditReturnScreen();
    return id;
  }
  function beginEditMode(returnTo) {
    editReturnScreen = safeEditReturnScreen(returnTo || currentScreen || defaultEditReturnScreen());
    isEditMode = true;
    menuReturn = editReturnScreen;
  }
  function profileEditReturnTarget() {
    return safeEditReturnScreen(editReturnScreen || menuReturn || defaultEditReturnScreen());
  }
  function clearEditMode() {
    isEditMode = false;
    editReturnScreen = "";
    profileEditMode = "";
    editingProfileField = "";
    editDraft = {};
    editDirty = false;
  }
  function returnFromEditMode() {
    var target = profileEditReturnTarget();
    clearEditMode();
    show(target);
  }
  function hasEmployerProfile() {
    return !!(state.employerComplete && state.defaultBusinessId && state.businessProfiles && state.businessProfiles[state.defaultBusinessId]);
  }
  function isEmployerRoute(id) {
    return ["employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile"].indexOf(id) >= 0;
  }
  function goToEmployerRoute(targetRoute) {
    if (!hasEmployerProfile()) {
      pendingEmployerRoute = targetRoute || "employerDash";
      localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
      if (!setupReturnRoute && ["landing","otp","otpCode","role"].indexOf(currentScreen) < 0) {
        setupReturnRoute = currentScreen || "jobs";
        localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      }
      toast("Set up your business first.");
      return show("employerSetup");
    }
    return show(targetRoute || "employerDash");
  }
  function currentBusinessProfile() {
    return state.businessProfiles && state.defaultBusinessId ? state.businessProfiles[state.defaultBusinessId] : null;
  }
  function applyStructuredLocation(target, loc) {
    if (!loc) return;
    if (target === "user" || target === "accountLocation") {
      Object.assign(state.user, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
    }
    if (target === "worker" || target === "accountLocation") {
      Object.assign(state.worker, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
        Object.assign(state.workerProfiles[state.defaultWorkerId], { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng, updatedAt: Date.now() });
      }
    }
    if (target === "employer" || target === "accountLocation") {
      Object.assign(state.employer, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
      var business = currentBusinessProfile();
      if (business) Object.assign(business, { city: loc.city, district: loc.district, state: loc.state, country: loc.country, location: loc.formatted_location, formatted_location: loc.formatted_location, place_id: loc.place_id, lat: loc.lat, lng: loc.lng });
    }
  }
  function hasWorkerProfile() {
    return !!(state.workerComplete && state.defaultWorkerId && state.workerProfiles && state.workerProfiles[state.defaultWorkerId]);
  }
  function isWorkerRoute(id) {
    return ["jobs","applied","search","applications","profile"].indexOf(id) >= 0;
  }
  function goToWorkerRoute(targetRoute) {
    if (!hasWorkerProfile()) {
      pendingWorkerRoute = targetRoute || "jobs";
      localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
      if (!setupReturnRoute && ["landing","otp","otpCode","role"].indexOf(currentScreen) < 0) {
        setupReturnRoute = currentScreen || "employerDash";
        localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      }
      toast("Create your worker profile first.");
      return show("workerBasic");
    }
    return show(targetRoute || "jobs");
  }
  function isAuthenticated() {
    return !!(state.user && state.user.authenticated);
  }
  function isPublicScreen(id) {
    return ["landing", "otp", "otpCode", "legal"].indexOf(id) >= 0;
  }
  function isWorkerSetupScreen(id) {
    return ["workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress"].indexOf(id) >= 0;
  }
  function canOpenScreen(id) {
    return isPublicScreen(id) || isAuthenticated();
  }
  function currentWorkerProfile() {
    return state.workerProfiles && state.defaultWorkerId ? state.workerProfiles[state.defaultWorkerId] : null;
  }
  function initials(value) {
    return String(value || "KK").trim().split(/\s+/).slice(0, 2).map(function (part) { return part.charAt(0).toUpperCase(); }).join("") || "KK";
  }
  function workerLocationLine() {
    var city = state.worker.city || state.user.city || "your city";
    var region = state.worker.state && state.worker.state !== city ? city + ", " + state.worker.state : city;
    return "Based in " + region + ", available for nearby opportunities";
  }
  function workerExperienceLine() {
    if (!state.worker.experience) return "Experience details not added yet";
    return /experience|retail|customer/i.test(state.worker.experience) ? state.worker.experience : state.worker.experience + " experience in retail and customer-facing roles";
  }
  function workerWorkLine() {
    if (state.worker.jobTypes && state.worker.jobTypes.length) return "Open to " + state.worker.jobTypes.slice(0, 3).join(", ") + (state.worker.jobTypes.length > 3 ? " and more roles" : " roles");
    if (state.worker.workTypes && state.worker.workTypes.length) return "Open to " + state.worker.workTypes.join(", ").toLowerCase() + " roles";
    if (!state.worker.preferredJob || state.worker.preferredJob === "Any Job") return "Open to full-time and part-time roles";
    return /^open/i.test(state.worker.preferredJob) ? state.worker.preferredJob : "Open to " + state.worker.preferredJob + " roles";
  }
  function workerAvailabilityLine() {
    if (state.worker.flexibleAvailability) return "Open to any day and any time";
    var start = state.worker.startAvailability || "";
    var days = state.worker.availableDays || [];
    if (start === "On Demand") return "Available on demand, flexible schedule";
    if (start === "Specific Date") return "Available from a specific date for planned shifts";
    if (!start && !days.length && !state.worker.shiftPreference) return "Availability not added yet";
    if (!days.length || days.length === 7) return (start || "Available") + " for weekday and weekend shifts";
    return (start || "Available") + " on " + days.join(", ") + " for " + (state.worker.shiftPreference || "selected").toLowerCase() + " shifts";
  }
  function resetVisibilityChoice() {
    postVisibility = "";
    document.querySelectorAll(".visibility-plans .plan").forEach(function (plan) { plan.classList.remove("selected"); });
    var publish = byId("publishJobBtn");
    var error = byId("visibilityError");
    if (publish) publish.disabled = true;
    if (error) error.style.display = "none";
  }
  function flashJobCard(kind) {
    var card = document.querySelector("#jobFeed .job-card");
    if (!card) return;
    card.classList.remove("swipe-like", "swipe-skip");
    card.classList.add(kind === "like" ? "swipe-like" : "swipe-skip");
    clearTimeout(flashJobCard.timer);
    flashJobCard.timer = setTimeout(function () {
      card.classList.remove("swipe-like", "swipe-skip");
    }, 150);
  }
  function recordSwipe(applied) {
    var today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("kkAppliedDate") !== today) {
      appliedToday = 0;
      localStorage.setItem("kkAppliedDate", today);
    }
    swipeCount += 1;
    if (applied) appliedToday += 1;
    localStorage.setItem("kkSwipeCount", String(swipeCount));
    localStorage.setItem("kkAppliedToday", String(appliedToday));
    if (applied && appliedToday > 0 && appliedToday % 3 === 0) {
      setTimeout(function () { toast(appliedToday + " jobs applied today \uD83D\uDD25"); }, 850);
    }
  }
  function indiaDateParts(date) {
    var parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(date || new Date());
    var out = {};
    parts.forEach(function (part) {
      if (part.type !== "literal") out[part.type] = part.value;
    });
    return out;
  }
  function indiaDateKey(ms) {
    var parts = indiaDateParts(new Date(ms || Date.now()));
    return [parts.year, parts.month, parts.day].join("-");
  }
  function nextIndiaResetMs(ms) {
    var now = ms || Date.now();
    var parts = indiaDateParts(new Date(now));
    var reset = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 18, 30, 0, 0);
    return reset <= now ? reset + 86400000 : reset;
  }
  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
  }
  function workerSwipeIdentity() {
    var profile = currentWorkerProfile();
    return {
      userId: state.user && state.user.id ? state.user.id : "",
      workerId: (profile && (profile.workerId || profile.id)) || state.defaultWorkerId || (state.worker && state.worker.id) || ""
    };
  }
  function swipeLimitRecordKey(identity, dateKey) {
    identity = identity || workerSwipeIdentity();
    return ["worker-swipe", identity.userId || "local-user", identity.workerId || "local-worker", dateKey || indiaDateKey()].join(":");
  }
  function swipeLimitPlan() {
    return WORKER_PLUS_ENABLED && state.user && state.user.workerPlusEnabled ? workerSwipePlans.plus : workerSwipePlans.free;
  }
  function makeSwipeLimitRecord(identity, dateKey) {
    var plan = swipeLimitPlan();
    var now = Date.now();
    return {
      id: "",
      user_id: identity.userId || "",
      worker_id: identity.workerId || "",
      swipe_date: dateKey || indiaDateKey(now),
      daily_swipe_count: 0,
      total_swipes_today: 0,
      daily_limit: plan.dailyLimit,
      cooldown_level: 0,
      cooldown_until: null,
      reset_at: new Date(nextIndiaResetMs(now)).toISOString(),
      plan: "free",
      worker_plus_enabled: false,
      created_at: new Date(now).toISOString(),
      updated_at: new Date(now).toISOString()
    };
  }
  function normalizeSwipeLimitRecord(record, identity, dateKey) {
    identity = identity || workerSwipeIdentity();
    dateKey = dateKey || indiaDateKey();
    var now = Date.now();
    var plan = swipeLimitPlan();
    var nextReset = nextIndiaResetMs(now);
    if (!record || record.swipe_date !== dateKey) return makeSwipeLimitRecord(identity, dateKey);
    record.user_id = record.user_id || identity.userId || "";
    record.worker_id = record.worker_id || identity.workerId || "";
    record.daily_limit = Number(record.daily_limit || plan.dailyLimit);
    record.daily_swipe_count = Math.max(0, Number(record.daily_swipe_count || 0));
    record.total_swipes_today = Math.max(0, Number(record.total_swipes_today || 0));
    record.cooldown_level = Math.max(0, Number(record.cooldown_level || 0));
    record.reset_at = record.reset_at || new Date(nextReset).toISOString();
    if (new Date(record.reset_at).getTime() <= now && record.swipe_date !== dateKey) return makeSwipeLimitRecord(identity, dateKey);
    if (record.cooldown_until && new Date(record.cooldown_until).getTime() <= now) {
      record.cooldown_until = null;
    }
    record.plan = record.plan || "free";
    record.worker_plus_enabled = !!record.worker_plus_enabled;
    return record;
  }
  function currentSwipeLimitRecord() {
    state.workerSwipeLimits = state.workerSwipeLimits || {};
    var identity = workerSwipeIdentity();
    var dateKey = indiaDateKey();
    var key = swipeLimitRecordKey(identity, dateKey);
    var before = JSON.stringify(state.workerSwipeLimits[key] || {});
    var record = normalizeSwipeLimitRecord(state.workerSwipeLimits[key], identity, dateKey);
    state.workerSwipeLimits[key] = record;
    if (JSON.stringify(record) !== before) save();
    return record;
  }
  function swipeLimitStatus() {
    var record = currentSwipeLimitRecord();
    var cooldownUntil = record.cooldown_until ? new Date(record.cooldown_until).getTime() : 0;
    var now = Date.now();
    var inCooldown = cooldownUntil > now;
    return {
      record: record,
      inCooldown: inCooldown,
      cooldownMs: inCooldown ? cooldownUntil - now : 0,
      remaining: inCooldown ? 0 : Math.max(0, Number(record.daily_limit || 25) - Number(record.daily_swipe_count || 0)),
      dailyLimit: Number(record.daily_limit || 25)
    };
  }
  function formatCooldownTime(ms) {
    var minutes = Math.max(1, Math.ceil(Number(ms || 0) / 60000));
    var hours = Math.floor(minutes / 60);
    var rest = minutes % 60;
    if (!hours) return minutes + "m";
    return hours + "h" + (rest ? " " + rest + "m" : "");
  }
  function renderSwipeLimitCounter(status) {
    status = status || swipeLimitStatus();
    if (status.inCooldown) return "";
    var remaining = status.remaining;
    var text = remaining === status.dailyLimit ? remaining + " swipes available today" : remaining + " swipes left today";
    var notice = remaining <= 5 ? '<p class="small">' + remaining + ' swipes left today. Choose the best jobs.</p>' : "";
    return '<div class="swipe-limit-counter ' + (remaining <= 5 ? "warning" : "") + '"><span>' + text + '</span>' + notice + '</div>';
  }
  function renderSwipeCooldownCard(status) {
    status = status || swipeLimitStatus();
    return '<div class="panel cooldown-card center"><span class="badge amber">Daily swipe balance</span><h3>You\'ve used today\'s fast apply limit.</h3><p class="small">More jobs unlock in ' + formatCooldownTime(status.cooldownMs) + '.</p><p class="small">You can still check Applications, Chat, and Profile.</p><p class="small">Daily swipe limits keep applications serious, so employers get better matches.</p><div class="cooldown-actions"><button class="btn primary" data-go="applications">View Applications</button><button class="btn outline" data-go="profile">Improve Profile</button></div></div>';
  }
  function scheduleSwipeCooldownRefresh(status) {
    clearTimeout(swipeCooldownTimer);
    if (!status || !status.inCooldown || currentScreen !== "jobs") return;
    swipeCooldownTimer = setTimeout(function () {
      renderFeed();
    }, 30000);
  }
  function showSwipeCooldownNotice() {
    renderFeed();
    toast("More jobs unlock soon.");
  }
  async function persistSwipeLimitRecord(record) {
    record.updated_at = new Date().toISOString();
    save();
    await saveSwipeLimitRemote(record);
  }
  async function consumeWorkerSwipe(applied) {
    var status = swipeLimitStatus();
    if (status.inCooldown) {
      showSwipeCooldownNotice();
      return { allowed: false, cooldown: true };
    }
    var record = status.record;
    var now = Date.now();
    record.daily_swipe_count = Number(record.daily_swipe_count || 0) + 1;
    record.total_swipes_today = Number(record.total_swipes_today || 0) + 1;
    var cooldownStarted = false;
    if (record.daily_swipe_count >= Number(record.daily_limit || 25)) {
      record.cooldown_level = Math.min(3, Number(record.cooldown_level || 0) + 1);
      record.daily_swipe_count = 0;
      var until = record.cooldown_level === 1 ? now + 2 * 3600000 : (record.cooldown_level === 2 ? now + 8 * 3600000 : new Date(record.reset_at).getTime());
      record.cooldown_until = new Date(until).toISOString();
      cooldownStarted = true;
    }
    await persistSwipeLimitRecord(record);
    recordSwipe(!!applied);
    return { allowed: true, cooldownStarted: cooldownStarted, record: record };
  }
  function show(id) {
    if (!canOpenScreen(id)) {
      id = "landing";
    } else if (isAuthenticated()) {
      if (isEmployerRoute(id) && id !== "employerSetup" && !hasEmployerProfile()) {
        pendingEmployerRoute = id;
        localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
        id = "employerSetup";
      }
      if (isWorkerRoute(id) && !isWorkerSetupScreen(id) && !hasWorkerProfile()) {
        pendingWorkerRoute = id;
        localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
        id = "workerBasic";
      }
      if (id === "chat" && currentRole === "employer" && !hasEmployerProfile()) {
        pendingEmployerRoute = "chat";
        localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
        id = "employerSetup";
      }
      if (id === "chat" && currentRole !== "employer" && !hasWorkerProfile()) {
        pendingWorkerRoute = "chat";
        localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
        id = "workerBasic";
      }
    }
    var target = byId(id);
    if (!target) return toast("Please try again.");
    var employerScreens = ["employerSetup","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile"];
    var workerScreens = ["workerBasic","workerWork","workerSkills","workerLocation","workerTrust","verifyId","verifyProgress","jobs","applied","search","applications","employerPublicProfile"];
    if (employerScreens.indexOf(id) >= 0 && !(id === "employerSetup" && setupReturnRoute)) currentRole = "employer";
    if (workerScreens.indexOf(id) >= 0 && !(id === "workerBasic" && setupReturnRoute)) currentRole = "worker";
    localStorage.setItem("kkRole", currentRole);
    localStorage.setItem("kkLastMode", currentRole);
    if (id === "menu" && currentScreen !== "menu") menuReturn = currentScreen;
    if ((id === "legal" || id === "report") && currentScreen !== id) menuReturn = currentScreen;
    var forward = routeOrder.indexOf(id) >= routeOrder.indexOf(currentScreen);
    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active","was-left","was-right");
      if (screen.id !== id) screen.classList.add(forward ? "was-left" : "was-right");
    });
    target.classList.add("active");
    target.classList.remove("was-left","was-right");
    currentScreen = id;
    if (id === "verifyId") startPhotoCamera(); else stopPhotoCamera();
    var body = target.querySelector(".screen-body");
    if (body) body.scrollTop = 0;
    render();
    track("screen_" + id);
  }
  function navScreenIds() {
    return ["jobs","applied","search","applications","profile","accountSettings","profileEdit","legal","report","notifications","employerPublicProfile","employerDash","employerJobDetail","workerProfileView","postJob","jobVisibility","published","applicants","employerJobs","employerProfile","chat"];
  }
  function setupScreenBodies() {
    var navScreens = navScreenIds();
    document.querySelectorAll(".screen").forEach(function (screen) {
      if (!screen.querySelector(":scope > .screen-body")) {
        var body = document.createElement("div");
        body.className = "screen-body";
        Array.from(screen.childNodes).forEach(function (node) {
          if (node.nodeType === 1 && node.classList && node.classList.contains("header")) return;
          body.appendChild(node);
        });
        screen.appendChild(body);
      }
      screen.classList.toggle("has-header", !!screen.querySelector(":scope > .header"));
      screen.classList.toggle("has-nav", navScreens.indexOf(screen.id) >= 0);
    });
  }
  function renderAppHeader() {
    if (!byId("appHeader")) return;
    var source = byId(currentScreen) ? byId(currentScreen).querySelector(":scope > .header") : null;
    if (source) {
      var clone = source.cloneNode(true);
      if ((currentScreen === "employerSetup" || currentScreen === "workerBasic") && setupReturnRoute) {
        var homeButton = clone.querySelector("[data-go]");
        if (homeButton) {
          homeButton.removeAttribute("data-go");
          homeButton.setAttribute("data-setup-home", "true");
          homeButton.textContent = "Home";
        }
      }
      var headerClass = "header" + (source.classList.contains("chat-detail-header") ? " chat-detail-header" : "");
      byId("appHeader").innerHTML = '<div class="' + headerClass + '">' + clone.innerHTML + '</div>';
    } else {
      byId("appHeader").innerHTML = "";
    }
    var app = document.querySelector(".app");
    if (app) app.classList.toggle("has-header", !!source);
  }
  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem("kaamkaroLang", lang);
    localStorage.setItem("kkLang", lang);
    render();
  }
  function applyCopy() {
    document.documentElement.lang = currentLang === "hi" ? "hi" : "en";
    document.querySelectorAll("[data-lang]").forEach(function (button) { button.classList.toggle("active", button.dataset.lang === currentLang); });
    document.querySelectorAll("[data-i18n]").forEach(function (node) { node.textContent = t(node.dataset.i18n); });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (node) { node.setAttribute("placeholder", t(node.dataset.i18nPlaceholder)); });
  }
  function initLocationAutocomplete() {
    if (window.KaamKaroLocation && window.KaamKaroLocation.attachAll) {
      window.KaamKaroLocation.attachAll(document);
    }
  }
  function fillBasicDefaults() {
    fillLocationDatalist("");
    if (byId("locationSearch")) byId("locationSearch").value = state.worker.city || "";
    if (byId("businessName")) byId("businessName").value = state.employer.business || "";
    if (byId("contactName")) byId("contactName").value = state.employer.name || "";
    if (byId("businessType")) byId("businessType").value = state.employer.type || "";
    if (byId("businessPhone")) byId("businessPhone").value = state.employer.phone || (byId("phoneInput") ? byId("phoneInput").value : "") || "";
    if (byId("businessLocation")) byId("businessLocation").value = state.employer.formatted_location ? formatLocationLabel(state.employer) : "";
    if (byId("otpPhoneText")) byId("otpPhoneText").textContent = "+91 " + (((byId("phoneInput") && byId("phoneInput").value) || state.user.phone || state.employer.phone || "0000000000").trim());
  }
  function renderCategories() {
    if (!byId("workCategories")) return;
    byId("workCategories").innerHTML = workCategories.slice(0, 8).map(function (cat) {
      var selected = (state.worker.jobTypes || []).indexOf(cat) >= 0;
      return '<button class="choice ' + (selected ? "selected" : "") + '" data-work-cat="' + cat + '"><span class="ci">' + cat.slice(0,1) + '</span>' + cat + '</button>';
    }).join("");
    var any = document.querySelector("[data-any-job]");
    if (any) any.classList.toggle("selected", state.worker.preferredJob === "Any Job");
    if (byId("jobTypeCounter")) byId("jobTypeCounter").textContent = (state.worker.jobTypes || []).length ? state.worker.jobTypes.length + "/2 selected" : "Show all on";
    if (byId("selectedJobTypes")) {
      var base = state.worker.preferredJob === "Any Job" ? '<button class="chip selected" data-any-job>Show All Jobs</button>' : "";
      var selectedTypes = (state.worker.jobTypes || []).map(function (type) {
        return '<button class="chip selected skill-pill" data-remove-job-type="' + type + '">' + type + ' <span>x</span></button>';
      }).join("");
      byId("selectedJobTypes").innerHTML = base + selectedTypes;
    }
  }
  function renderPhotoStatus() {
    if (byId("photoStatus")) {
      byId("photoStatus").textContent = state.worker.photoVerified ? "Photo uploaded successfully" : "Verified accounts may appear more prominently to employers.";
    }
  }
  function profileStrength() {
    var phoneVerified = !!(state.user.phoneVerified || state.worker.phoneVerified);
    var photoVerified = state.user.photoVerificationStatus === "verified" || state.user.photoVerified === true || state.worker.photoVerified === true;
    if (phoneVerified && photoVerified) return 100;
    if (phoneVerified) return 70;
    return 0;
  }
  function renderPhotoBadge() {
    var slot = byId("photoBadgeSlot");
    if (!slot) return;
    if (state.user.photoVerificationStatus === "verified" || state.worker.photoVerified) {
      slot.innerHTML = '<span class="badge">Photo Verified</span>';
    } else {
      slot.innerHTML = '<button class="badge muted" data-edit-photo>Verify Photo</button><p class="small mt">Complete your profile to increase visibility.</p>';
    }
  }
  function applyPhotoVerified(src) {
    state.user.photoVerificationStatus = "verified";
    state.user.photoVerified = true;
    state.worker.photoVerified = true;
    state.worker.photo_url = src || state.worker.photo_url || "local-photo-verified";
    if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
      state.workerProfiles[state.defaultWorkerId].photo_url = state.worker.photo_url;
      state.workerProfiles[state.defaultWorkerId].photoVerificationStatus = "verified";
      state.workerProfiles[state.defaultWorkerId].photo_verified = true;
      state.workerProfiles[state.defaultWorkerId].updatedAt = Date.now();
    }
    save();
  }
  function workerPhotoBadgeHtml() {
    return (state.user.photoVerificationStatus === "verified" || state.worker.photoVerified) ? '<span class="badge">Photo Verified</span>' : '<span class="small">No photo</span>';
  }
  function employerPublicData(job) {
    job = job || state.jobs.find(function (item) { return item.id === selectedJobId; }) || state.jobs[0] || {};
    var business = (job.businessId && state.businessProfiles && state.businessProfiles[job.businessId]) || currentBusinessProfile() || {};
    var createdAt = business.createdAt || job.createdAt || Date.now();
    var ageDays = Math.max(0, Math.floor((Date.now() - createdAt) / 86400000));
    var badge = ageDays > 180 ? "Verified Employer" : (ageDays > 90 ? "Trusted" : (ageDays > 30 ? "Active" : "New Employer"));
    return {
      name: business.businessName || job.companyName || job.employer || state.employer.business || "Employer",
      city: business.city || job.city || state.employer.city || state.user.city || "Location not set",
      type: business.type || state.employer.type || "Business",
      badge: badge,
      jobsPosted: state.jobs.filter(function (item) { return item.businessId === job.businessId || item.employer === job.employer; }).length || state.jobs.length,
      hires: state.applications.filter(function (app) { return app.status === "Hired"; }).length,
      joined: ageDays < 1 ? "Joined today" : (ageDays + " days on Kaam Karo"),
      safety: (job.reportCount || 0) > 2 ? "Under review" : "No active safety flags"
    };
  }
  function openPublicEmployerProfile(jobId) {
    selectedJobId = jobId || selectedJobId;
    publicProfileReturn = currentScreen || "jobs";
    show("employerPublicProfile");
  }
  function descriptionWordCount(text) {
    return String(text || "").trim().split(/\s+/).filter(Boolean).length;
  }
  function renderPostDescCounter() {
    var desc = byId("postDesc");
    if (!desc) return;
    var words = descriptionWordCount(desc.value);
    if (byId("postDescCounter")) byId("postDescCounter").textContent = words + " / 15 words minimum";
    if (byId("postDescError")) byId("postDescError").style.display = words > 0 && words < 15 ? "block" : "none";
  }
  function addDescriptionSentence(kind) {
    var desc = byId("postDesc");
    if (!desc) return;
    var suggestions = {
      tasks: "Daily tasks include helping customers, handling basic work, keeping the area clean, and supporting the team during busy hours.",
      shift: "Shift timing and working days will be discussed clearly before the worker starts the job.",
      experience: "Previous experience is preferred, but training can be provided if the worker is reliable and willing to learn.",
      location: "Exact workplace location and reporting instructions will be shared after the applicant is accepted.",
      tools: "Any uniform, tools, or special requirements will be explained before the first working day."
    };
    var sentence = suggestions[kind] || "";
    if (!sentence) return;
    desc.value = ((desc.value.trim() ? desc.value.trim() + "\n\n" : "") + sentence).slice(0, 700);
    renderPostDescCounter();
    desc.focus();
  }
  function openModal(title, body) {
    if (!byId("appModal")) return;
    byId("modalTitle").textContent = title;
    byId("modalBody").innerHTML = body;
    byId("appModal").classList.add("show");
  }
  function closeModal() {
    if (byId("appModal")) byId("appModal").classList.remove("show");
  }
  function showUndo(message) {
    if (!byId("undoBar")) return;
    byId("undoText").textContent = message || "Action done";
    byId("undoBar").classList.add("show");
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () { byId("undoBar").classList.remove("show"); lastSwipe = null; }, 5000);
  }
  function addWorkerJobType(type) {
    var value = String(type || "").trim();
    if (!value) return;
    state.worker.jobTypes = state.worker.jobTypes || [];
    if (state.worker.jobTypes.indexOf(value) >= 0) return;
    if (state.worker.jobTypes.length >= 2) return toast("Choose up to two job types.");
    state.worker.jobTypes.push(value);
    state.worker.preferredJob = state.worker.jobTypes.join(" / ");
    if (byId("workSearch")) byId("workSearch").value = "";
    save();
    renderCategories();
    toast(value + " added");
  }
  function displayCity(value) {
    return String(value || "").split(",")[0].trim();
  }
  function setActiveCity(value) {
    activeCity = displayCity(value);
    localStorage.setItem("kkActiveCity", activeCity);
    locationMode = "city";
    activeFilter = "all";
    if (byId("jobSearch")) byId("jobSearch").value = "";
    document.querySelectorAll("[data-filter]").forEach(function (chip) { chip.classList.toggle("selected", chip.dataset.filter === "all"); });
    jobIndex = 0;
    renderFeed();
    if (activeCity) toast("Showing " + activeCity);
  }
  function renderSkills() {
    byId("skillChips").innerHTML = skillOptions.map(function (skill) {
      return '<button class="chip ' + (state.worker.skills.indexOf(skill) >= 0 ? "preset-selected" : "") + '" data-skill="' + skill + '">' + skill + '</button>';
    }).join("");
    if (byId("skillCounter")) byId("skillCounter").textContent = state.worker.skills.length + " skills selected";
    if (byId("yourSkills")) {
      byId("yourSkills").innerHTML = state.worker.skills.length ? state.worker.skills.map(function (skill) {
        return '<button class="chip selected skill-pill" data-remove-skill="' + skill + '">' + skill + ' <span>x</span></button>';
      }).join("") : '<span class="small">No skills selected yet.</span>';
    }
  }
  function renderOnboardingAvailability() {
    if (!byId("onboardDays")) return;
    var days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
    var selectedDays = state.worker.availableDays || [];
    var allSelected = days.every(function (day) { return selectedDays.indexOf(day) >= 0; });
    byId("onboardDays").innerHTML = days.map(function (day) {
      var selected = selectedDays.indexOf(day) >= 0;
      return '<button class="choice ' + (selected ? "selected" : "") + '" data-onboard-day="' + day + '"><span class="ci">' + (selected ? "OK" : "") + '</span>' + day + '</button>';
    }).join("");
    document.querySelectorAll("[data-onboard-start]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.onboardStart === state.worker.startAvailability);
    });
    var flexible = document.querySelector("[data-flexible-availability]");
    if (flexible) flexible.classList.toggle("selected", !!state.worker.flexibleAvailability);
    if (byId("onboardStartOptions")) byId("onboardStartOptions").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    if (byId("onboardDays")) byId("onboardDays").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    var allButton = document.querySelector("[data-onboard-all-days]");
    if (allButton) allButton.classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    if (byId("onboardShifts")) byId("onboardShifts").classList.toggle("disabled-section", !!state.worker.flexibleAvailability);
    var all = document.querySelector("[data-onboard-all-days]");
    if (all) all.classList.toggle("selected", allSelected);
    document.querySelectorAll("[data-onboard-shift]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.onboardShift === state.worker.shiftPreference);
    });
  }
  function startPhotoCamera() {
    var video = byId("photoCamera");
    var status = byId("photoCameraStatus");
    if (!video || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (status) status.textContent = "Camera is not available here. You can skip for now.";
      return;
    }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false }).then(function (stream) {
      video.srcObject = stream;
      if (status) status.textContent = "Camera ready. Keep one clear face in the frame.";
    }).catch(function () {
      if (status) status.textContent = "Camera permission was not allowed. You can continue without photo.";
    });
  }
  function stopPhotoCamera() {
    var video = byId("photoCamera");
    if (video && video.srcObject) {
      video.srcObject.getTracks().forEach(function (track) { track.stop(); });
      video.srcObject = null;
    }
  }
  function renderPayPrefs() {
    if (!byId("payRange")) return;
    payOpen = state.worker.openAnyPay !== false;
    var open = document.querySelector("[data-open-pay]");
    if (open) open.classList.toggle("selected", payOpen);
    byId("payRange").style.display = payOpen ? "none" : "block";
    if (byId("payPref")) byId("payPref").value = state.worker.payRange || "";
    document.querySelectorAll("[data-pay-type]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.payType === (state.worker.payType || "Daily"));
    });
    document.querySelectorAll("[data-pay-range]").forEach(function (button) {
      button.classList.toggle("selected", button.dataset.payRange === state.worker.payRange);
    });
  }
  function filteredJobs(query) {
    var q = "";
    var selectedCity = activeCity || state.worker.city || state.user.city || "";
    var city = selectedCity.toLowerCase();
    function isWorkerVisibleJob(job) {
      return (job.status || "approved") === "approved" && (!job.expiresAt || job.expiresAt > Date.now());
    }
    var list = state.jobs.filter(function (job) {
      if (!isWorkerVisibleJob(job)) return false;
      if (activeFilter === "remote" || locationMode === "remote") return job.remote;
      if (activeFilter === "near") return !job.remote;
      if (activeFilter === "all" && city) return job.remote || String(job.city || "").toLowerCase() === city;
      if (state.worker.preferredJob && state.worker.preferredJob !== "Any Job") {
        var pref = state.worker.preferredJob.toLowerCase().split(" / ")[0];
        if ((job.title + " " + job.type + " " + job.desc).toLowerCase().indexOf(pref) < 0 && activeFilter !== "all") return false;
      }
      if (q && (job.title + " " + job.city + " " + job.employer).toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    if (!list.length) {
      if (byId("feedNotice")) byId("feedNotice").textContent = city ? "No jobs very close - showing nearby options in " + selectedCity + "." : "Showing nearby options.";
      list = state.jobs.filter(function (job) { return isWorkerVisibleJob(job) && (!job.remote || locationMode === "remote"); });
      if (!list.length && allowPrototypeFixtures()) list = cloneJobs();
    } else {
      if (byId("feedNotice")) {
        if (activeFilter === "remote") byId("feedNotice").textContent = "You are seeing jobs you can do from home.";
        else if (activeFilter === "near") byId("feedNotice").textContent = "You are seeing jobs near you.";
        else if (activeCity) byId("feedNotice").textContent = "You are seeing jobs in " + activeCity + ".";
        else byId("feedNotice").textContent = "You are seeing jobs in " + (selectedCity || "your city") + " and remote jobs.";
      }
    }
    function payValue(job) {
      return Number(String(job.pay || "").replace(/[^\d]/g, "")) || 0;
    }
    function distanceValue(job) {
      if (job.remote) return 4;
      if (String(job.distance).toLowerCase().indexOf("near") >= 0) return 1;
      return Number(String(job.distance || "").replace(/[^\d.]/g, "")) || 8;
    }
    function score(job) {
      var text = (job.title + " " + job.desc + " " + job.type).toLowerCase();
      var skillMatch = (state.worker.skills || []).some(function (s) { return text.indexOf(String(s).toLowerCase().split(" ")[0]) >= 0; }) ? 40 : 0;
      var boost = (job.visibility === "boost" || job.badge === "Urgent") ? 100 : 0;
      return boost + skillMatch + Math.max(0, 25 - distanceValue(job) * 4) + Math.min(25, payValue(job) / 1000);
    }
    return list.sort(function (a, b) { return score(b) - score(a); });
  }
  function jobCard(job) {
    var applied = state.applications.find(function (a) { return a.jobId === job.id && a.workerId === state.worker.id; });
    return '<article class="job-card" data-open-job-modal="' + job.id + '">' +
      '<div class="job-hero"><div><div class="pay">' + job.pay + '</div><h2>' + job.title + '</h2><p>Location: ' + job.distance + '</p></div><div><span class="badge">Employer: ' + job.badge + '</span><div class="job-hook mt">Start today - 2 shifts</div></div></div>' +
      '<div class="job-meta"><div class="trust-line">No fees required</div><div class="meta"><span>' + job.type + '</span><button class="report-link" data-open-employer-profile="' + job.id + '">' + job.employer + '</button><span>Posted 3h ago</span><span>Hiring today</span></div><p class="small">' + job.desc + '</p><button class="report-link" data-report="job">Report job</button></div>' +
      '</article><div class="swipe"><button class="circle danger-action" aria-label="Not interested" data-next-job><svg><use href="#i-x"></use></svg></button><button class="circle like-action" aria-label="Interested" data-apply-job="' + job.id + '"><svg><use href="#i-heart"></use></svg></button></div><div class="swipe-labels"><span>Not interested</span><span>Interested</span></div>';
  }
  function renderFeed() {
    if (!byId("jobFeed")) return;
    hydrateSwipeLimitRemote(false).then(function (record) {
      if (record && currentScreen === "jobs") renderFeed();
    });
    var swipeStatus = swipeLimitStatus();
    scheduleSwipeCooldownRefresh(swipeStatus);
    if (swipeStatus.inCooldown) {
      byId("jobFeed").innerHTML = renderSwipeCooldownCard(swipeStatus);
      var cooldownLabel = activeFilter === "remote" ? "Remote" : (activeFilter === "near" ? "Nearby" : (activeCity || state.worker.city || state.user.city || "your city"));
      if (byId("feedSub")) byId("feedSub").textContent = cooldownLabel;
      if (byId("selectedCityChip")) byId("selectedCityChip").innerHTML = activeCity ? '<button class="chip selected" data-clear-city>' + activeCity + ' <span>x</span></button>' : "";
      return;
    }
    var list = filteredJobs("");
    if (jobIndex >= list.length) jobIndex = 0;
    var variation = swipeCount > 0 && swipeCount % 4 === 0 ? '<div class="panel small">Urgent hiring near you - verified employers only.</div>' : "";
    byId("jobFeed").innerHTML = renderSwipeLimitCounter(swipeStatus) + (list.length ? variation + '<div class="swipe-stack"><div class="stack-card third"></div><div class="stack-card second"></div>' + jobCard(list[jobIndex]) + '</div>' : '<div class="panel center"><h3>No jobs right now - try nearby areas</h3><p class="small">Try widening your choices.</p><button class="btn outline mt" data-worker-home-edit="availability">Update availability</button><button class="btn outline mt" data-refresh-jobs>Refresh</button><button class="btn primary mt" data-worker-home-edit="location">Search another city</button></div>');
    var label = activeFilter === "remote" ? "Remote" : (activeFilter === "near" ? "Nearby" : (activeCity || state.worker.city || state.user.city || "your city"));
    if (byId("feedSub")) byId("feedSub").textContent = label;
    if (byId("selectedCityChip")) byId("selectedCityChip").innerHTML = activeCity ? '<button class="chip selected" data-clear-city>' + activeCity + ' <span>x</span></button>' : "";
  }
  async function applyToJob(id) {
    if (!hasWorkerProfile()) return goToWorkerRoute("jobs");
    if (swipeLimitStatus().inCooldown) return showSwipeCooldownNotice();
    var today = new Date().toISOString().slice(0, 10);
    if (localStorage.getItem("kkAppliedDate") !== today) {
      appliedToday = 0;
      localStorage.setItem("kkAppliedDate", today);
    }
    if (appliedToday >= 100) return toast("Daily application limit reached. Please try again tomorrow.");
    selectedJobId = id || filteredJobs("")[jobIndex].id;
    var selectedJob = state.jobs.find(function (job) { return job.id === selectedJobId; }) || {};
    if (!selectedJob.id || (selectedJob.status || "approved") !== "approved" || (selectedJob.expiresAt && selectedJob.expiresAt <= Date.now())) {
      return toast("This job is no longer available.");
    }
    var exists = state.applications.find(function (a) { return a.jobId === selectedJobId && a.workerId === state.worker.id; });
    var app = exists;
    if (exists && exists.status !== "Rejected") return toast("Already applied to this job.");
    if (!exists) {
      app = { id: "app-" + Date.now(), jobId: selectedJobId, workerId: state.worker.id, employerId: selectedJob.businessId || selectedJob.employerId || "", status: "Interested", createdAt: Date.now() };
      state.applications.push(app);
    } else if (exists.status === "Rejected") {
      exists.status = "Interested";
    }
    state.worker.active = true;
    save();
    await saveApplicationRemote(app, selectedJob);
    track("application_created");
    lastSwipe = null;
    flashJobCard("like");
    toast("Applied");
    if (byId("undoBar")) byId("undoBar").classList.remove("show");
    var swipeResult = await consumeWorkerSwipe(true);
    if (!swipeResult.allowed) return;
    setTimeout(function () { toast("Employer will review your profile"); }, 500);
    if (swipeResult.cooldownStarted) {
      renderFeed();
      return;
    }
    show("applied");
    setTimeout(function () {
      if (currentScreen === "applied") show("jobs");
    }, 5000);
  }
  async function nextJob() {
    var list = filteredJobs(byId("jobSearch") ? byId("jobSearch").value : "");
    if (!list.length) return;
    if (swipeLimitStatus().inCooldown) return showSwipeCooldownNotice();
    lastSwipe = { type: "skip", index: jobIndex };
    flashJobCard("skip");
    var swipeResult = await consumeWorkerSwipe(false);
    if (!swipeResult.allowed) return;
    if (swipeResult.cooldownStarted) {
      lastSwipe = null;
      if (byId("undoBar")) byId("undoBar").classList.remove("show");
      renderFeed();
      toast("More jobs unlock soon.");
      return;
    }
    jobIndex = (jobIndex + 1) % list.length;
    renderFeed();
    toast("Not interested");
    showUndo("Skipped job");
    track("job_swipe_left");
  }
  function renderSearch() {
    var q = byId("manualSearch") ? byId("manualSearch").value : "";
    var list = filteredJobs(q);
    if (!q.trim()) {
      byId("searchResults").innerHTML = '<div class="panel small">Search is optional. Swipe feed stays the fastest way to apply.</div>';
      return;
    }
    byId("searchResults").innerHTML = list.map(function (job) {
      return '<button class="list-row" data-select-job="' + job.id + '"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + ' - ' + job.distance + '</span></span><span class="status-text">Apply</span></button>';
    }).join("");
  }
  function renderWorkerApplications() {
    var allApps = state.applications.filter(function (a) { return a.workerId === state.worker.id; });
    var matchedApps = allApps.filter(function (a) { return ["Accepted","Matched"].indexOf(a.status) >= 0; });
    var appliedApps = allApps.filter(function (a) { return ["Interested","Viewed"].indexOf(a.status) >= 0; });
    var apps = applicationsTab === "matched" ? matchedApps : appliedApps;
    byId("matchedTag").textContent = matchedApps.length + " matched";
    var tabs = '<div class="toolbar"><button class="chip ' + (applicationsTab === "applied" ? "selected" : "") + '" data-applications-tab="applied">Applied</button><button class="chip ' + (applicationsTab === "matched" ? "selected" : "") + '" data-applications-tab="matched">Matched</button></div>';
    byId("workerApplications").innerHTML = tabs + (apps.length ? apps.map(function (app) {
      var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || { title: "Job", employer: "Employer", pay: "", city: "" };
      var convo = conversationForApp(app);
      var statusText = applicationsTab === "matched" ? "Matched" : "Waiting for employer";
      var action = applicationsTab === "matched" ? '<button class="icon" data-remove-match="' + app.id + '"><svg><use href="#i-trash"></use></svg></button>' : '<button class="icon" data-withdraw-app="' + app.id + '"><svg><use href="#i-x"></use></svg></button>';
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br><button class="report-link" data-open-employer-profile="' + job.id + '">' + (job.employer || "Employer") + '</button><br>Status: ' + statusText + '</span></span><span class="status-pill status-' + app.status.toLowerCase() + '">' + (applicationsTab === "matched" ? "Matched" : "Waiting") + '</span>' + (applicationsTab === "matched" && convo ? '<button class="icon" data-open-conversation="' + convo.id + '"><svg><use href="#i-message"></use></svg></button>' : '') + action + '</div>';
    }).join("") : '<div class="panel small">' + (applicationsTab === "matched" ? "No matched jobs yet." : "No applications yet. Swipe right on a job to apply.") + '</div>');
  }
  function appForSelected() { return state.applications.find(function (a) { return a.jobId === selectedJobId && a.workerId === selectedWorkerId; }); }
  function statusClass(status) { return "status-" + String(status || "Interested").toLowerCase(); }
  function workerSummaryForApp(app) {
    var profile = app && state.workerProfiles ? state.workerProfiles[app.workerId] : null;
    if (!profile && app && app.workerId === state.worker.id) profile = state.worker;
    profile = profile || {};
    return {
      id: app ? app.workerId : (profile.id || state.worker.id),
      name: profile.name || profile.full_name || state.worker.name || "Worker",
      age: profile.age || state.worker.age || "",
      city: profile.city || state.worker.city || "Location not set",
      experience: profile.experience || state.worker.experience || "Experience not added",
      skills: Array.isArray(profile.skills) ? profile.skills : (Array.isArray(state.worker.skills) ? state.worker.skills : []),
      jobTypes: Array.isArray(profile.jobTypes) ? profile.jobTypes : (Array.isArray(profile.preferred_jobs) ? profile.preferred_jobs : (Array.isArray(state.worker.jobTypes) ? state.worker.jobTypes : [])),
      preferredJob: profile.preferredJob || state.worker.preferredJob || "Open to suitable jobs",
      availability: profile.availability || state.worker.availability || "Availability not added",
      locationLine: profile.location || profile.formatted_location || profile.city || state.worker.formatted_location || state.worker.city || "",
      photoVerified: !!(profile.photo_verified || profile.photoVerified || (app && app.workerId === state.worker.id && state.worker.photoVerified))
    };
  }
  function workerProfileBadgeHtml(worker) {
    return worker && worker.photoVerified
      ? '<span class="badge green">Photo Verified</span>'
      : '<span class="badge">Verify Photo</span>';
  }
  function renderApplicantCard(app) {
    var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || { id: app.jobId, title: "Job" };
    var w = workerSummaryForApp(app);
    var convo = conversationForApp(app);
    var pending = ["Interested","Viewed"].indexOf(app.status) >= 0;
    if (!pending) {
      return '<div class="list-row accepted-applicant-card">' +
        '<div class="accepted-applicant-top"><b>' + w.name + '</b><span class="status-pill ' + statusClass(app.status) + '">Matched</span></div>' +
        '<div class="accepted-applicant-meta"><span>' + [w.age, w.city, w.experience].filter(Boolean).join(" / ") + '</span><span>' + (w.skills.slice(0,3).join(", ") || "Skills not added") + '</span></div>' +
        '<div class="accepted-applicant-actions"><button class="reject-btn" data-open-worker="' + w.id + '" data-job-id="' + job.id + '">View Profile</button>' + (convo ? '<button class="accept-btn" data-open-conversation="' + convo.id + '">Chat</button>' : '') + '<button class="reject-btn" data-remove-accepted-app="' + app.id + '">Disconnect</button></div>' +
      '</div>';
    }
    var actions = '<div class="applicant-actions"><button class="reject-btn" data-reject-app="' + app.id + '">X</button><button class="accept-btn" data-accept-app="' + app.id + '">Accept</button></div>';
    return '<div class="list-row"><button class="grow" style="border:0;background:transparent;text-align:left;padding:0;color:inherit" data-open-worker="' + w.id + '" data-job-id="' + job.id + '"><b>' + w.name + '</b><br><span class="small">' + [w.age, w.city, w.experience].filter(Boolean).join(" - ") + '<br>' + (w.skills.slice(0,3).join(", ") || "Skills not added") + '</span><div class="mt">' + workerProfileBadgeHtml(w) + '</div></button><span class="status-pill ' + statusClass(app.status) + '">' + app.status + '</span>' + actions + '</div>';
  }
  function renderEmployer() {
    if (!hasEmployerProfile()) return;
    var jobs = employerJobs();
    var jobIds = jobs.map(function (job) { return job.id; });
    var apps = state.applications.filter(function (app) { return jobIds.indexOf(app.jobId) >= 0 || app.employerId === state.defaultBusinessId; });
    var interested = apps.filter(function (a) { return ["Interested","Viewed"].indexOf(a.status) >= 0; }).length;
    var accepted = apps.filter(function (a) { return ["Accepted","Matched"].indexOf(a.status) >= 0; }).length;
    byId("dashTitle").textContent = interested ? interested + " applicants waiting" : "No applicants yet";
    byId("metricInterested").textContent = interested;
    byId("metricAccepted").textContent = accepted;
    byId("metricJobs").textContent = jobs.length;
    byId("dashJobs").innerHTML = jobs.length ? ((interested ? "" : '<div class="panel small">No applicants yet - post or boost a job to get more visibility.</div>') + jobs.slice(0,2).map(function (job) {
      var count = apps.filter(function (a) { return a.jobId === job.id; }).length;
      return '<button class="list-row" data-job-detail="' + job.id + '"><span class="tiny"><svg><use href="#i-briefcase"></use></svg></span><span class="grow"><b>' + job.title + '</b><br><span class="small">' + job.pay + ' - ' + job.city + '<br>12 workers viewed your job - 3 applied today</span></span><span class="status-text">' + count + ' applicants</span></button>';
    }).join("")) : '<div class="panel small"><b>Post your first job</b><br>No applicants yet. Create your first job to start receiving workers.</div>';
    var job = jobs.find(function (j) { return j.id === selectedJobId; }) || jobs[0] || {};
    byId("jobDetailTitle").textContent = job.title || "No job selected";
    byId("jobDetailPay").textContent = job.pay || "";
    byId("jobDetailMeta").textContent = job.id ? (job.city + " - " + job.type + " - " + job.employer) : "Post a job to receive applicants.";
    if (byId("jobDetailActions")) {
      byId("jobDetailActions").innerHTML = !job.id ? "" : (isLiveEditableJob(job)
        ? '<button class="btn outline" data-edit-job="' + job.id + '">Manage / Edit Job</button>'
        : '<button class="btn outline" data-repost-job="' + job.id + '">Repost</button>');
    }
    var jobApps = job.id ? apps.filter(function (a) { return a.jobId === job.id && (applicantsTab === "accepted" ? ["Accepted","Matched"].indexOf(a.status) >= 0 : ["Interested","Viewed"].indexOf(a.status) >= 0); }) : [];
    var applicantTabs = '<div class="toolbar"><button class="chip ' + (applicantsTab === "new" ? "selected" : "") + '" data-applicants-tab="new">New</button><button class="chip ' + (applicantsTab === "accepted" ? "selected" : "") + '" data-applicants-tab="accepted">Accepted</button></div>';
    byId("applicantList").innerHTML = applicantTabs + (jobApps.length ? jobApps.map(renderApplicantCard).join("") : '<div class="panel small">No applicants in this tab yet.</div>');
    var tabApps = apps.filter(function (a) { return applicantsTab === "accepted" ? ["Accepted","Matched"].indexOf(a.status) >= 0 : ["Interested","Viewed"].indexOf(a.status) >= 0; });
    byId("allApplicants").innerHTML = applicantTabs + (tabApps.length ? tabApps.map(renderApplicantCard).join("") : '<div class="panel small">No applicants in this tab yet.</div>');
    byId("talentCount").textContent = apps.length + " applicants";
    byId("employerJobsList").innerHTML = jobs.length ? jobs.map(function (j) {
      var manage = isLiveEditableJob(j)
        ? '<button class="icon" data-edit-job="' + j.id + '" aria-label="Edit job"><svg><use href="#i-edit"></use></svg></button>'
        : '<button class="icon" data-repost-job="' + j.id + '" aria-label="Repost job"><svg><use href="#i-plus"></use></svg></button>';
      return '<div class="list-row"><button class="grow" data-job-detail="' + j.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + j.title + '</b><br><span class="small">' + j.pay + ' - ' + j.city + '</span></button><span class="status-text">' + (isLiveEditableJob(j) ? "Open" : "Expired") + '</span>' + manage + '<button class="icon" data-delete-job="' + j.id + '"><svg><use href="#i-trash"></use></svg></button></div>';
    }).join("") : '<div class="panel small">Post your first job to see it here.</div>';
  }
  function renderFullWorkerProfile() {
    var app = appForSelected() || { status: "Interested" };
    var w = workerSummaryForApp(app);
    var badges = '<span class="badge blue">Profile Complete</span><span class="badge amber">Active</span>';
    var accepted = ["Accepted","Matched"].indexOf(app.status) >= 0;
    var convo = conversationForApp(app);
    var strength = w.photoVerified ? 100 : 70;
    byId("profileStatus").textContent = app.status;
    byId("profileStatus").className = "tag";
    byId("fullWorkerProfile").innerHTML =
      '<div class="panel profile-hero"><span class="avatar">' + initials(w.name || "Worker") + '</span><span class="grow"><h2>' + (w.name || "Worker") + '</h2><p>' + (w.city || "Location not set") + '</p><div class="toolbar">' + badges + workerProfileBadgeHtml(w) + '</div></span></div>' +
      '<div class="panel"><div class="kv"><span>Profile strength</span><b>' + strength + '%</b></div><div class="progress"><span class="on" style="flex-basis:' + strength + '%"></span><span></span></div><p class="small">Safety note: Phone numbers and private account settings are never shown to employers.</p></div>' +
      '<button class="profile-card"><span><span>Location</span><b>' + (w.locationLine ? "Based in " + w.city + ", available for nearby opportunities" : "Location not added") + '</b></span></button>' +
      '<button class="profile-card"><span><span>Experience</span><b>' + w.experience + '</b></span></button>' +
      '<button class="profile-card"><span><span>Preferred job types</span><b>' + ((w.jobTypes || []).join(", ") || w.preferredJob || "Open to suitable jobs") + '</b></span></button>' +
      '<button class="profile-card"><span><span>Availability</span><b>' + w.availability + '</b></span></button>' +
      '<div class="panel"><b>Skills</b><div class="toolbar">' + ((w.skills || []).length ? w.skills.map(function (s) { return '<span class="badge blue">' + s + '</span>'; }).join("") : '<span class="small">No skills added yet</span>') + '</div></div>' +
      '<div class="metric-grid profile-metrics"><div class="metric-card"><span>Rating</span><b>New</b></div><div class="metric-card"><span>Completed jobs</span><b>0</b></div></div>';
    if (byId("workerProfileActions")) {
      byId("workerProfileActions").innerHTML = accepted
        ? '<button class="btn outline" data-open-conversation="' + (convo ? convo.id : "") + '">Chat</button><button class="btn danger" data-remove-accepted-app="' + app.id + '">Disconnect</button>'
        : '<button class="btn danger" data-reject-current>Reject</button><button class="btn primary" data-accept-current>Accept & Chat</button>';
    }
  }
  function renderEmployerProfile() {
    if (!byId("employerProfileName")) return;
    var business = currentBusinessProfile();
    byId("employerProfileName").textContent = business ? business.businessName : "Employer Profile";
    byId("employerProfileMeta").textContent = business ? (business.city || state.user.city || "Location") : "Business profile not set";
    if (byId("employerAvatar")) byId("employerAvatar").textContent = initials(business ? business.businessName : state.user.displayName);
    if (byId("employerBusinessText")) byId("employerBusinessText").textContent = business ? business.businessName : "Set up your business profile";
    if (byId("employerContactText")) byId("employerContactText").textContent = business ? business.contactPersonName : (state.user.displayName || "Contact person");
    if (byId("employerLocationText")) byId("employerLocationText").textContent = "Based in " + (business ? (business.city || state.user.city || "your city") : (state.user.city || "your city"));
    if (byId("employerTypeText")) byId("employerTypeText").textContent = business ? (business.type || "Business") : "Not set";
    if (byId("employerProfileBadges")) {
      var createdAt = business ? (business.createdAt || Date.now()) : Date.now();
      var ageDays = (Date.now() - createdAt) / 86400000;
      var badge = ageDays > 180 ? "Verified Employer" : (ageDays > 90 ? "Trusted" : (ageDays > 30 ? "Active" : "New Employer"));
      byId("employerProfileBadges").innerHTML = '<span class="badge blue">' + badge + '</span><span class="badge">Phone Verified</span>';
    }
    byId("employerOpenJobsView").textContent = state.jobs.length;
    if (byId("employerApplicantStatsView")) byId("employerApplicantStatsView").textContent = state.applications.length;
  }
  function renderPublicEmployerProfile() {
    if (!byId("publicEmployerProfile")) return;
    var job = state.jobs.find(function (item) { return item.id === selectedJobId; }) || state.jobs[0] || {};
    var data = employerPublicData(job);
    byId("publicEmployerProfile").innerHTML =
      '<div class="panel profile-hero"><span class="avatar">' + initials(data.name) + '</span><span class="grow"><h2>' + data.name + '</h2><p>' + data.city + '</p><div class="toolbar"><span class="badge blue">' + data.badge + '</span><span class="badge">' + data.safety + '</span></div></span></div>' +
      '<div class="metric-grid profile-metrics"><div class="metric-card"><span>Jobs posted</span><b>' + data.jobsPosted + '</b></div><div class="metric-card"><span>Hires completed</span><b>' + data.hires + '</b></div></div>' +
      '<button class="profile-card"><span><span>Business type</span><b>' + data.type + '</b></span></button>' +
      '<button class="profile-card"><span><span>Location</span><b>Based in ' + data.city + '</b></span></button>' +
      '<button class="profile-card"><span><span>Account age</span><b>' + data.joined + '</b></span></button>' +
      '<button class="profile-card"><span><span>Rating</span><b>New</b></span></button>' +
      '<div class="panel small">Safety note: Kaam Karo does not show employer phone numbers, payment details, or private account settings here.</div>' +
      '<button class="btn outline mt" data-report="profile">Report employer</button>';
  }
  function renderAccountSettings() {
    var phone = state.user.phone || state.employer.phone || "";
    var displayName = state.user.displayName || state.worker.name || "Kaam Karo user";
    var city = state.user.city || state.worker.city || "";
    if (byId("drawerName")) byId("drawerName").textContent = displayName;
    if (byId("drawerPhone")) byId("drawerPhone").textContent = phone ? ("+91 " + phone) : "Secure phone login";
    if (!byId("accountNameView")) return;
    byId("accountNameView").textContent = displayName;
    byId("accountLocationView").textContent = city || "Add location";
    byId("accountPhone").textContent = phone ? ("+91 " + phone) : "Not added";
    var workerActive = hasWorkerProfile();
    var employerActive = hasEmployerProfile();
    byId("workerAccountStatus").textContent = workerActive ? "Active" : "Not set up";
    byId("employerAccountStatus").textContent = employerActive ? "Active" : "Not set up";
    if (byId("accountModeLine")) byId("accountModeLine").textContent = currentRole === "employer" ? "Employer" : "Worker";
    var deleteButton = byId("deleteAccountBtn");
    if (deleteButton) deleteButton.disabled = true;
    if (byId("deleteConfirmPhone")) byId("deleteConfirmPhone").value = "";
    if (byId("deletePhoneError")) byId("deletePhoneError").textContent = "";
  }
  function saveAccountSettings() {
    var name = byId("accountName").value.trim() || state.user.displayName || state.worker.name;
    var city = byId("accountLocation").value.trim() || state.user.city || state.worker.city;
    state.user.displayName = name;
    state.user.city = city;
    state.user.location = city;
    state.worker.name = name;
    state.worker.city = city;
    if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) {
      state.workerProfiles[state.defaultWorkerId].name = name;
      state.workerProfiles[state.defaultWorkerId].city = city;
      state.workerProfiles[state.defaultWorkerId].location = city;
      state.workerProfiles[state.defaultWorkerId].updatedAt = Date.now();
    }
    state.employer.name = name;
    state.employer.city = city;
    if (state.defaultBusinessId && state.businessProfiles[state.defaultBusinessId]) {
      state.businessProfiles[state.defaultBusinessId].contactPersonName = name;
      state.businessProfiles[state.defaultBusinessId].city = city;
    }
    save();
    render();
    toast("Account updated.");
  }
  function profileEditConfig(field) {
    var business = currentBusinessProfile();
    var configs = {
      accountName: { title: "Edit Name", label: "Name", value: state.user.displayName || state.worker.name || "", hint: "Used across profile, chat and employer contact.", type: "text" },
      accountLocation: { title: "Location", label: "Search city or area", value: state.user.city || state.worker.city || "", hint: "Choose the area used across Kaam Karo.", type: "location" },
      workerLocation: { title: "Location", label: "Search city or area", value: state.worker.city || state.user.city || "", hint: "Choose your work city", type: "location", suggestions: ["Delhi","Amritsar","Pune","Kochi","Surat","Tiruchirappalli","Karimnagar","Mumbai","Bengaluru","Hyderabad","Chandigarh","Jaipur"] },
      workerAge: { title: "Edit Age", label: "Age", value: state.worker.age || "", hint: "Used only to help employers understand your profile.", type: "number" },
      workerGender: { title: "Edit Gender", label: "Gender", value: state.worker.gender || "", hint: "Optional profile detail.", type: "gender" },
      workerSkills: { title: "Edit Skills", label: "Type a skill", value: "", hint: "Keep selected skills visible and controlled.", type: "skills" },
      workerExperience: { title: "Experience", label: "Experience", value: state.worker.experience || "", hint: "Select one option.", type: "experience" },
      workerWork: { title: "Work Preferences", label: "Work preferences", value: "", hint: "Select the work types that fit you.", type: "work" },
      workerAvailability: { title: "Availability", label: "Availability", value: "", hint: "Select days and preferred shift.", type: "availability" },
      workerPay: { title: "Preferred Pay", label: "Preferred pay", value: state.worker.payRange || "", hint: "Optional. Keep it realistic and clear.", type: "text" },
      businessName: { title: "Edit Business Name", label: "Business name", value: business ? business.businessName : state.employer.business, hint: "Shown to workers on jobs and chat.", type: "text" },
      contactPerson: { title: "Edit Contact Person", label: "Contact person", value: business ? business.contactPersonName : state.employer.name, hint: "Used as the hiring contact.", type: "text" },
      employerLocation: { title: "Location", label: "Search city or area", value: business ? business.city : state.user.city, hint: "Choose the default hiring location.", type: "location" },
      businessLocation: { title: "Location", label: "Search city or area", value: business ? business.city : state.user.city, hint: "Choose the default hiring location.", type: "location" },
      businessType: { title: "Edit Business Type", label: "Business type", value: business ? business.type : state.employer.type, hint: "Example: Retail Shop, Office, Restaurant.", type: "text" }
    };
    var cfg = Object.assign({}, configs[field] || configs.accountName);
    if (profileEditMode === "home_empty_state_edit" && field === "workerAvailability") {
      cfg.title = "Update availability";
      cfg.hint = "Choose when you're available for work.";
    }
    if (profileEditMode === "home_empty_state_edit" && field === "workerLocation") {
      cfg.title = "Search another city";
      cfg.label = "City, village or area";
      cfg.hint = "Choose a city, village or area to find nearby jobs.";
    }
    return cfg;
  }
  function markEditDirty() {
    editDirty = true;
    document.querySelectorAll("[data-save-profile-edit]").forEach(function (button) { button.disabled = false; });
  }
  function profileEditActionsHtml() {
    var saveLabel = "Save Changes";
    if (profileEditMode === "home_empty_state_edit" && editingProfileField === "workerAvailability") saveLabel = "Save availability";
    if (profileEditMode === "home_empty_state_edit" && editingProfileField === "workerLocation") saveLabel = "Save location";
    return '<div class="profile-edit-actions"><button class="btn outline" data-cancel-profile-edit>Cancel</button><button class="btn primary" data-save-profile-edit ' + (editDirty ? "" : "disabled") + '>' + saveLabel + '</button></div>';
  }
  function setProfileEditSaveState() {
    document.querySelectorAll("[data-save-profile-edit]").forEach(function (button) { button.disabled = !editDirty; });
  }
  function openProfileEdit(field, options) {
    editingProfileField = field;
    profileEditMode = (options && options.mode) || "edit";
    var cfg = profileEditConfig(field);
    beginEditMode((options && options.returnTo) || currentScreen);
    editDirty = false;
    editDraft = { value: cfg.value || "" };
    if (cfg.type === "skills") editDraft.skills = (state.worker.skills || []).slice();
    if (cfg.type === "work") editDraft.workTypes = (state.worker.workTypes || ["Full-time","Part-time"]).slice();
    if (cfg.type === "availability") {
      editDraft.days = (state.worker.availableDays || ["Monday","Tuesday","Friday"]).slice();
      editDraft.shift = state.worker.shiftPreference || "Morning";
      editDraft.start = state.worker.startAvailability || "Immediate";
    }
    byId("profileEditTitle").textContent = cfg.title;
    byId("profileEditHint").textContent = cfg.hint;
    if (byId("profileEditSaveTop")) byId("profileEditSaveTop").textContent = profileEditMode === "home_empty_state_edit" && field === "workerAvailability" ? "Save" : (profileEditMode === "home_empty_state_edit" && field === "workerLocation" ? "Save" : "Save");
    show("profileEdit");
  }
  function openPhotoEdit(options) {
    beginEditMode((options && options.returnTo) || currentScreen);
    show("verifyId");
  }
  function renderProfileEdit() {
    if (!byId("profileEditBody")) return;
    var cfg = profileEditConfig(editingProfileField);
    setProfileEditSaveState();
    if (!editingProfileField) return;
    var body = byId("profileEditBody");
    if (cfg.type === "skills") {
      var suggested = ["Cleaning","Driving","Customer Service","Data Entry","Excel","Inventory Handling","Food Service","Basic Accounting","Communication","Sales","Packing","Warehouse Work"];
      body.innerHTML =
        '<div class="edit-card"><div class="section-label">Your Skills</div><div class="edit-chip-row">' + (editDraft.skills || []).map(function (skill) { return '<button class="edit-chip selected skill-remove" data-edit-remove-skill="' + skill + '">' + skill + '<span>x</span></button>'; }).join("") + '</div></div>' +
        '<div class="edit-card"><label>Add Skills</label><div class="input"><input id="profileEditInput" placeholder="Type a skill"></div><button class="btn outline mt" data-edit-add-skill>+ Add Skill</button></div>' +
        '<div class="edit-card"><div class="section-label">Suggested Skills</div><div class="edit-chip-row">' + suggested.map(function (skill) { return '<button class="edit-chip ' + ((editDraft.skills || []).indexOf(skill) >= 0 ? "selected" : "") + '" data-edit-suggest-skill="' + skill + '">' + skill + '</button>'; }).join("") + '</div></div>' +
        profileEditActionsHtml();
      return;
    }
    if (cfg.type === "experience") {
      var exp = ["No experience","Less than 1 year","1-2 years","2-5 years","5+ years"];
      body.innerHTML = '<div class="edit-card">' + exp.map(function (item) { var selected = editDraft.value === item || (!editDraft.value && item === "No experience"); return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-option="' + item + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + item + '</button>'; }).join("") + '</div>' + profileEditActionsHtml();
      return;
    }
    if (cfg.type === "gender") {
      var genders = ["Male","Female","Other","Prefer not to say"];
      body.innerHTML = '<div class="edit-card">' + genders.map(function (item) { var selected = editDraft.value === item; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-option="' + item + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + item + '</button>'; }).join("") + '</div>' + profileEditActionsHtml();
      return;
    }
    if (cfg.type === "work") {
      var types = ["Full-time","Part-time","Contract","Temporary","Internship"];
      body.innerHTML = '<div class="edit-card">' + types.map(function (item) { var selected = (editDraft.workTypes || []).indexOf(item) >= 0; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-work="' + item + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + item + '</button>'; }).join("") + '</div>' + profileEditActionsHtml();
      return;
    }
    if (cfg.type === "availability") {
      var days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var shifts = ["Morning","Afternoon","Evening"];
      var starts = ["Immediate","On Demand","Specific Date"];
      var allSelected = days.every(function (day) { return (editDraft.days || []).indexOf(day) >= 0; });
      body.innerHTML =
        '<div class="edit-card"><div class="section-label">Start Availability</div>' + starts.map(function (start) { var selected = editDraft.start === start; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-start="' + start + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + start + '</button>'; }).join("") + '</div>' +
        '<div class="edit-card"><div class="section-label">Days</div><button class="option-row ' + (allSelected ? "selected" : "") + '" data-edit-all-days><span class="option-dot">' + (allSelected ? "OK" : "") + '</span>Select All Days</button><div class="grid mt">' + days.map(function (day) { var selected = (editDraft.days || []).indexOf(day) >= 0; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-day="' + day + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + day + '</button>'; }).join("") + '</div></div>' +
        '<div class="edit-card"><div class="section-label">Shift preference</div>' + shifts.map(function (shift) { var selected = editDraft.shift === shift; return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-shift="' + shift + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span>' + shift + '</button>'; }).join("") + '</div>' +
        profileEditActionsHtml();
      return;
    }
    if (cfg.type === "location") {
      var suggestions = locationMatches(editDraft.value || "");
      body.innerHTML =
        '<div class="edit-card"><label>' + cfg.label + '</label><div class="input"><input id="profileEditInput" placeholder="City, district, state" value="' + (editDraft.value || "") + '" data-location-input="profileEdit"></div></div>' +
        '<div class="edit-card"><div class="section-label">Suggestions</div>' + suggestions.map(function (loc) { var selected = editDraft.value === loc.formatted_location || editDraft.value === formatLocationLabel(loc); return '<button class="option-row ' + (selected ? "selected" : "") + '" data-edit-location="' + loc.place_id + '"><span class="option-dot">' + (selected ? "OK" : "") + '</span><span><b>' + escapeHtml(formatLocationLabel(loc)) + '</b><br><span class="small">' + escapeHtml(loc.formatted_location) + '</span></span></button>'; }).join("") + '</div>' +
        profileEditActionsHtml();
      return;
    }
    body.innerHTML = '<div class="edit-card"><label>' + cfg.label + '</label><div class="input"><input id="profileEditInput" ' + (cfg.type === "number" ? 'inputmode="numeric" ' : '') + 'placeholder="Type here" value="' + (editDraft.value || "") + '"></div></div>' + profileEditActionsHtml();
  }
  async function saveProfileEdit() {
    var input = byId("profileEditInput");
    var value = input ? input.value.trim() : (editDraft.value || "");
    var business = currentBusinessProfile();
    var cfg = profileEditConfig(editingProfileField);
    var selectedEditLocation = cfg.type === "location" ? (editDraft.location || selectedLocationFromInput(value)) : null;
    if (cfg.type === "location" && !selectedEditLocation) return toast("Please select a location from the list.");
    if (cfg.type !== "skills" && cfg.type !== "availability" && cfg.type !== "work" && !value) return toast("Please add a value.");
    if (editingProfileField === "accountName") {
      state.user.displayName = value;
      state.worker.name = value;
      state.employer.name = value;
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) state.workerProfiles[state.defaultWorkerId].name = value;
      if (business) business.contactPersonName = value;
    }
    if (editingProfileField === "accountLocation") {
      applyStructuredLocation("accountLocation", selectedEditLocation);
    }
    if (editingProfileField === "workerLocation") {
      applyStructuredLocation("user", selectedEditLocation);
      applyStructuredLocation("worker", selectedEditLocation);
    }
    if (editingProfileField === "workerAge") {
      state.worker.age = value.replace(/\D/g, "").slice(0, 3);
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) state.workerProfiles[state.defaultWorkerId].age = state.worker.age;
    }
    if (editingProfileField === "workerGender") {
      state.worker.gender = value;
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) state.workerProfiles[state.defaultWorkerId].gender = value;
    }
    if (editingProfileField === "workerSkills") state.worker.skills = (editDraft.skills || []).slice();
    if (editingProfileField === "workerExperience") state.worker.experience = value;
    if (editingProfileField === "workerWork") {
      state.worker.workTypes = (editDraft.workTypes || []).slice();
      state.worker.preferredJob = state.worker.workTypes.join(", ");
    }
    if (editingProfileField === "workerAvailability") {
      state.worker.availableDays = (editDraft.days || []).slice();
      state.worker.shiftPreference = editDraft.shift || "Morning";
      state.worker.startAvailability = editDraft.start || "Immediate";
      state.worker.availability = workerAvailabilityLine();
    }
    if (editingProfileField === "workerPay") {
      state.worker.payRange = value;
      state.worker.openAnyPay = !value;
      if (state.defaultWorkerId && state.workerProfiles[state.defaultWorkerId]) state.workerProfiles[state.defaultWorkerId].preferredPay = value || "Open to any pay";
    }
    if (editingProfileField === "businessName") { state.employer.business = value; if (business) business.businessName = value; }
    if (editingProfileField === "contactPerson") { state.employer.name = value; state.user.displayName = value; if (business) business.contactPersonName = value; }
    if (editingProfileField === "employerLocation" || editingProfileField === "businessLocation") { applyStructuredLocation("user", selectedEditLocation); applyStructuredLocation("employer", selectedEditLocation); }
    if (editingProfileField === "businessType") { state.employer.type = value; if (business) business.type = value; }
    save();
    var savedField = editingProfileField;
    var returnTarget = isEditMode ? profileEditReturnTarget() : (menuReturn || (currentRole === "employer" ? "employerProfile" : "profile"));
    if (["accountName","accountLocation","workerLocation","workerAge","workerGender","workerSkills","workerExperience","workerWork","workerAvailability","workerPay"].indexOf(savedField) >= 0) {
      await saveWorkerProfileRemote();
    }
    if (["accountLocation","businessName","contactPerson","employerLocation","businessLocation","businessType"].indexOf(savedField) >= 0) {
      await saveEmployerProfileRemote();
    }
    if (returnTarget === "jobs" && ["workerLocation","accountLocation"].indexOf(savedField) >= 0) {
      activeCity = state.worker.city || state.user.city || "";
      localStorage.setItem("kkActiveCity", activeCity || "");
      jobIndex = 0;
    }
    if (returnTarget === "jobs" && savedField === "workerAvailability") {
      jobIndex = 0;
    }
    toast("Updated successfully");
    if (isEditMode) clearEditMode();
    show(returnTarget);
  }
  function renderAdminQueue() {
    if (!hasEmployerProfile() && currentScreen !== "adminModeration") return;
    if (!byId("adminQueue")) return;
    var pending = state.jobs.filter(function (job) { return job.status === "pending_review"; }).sort(function (a, b) { return (b.riskScore || 0) - (a.riskScore || 0); });
    byId("adminPendingCount").textContent = pending.length + " pending";
    byId("adminQueue").innerHTML = pending.length ? pending.map(function (job) {
      return '<div class="panel"><div class="review-row"><span>Risk</span><b class="risk-score">' + (job.riskScore || 0) + '</b></div><h3>' + job.title + '</h3><p class="small">' + job.pay + ' - ' + job.city + ' - ' + job.type + '</p><p class="review-desc">' + job.desc + '</p><div class="kv"><span>Employer</span><b>' + job.employer + '</b></div><div class="kv"><span>Verification</span><b>' + (state.employer.phone ? "Phone verified" : "New") + '</b></div><div class="kv"><span>Previous posts</span><b>' + (job.previousPosts || 0) + '</b></div><div class="kv"><span>Reports</span><b>' + (job.reportCount || 0) + '</b></div><div class="flag-list">' + (job.flagReasons || []).map(function (r) { return '<span class="badge amber">' + r + '</span>'; }).join("") + '</div><div class="admin-actions"><button class="btn primary" data-admin-action="approve" data-job-id="' + job.id + '">Approve</button><button class="btn danger" data-admin-action="reject" data-job-id="' + job.id + '">Reject</button><button class="btn outline" data-admin-action="request_edit" data-job-id="' + job.id + '">Request Edit</button><button class="btn outline" data-admin-action="suspend" data-job-id="' + job.id + '">Suspend</button><button class="btn danger" data-admin-action="ban" data-job-id="' + job.id + '">Ban</button></div></div>';
    }).join("") : '<div class="panel small">No jobs waiting for review.</div>';
    byId("auditLogs").innerHTML = state.auditLogs.length ? state.auditLogs.slice(0, 8).map(function (log) {
      return '<div class="list-row"><span class="tiny"><svg><use href="#i-shield"></use></svg></span><span class="grow"><b>' + log.action + '</b><br><span class="small">' + log.reason + '<br>' + new Date(log.timestamp).toLocaleString() + '</span></span></div>';
    }).join("") : '<div class="panel small">No audit logs yet.</div>';
  }
  function chatAllowed(app) { return app && ["Accepted","Matched","Hired"].indexOf(app.status) >= 0; }
  function conversationForApp(app) { return app ? state.conversations.find(function (c) { return c.jobId === app.jobId && c.workerId === app.workerId; }) : null; }
  function isChatHidden(convo) {
    if (!convo || ["disconnected","expired","blocked","closed"].indexOf(convo.status) >= 0) return true;
    var list = currentRole === "employer" ? (convo.deletedForEmployer || []) : (convo.deletedForWorker || []);
    return list.indexOf(currentUserId()) >= 0;
  }
  function createConversation(app) {
    var existing = conversationForApp(app);
    if (existing) return existing;
    var job = state.jobs.find(function (j) { return j.id === app.jobId; }) || state.jobs[0];
    var now = Date.now();
    var starter = "Employer accepted your interest. You can now chat directly.";
    var convo = { id: "conv-" + now, jobId: app.jobId, workerId: app.workerId, employerId: "rick", status: "active", createdAt: now, updatedAt: now, lastActivityAt: now, lastMessage: starter, unreadWorker: 1, unreadEmployer: 0, favouriteWorker: false, favouriteEmployer: false, deletedForWorker: [], deletedForEmployer: [] };
    state.conversations.unshift(convo);
    state.messages.push({ id: "msg-" + now + "-system", conversationId: convo.id, senderId: "rick", text: starter, createdAt: now, status: "delivered", deliveryStatus: "delivered", flaggedRisk: false });
    app.status = "Matched";
    notify((state.employer.name || "Employer") + " accepted your application - start chat.", "chat");
    audit("conversation_created", "Employer accepted applicant", job, "system");
    save();
    return convo;
  }
  function currentConversation() { return selectedConversationId ? state.conversations.find(function (c) { return c.id === selectedConversationId; }) : null; }
  function conversationTitle(convo) {
    var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
    return currentRole === "employer" ? state.worker.name : (state.employer.name || job.employer);
  }
  function riskText(text) {
    return ["registration fee","deposit","pay first","joining fee","send money","documents charge"].some(function (term) { return text.toLowerCase().indexOf(term) >= 0; });
  }
  function blockedSafetyReason(text) {
    var value = String(text || "").toLowerCase();
    var rules = [
      { reason: "weapons", words: ["weapon","gun","pistol","knife","bomb","explosive"] },
      { reason: "drugs", words: ["drug","cocaine","heroin","ganja","narcotic"] },
      { reason: "sexual content", words: ["sex","sexual","prostitution","escort","adult service"] },
      { reason: "harassment", words: ["harass","threat","kill","abuse","hate"] },
      { reason: "scam or payment request", words: ["registration fee","deposit","pay first","joining fee","send money"] },
      { reason: "illegal work", words: ["illegal","fake document","money laundering","betting"] }
    ];
    for (var i = 0; i < rules.length; i += 1) {
      if (rules[i].words.some(function (word) { return value.indexOf(word) >= 0; })) return rules[i].reason;
    }
    return "";
  }
  function chatSpamReason(convo, text) {
    var now = Date.now();
    var sender = currentUserId();
    var normalized = normalizedPostText(text);
    var recent = state.messages.filter(function (message) {
      return message.conversationId === convo.id && messageSenderId(message) === sender && now - (message.createdAt || 0) < 60000;
    });
    if (recent.length >= 12) return "too many messages per minute";
    if (recent.slice(-3).some(function (message) { return normalizedPostText(message.text) === normalized; })) return "repeated same message";
    return "";
  }
  function currentUserId() {
    return currentRole === "employer" ? "rick" : state.worker.id;
  }
  function messageSenderId(message) {
    if (message.senderId === "system" && String(message.text || "").indexOf("Employer accepted your interest") === 0) return "rick";
    return message.senderId;
  }
  function messageStatus(message) {
    return message.deliveryStatus || message.status || "sent";
  }
  function markReceivedMessagesSeen(convo) {
    if (!convo) return;
    var changed = false;
    var changedMessages = [];
    state.messages.forEach(function (message) {
      if (message.conversationId !== convo.id) return;
      if (messageSenderId(message) === currentUserId()) return;
      if (message.deliveryStatus !== "seen" || message.status !== "seen") {
        message.deliveryStatus = "seen";
        message.status = "seen";
        message.seenAt = Date.now();
        changed = true;
        changedMessages.push(message);
      }
    });
    if (changed) {
      save();
      changedMessages.forEach(function (message) { updateMessageRemote(message); });
    }
  }
  function isSameDay(a, b) {
    var da = new Date(a);
    var db = new Date(b);
    return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
  }
  function clockLabel(time) {
    var d = new Date(time);
    var hours = d.getHours();
    var suffix = hours >= 12 ? "pm" : "am";
    var hour12 = hours % 12 || 12;
    return String(hour12).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0") + " " + suffix;
  }
  function dayDiff(time) {
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    var date = new Date(time);
    var start = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    return Math.round((today - start) / 86400000);
  }
  function dateSeparatorLabel(time) {
    var diff = dayDiff(time);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    var d = new Date(time);
    var label = d.getDate() + " " + d.toLocaleString("en", { month: "short" });
    if (d.getFullYear() !== new Date().getFullYear()) label += " " + d.getFullYear();
    return label;
  }
  function messageTimeLabel(time) {
    var diff = dayDiff(time);
    if (diff === 0) return clockLabel(time);
    if (diff === 1) return "Yesterday, " + clockLabel(time);
    return dateSeparatorLabel(time) + ", " + clockLabel(time);
  }
  function escapeHtml(text) {
    return String(text || "").replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function renderMessageText(text) {
    return escapeHtml(text)
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\b(\d{10})\b/g, '<a href="tel:$1">$1</a>');
  }
  function renderChatMessages(convo, messages) {
    if (!messages.length) return '<div class="panel center"><p class="small">No messages yet<br>Start the conversation.</p></div>';
    return messages.map(function (message, index) {
      var prev = messages[index - 1];
      var next = messages[index + 1];
      var sender = messageSenderId(message);
      var mine = sender === currentUserId();
      var prevSame = prev && messageSenderId(prev) === sender && isSameDay(prev.createdAt, message.createdAt) && Math.abs(message.createdAt - prev.createdAt) <= 300000;
      var nextSame = next && messageSenderId(next) === sender && isSameDay(next.createdAt, message.createdAt) && Math.abs(next.createdAt - message.createdAt) <= 300000;
      var html = "";
      if (!prev || !isSameDay(prev.createdAt, message.createdAt)) html += '<div class="date-sep">' + dateSeparatorLabel(message.createdAt) + '</div>';
      var meta = !nextSame ? '<small>' + messageTimeLabel(message.createdAt) + (mine ? ' &middot; ' + messageStatus(message) : '') + '</small>' : '';
      html += '<div class="msg ' + (mine ? "right" : "left") + (prevSame ? " tight" : "") + ((prevSame || nextSame) ? " mid" : "") + '">' + renderMessageText(message.text) + (message.flaggedRisk ? '<br><b>Warning: Never pay money to get a job.</b>' : '') + meta + '</div>';
      return html;
    }).join("");
  }
  function setChatHeader(title, subtitle) {
    document.querySelectorAll("#chatTitle").forEach(function (node) { node.textContent = title; });
    document.querySelectorAll("#chatSub").forEach(function (node) { node.textContent = subtitle; });
  }
  function renderChatList(convos) {
    byId("chat").classList.add("chat-no-composer");
    document.querySelector("#chat .quick").style.display = "none";
    document.querySelector("#chat .chat-input").style.display = "none";
    setChatHeader("Chat", convos.length ? convos.length + " matched conversations" : "No conversations yet");
    document.querySelectorAll("#chat .chat-title-block, #appHeader .chat-title-block").forEach(function (titleBlock) {
      titleBlock.removeAttribute("data-open-employer-profile");
      titleBlock.removeAttribute("data-open-worker-profile");
    });
    convos = convos.filter(function (convo) { return !isChatHidden(convo); });
    if (chatListTab === "favourite") convos = convos.filter(function (convo) { return currentRole === "employer" ? convo.favouriteEmployer : convo.favouriteWorker; });
    var tabs = '<div class="toolbar"><button class="chip ' + (chatListTab === "all" ? "selected" : "") + '" data-chat-tab="all">All</button><button class="chip ' + (chatListTab === "favourite" ? "selected" : "") + '" data-chat-tab="favourite">Favourite</button></div>';
    if (!convos.length) {
      var cta = currentRole === "employer" ? '<button class="btn primary" data-go="applicants">View applicants</button><button class="btn outline mt" data-go="postJob">Post job</button>' : '<button class="btn primary" data-go="jobs">Find jobs</button>';
      byId("chatArea").innerHTML = tabs + '<div class="panel center"><h2>No conversations yet</h2><p class="small">Apply to jobs or accept applicants to start chatting.</p>' + cta + '</div>';
      return;
    }
    byId("chatArea").innerHTML = tabs + convos.map(function (convo) {
      var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
      var unread = currentRole === "employer" ? convo.unreadEmployer : convo.unreadWorker;
      var status = convo.status === "hired" ? "Hired" : convo.status === "blocked" ? "Closed" : "Matched";
      var isFavourite = currentRole === "employer" ? !!convo.favouriteEmployer : !!convo.favouriteWorker;
      var fav = chatListTab === "all" ? '<button class="icon ' + (isFavourite ? "star-active" : "") + '" data-favourite-chat="' + convo.id + '">&#9733;</button>' : "";
      return '<div class="list-row conversation-row"><button class="grow" data-open-conversation="' + convo.id + '" style="border:0;background:transparent;text-align:left;color:inherit;padding:0"><b>' + conversationTitle(convo) + '</b><br><span class="small">' + job.title + ' - ' + job.city + '<br>' + (convo.lastMessage || "Start chat") + '</span></button><span><span class="badge blue">' + status + '</span>' + (unread ? '<span class="unread">' + unread + '</span>' : '') + '</span>' + fav + '<button class="icon" data-delete-chat="' + convo.id + '" aria-label="Disconnect"><svg><use href="#i-trash"></use></svg></button></div>';
    }).join("");
  }
  function renderActiveChat(convo) {
    byId("chat").classList.toggle("chat-no-composer", convo.status === "blocked");
    var job = state.jobs.find(function (j) { return j.id === convo.jobId; }) || state.jobs[0];
    var status = convo.status === "hired" ? "Hired" : convo.status === "blocked" ? "Closed" : "Matched";
    setChatHeader(conversationTitle(convo), job.title + " - " + status);
    document.querySelectorAll("#chat .chat-title-block, #appHeader .chat-title-block").forEach(function (titleBlock) {
      if (currentRole === "worker") titleBlock.setAttribute("data-open-employer-profile", job.id);
      else titleBlock.removeAttribute("data-open-employer-profile");
    });
    convo.lastActivityAt = Date.now();
    if (currentRole === "employer") convo.unreadEmployer = 0; else convo.unreadWorker = 0;
    markReceivedMessagesSeen(convo);
    save();
    var msgs = state.messages.filter(function (m) { return m.conversationId === convo.id; });
    var area = byId("chatArea");
    var wasAtBottom = !area || area.scrollHeight - area.scrollTop - area.clientHeight < 48;
    var ratingPrompt = convo.status === "hired" && !hasSubmittedRating(convo) ? '<button class="btn outline" data-open-rating>Leave a rating and feedback</button>' : '';
    area.innerHTML = renderChatMessages(convo, msgs) + (currentRole === "employer" && convo.status !== "hired" && convo.status !== "blocked" ? '<button class="btn outline" data-mark-hired>Mark as Hired</button>' : '') + (convo.status === "hired" ? ratingPrompt : '') + (convo.status === "blocked" ? '<div class="panel small">This chat is blocked/closed. Messages are disabled.</div>' : '');
    var quicks = currentRole === "employer" ? ["Can you join tomorrow?","Please share experience","Come for interview","Share availability"] : ["I am available","Available today","Can start immediately","What are the timings?","Please share location","What is the salary?"];
    document.querySelector("#chat .quick").style.display = convo.status === "blocked" ? "none" : "flex";
    document.querySelector("#chat .quick").innerHTML = quicks.map(function (q) { return '<button data-quick="' + q + '">' + q + '</button>'; }).join("");
    document.querySelector("#chat .chat-input").style.display = convo.status === "blocked" ? "none" : "flex";
    if (wasAtBottom) area.scrollTop = area.scrollHeight;
    else area.insertAdjacentHTML("beforeend", '<button class="new-msg-indicator" data-scroll-chat-bottom>New messages down</button>');
  }
  function renderChat() {
    if (!byId("chatSafety")) return;
    byId("chatSafety").innerHTML = currentRole === "employer" ? 'Never pay money upfront to hire someone. <button data-report="chat">Report</button> suspicious messages.' : 'Never pay money to get a job. <button data-report="chat">Report</button> suspicious messages.';
    var convo = currentConversation();
    if (convo) renderActiveChat(convo); else renderChatList(state.conversations.filter(function (c) { return c.status !== "closed"; }));
  }
  async function sendChatMessage(text) {
    var convo = currentConversation();
    if (!convo) return toast("Chat unlocks after employer accepts.");
    if (["blocked","disconnected","expired","closed"].indexOf(convo.status) >= 0) return toast("This match is disconnected.");
    if ((state.blockedPairs || []).some(function (pair) { return pair.conversationId === convo.id; })) return toast("This match is disconnected.");
    text = String(text || "").trim();
    if (!text) return;
    var spamReason = chatSpamReason(convo, text);
    if (spamReason) {
      var spamLog = { senderId: currentUserId(), receiverId: currentRole === "employer" ? convo.workerId : convo.employerId, chatId: convo.id, messageText: text, reason: spamReason, createdAt: new Date().toISOString() };
      state.moderationLogs.unshift(spamLog);
      save();
      saveModerationLogRemote(spamLog);
      return toast("Please slow down and avoid repeated messages.");
    }
    var blockedReason = blockedSafetyReason(text);
    if (blockedReason) {
      var moderationLog = { senderId: currentUserId(), receiverId: currentRole === "employer" ? convo.workerId : convo.employerId, chatId: convo.id, messageText: text, reason: blockedReason, createdAt: new Date().toISOString() };
      state.moderationLogs.unshift(moderationLog);
      var count = state.moderationLogs.filter(function (log) { return log.senderId === currentUserId(); }).length;
      save();
      saveModerationLogRemote(moderationLog);
      openModal("Message blocked for safety", '<p class="small">This message may break Kaam Karo safety rules. Please edit it before sending.</p>' + (count >= 3 ? '<p class="small"><b>Repeated unsafe messages may lead to account restriction.</b></p>' : '') + '<button class="btn primary mt" data-close-modal>Edit Message</button>');
      return;
    }
    var flagged = riskText(text);
    var msg = { id: "msg-" + Date.now(), conversationId: convo.id, senderId: currentRole === "employer" ? "rick" : state.worker.id, text: text, createdAt: Date.now(), status: "sent", deliveryStatus: "sent", flaggedRisk: flagged };
    state.messages.push(msg);
    convo.lastMessage = text;
    convo.updatedAt = Date.now();
    convo.lastActivityAt = Date.now();
    if (currentRole === "employer") convo.unreadWorker += 1; else convo.unreadEmployer += 1;
    if (flagged) {
      notify("Suspicious message detected - review safety warning.", "chat");
      toast("Warning: Never pay money to get a job.");
    } else if (currentRole === "worker") {
      setTimeout(function () { notify("New message from " + (state.employer.name || "employer") + ".", "chat"); toast("New message from employer"); }, 700);
    }
    save();
    renderChat();
    saveMessageRemote(convo, msg);
    updateConversationRemote(convo);
    setTimeout(function () {
      msg.status = "delivered";
      msg.deliveryStatus = "delivered";
      save();
      updateMessageRemote(msg);
      renderChat();
    }, 500);
  }
  function profileComplete() {
    return !!(state.worker.name && state.worker.city && state.worker.preferredJob && state.worker.skills.length);
  }
  function workerBadges() {
    var badges = [];
    if (profileComplete()) badges.push({ label: "Profile Complete", className: "blue" });
    if (state.applications.some(function (a) { return a.workerId === state.worker.id; }) || state.worker.active) badges.push({ label: "Active", className: "amber" });
    return badges.slice(0, 3);
  }
  async function setApplicationStatus(appId, status) {
    var app = state.applications.find(function (a) { return a.id === appId; }) || appForSelected();
    if (!app) return;
    app.status = status;
    selectedJobId = app.jobId;
    selectedWorkerId = app.workerId;
    await updateApplicationStatusRemote(app);
    var convo = null;
    if (status === "Accepted") {
      convo = createConversation(app);
      await saveConversationRemote(convo, app);
      var starter = state.messages.find(function (message) {
        return message.conversationId === convo.id && String(message.text || "").indexOf("Employer accepted your interest") === 0;
      });
      if (starter) await saveMessageRemote(convo, starter);
      selectedConversationId = convo.id;
    }
    save();
    render();
    if (status === "Accepted") {
      toast("Matched. Chat is open.");
      track("employer_accept_match");
      show("chat");
    } else {
      toast("Application rejected.");
      track("employer_reject");
    }
  }
  function renderNavs() {
    function nav(target, icon, label, activeScreens) {
      return '<button class="' + (activeScreens.indexOf(currentScreen) >= 0 ? "active" : "") + '" data-go="' + target + '"><b><svg><use href="#' + icon + '"></use></svg></b>' + label + '</button>';
    }
    var unread = state.conversations.reduce(function (sum, c) { return sum + (currentRole === "employer" ? c.unreadEmployer : c.unreadWorker); }, 0);
    var chatLabel = 'Chat' + (unread ? '<span class="nav-badge">' + unread + '</span>' : '');
    var worker = nav("jobs", "i-home", "Home", ["jobs", "applied", "search"]) + nav("applications", "i-briefcase", "Applications", ["applications"]) + nav("chat", "i-message", chatLabel, ["chat"]) + nav("profile", "i-user", "Profile", ["profile", "accountSettings", "profileEdit", "legal", "report", "notifications"]);
    var employer = nav("employerDash", "i-home", "Dashboard", ["employerDash", "employerJobs", "employerJobDetail", "postJob", "jobVisibility", "published"]) + nav("applicants", "i-briefcase", "Applicants", ["applicants", "workerProfileView"]) + nav("chat", "i-message", chatLabel, ["chat"]) + nav("employerProfile", "i-user", "Profile", ["employerProfile", "accountSettings", "profileEdit", "legal", "report", "notifications"]);
    var navScreens = navScreenIds();
    if (byId("bottomNav")) {
      byId("bottomNav").innerHTML = currentRole === "employer" ? employer : worker;
      byId("bottomNav").style.display = navScreens.indexOf(currentScreen) >= 0 ? "grid" : "none";
    }
    var app = document.querySelector(".app");
    if (app) app.classList.toggle("has-bottom-nav", navScreens.indexOf(currentScreen) >= 0);
  }
  function renderLegal() {
    var item = legal[currentLegal] || legal.terms;
    byId("legalTitle").textContent = item[0];
    byId("legalBody").innerHTML = '<p>' + item[1] + '</p><div class="policy-links"><a href="legal/terms-and-conditions.html" target="_blank" rel="noopener">Terms</a><a href="legal/privacy-policy.html" target="_blank" rel="noopener">Privacy</a><a href="legal/refund-policy.html" target="_blank" rel="noopener">Refund</a><a href="legal/acceptable-use-policy.html" target="_blank" rel="noopener">Acceptable Use</a></div>';
  }
  function renderNotifications() {
    if (!byId("notificationList")) return;
    byId("notificationList").innerHTML = state.notifications.length ? state.notifications.map(function (n) {
      return '<button class="list-row" data-go="' + (n.target || "jobs") + '"><span class="tiny"><svg><use href="#i-bell"></use></svg></span><span class="grow"><b>' + n.text + '</b><br><span class="small">' + new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + '</span></span>' + (!n.read ? '<span class="badge amber">New</span>' : '') + '</button>';
    }).join("") : '<div class="panel small">No notifications yet.</div>';
  }
  function renderJobReview() {
    if (!byId("reviewTitle")) return;
    var title = byId("postTitle").value.trim() || "Job title";
    var pay = getPostPayDisplay() || "Pay not added";
    var city = byId("postLocation").value.trim() || "Location not added";
    var type = byId("postType").value || "Full-time";
    var desc = byId("postDesc").value.trim() || "Description preview will appear here.";
    byId("reviewTitle").textContent = title;
    byId("reviewPay").textContent = pay;
    byId("reviewLocation").textContent = city;
    byId("reviewType").textContent = type;
    byId("reviewDesc").textContent = desc.length > 110 ? desc.slice(0, 110) + "..." : desc;
    if (byId("publishJobBtn")) byId("publishJobBtn").disabled = !postVisibility;
  }
  function renderPublished() {
    if (!byId("publishedTitle")) return;
    var job = state.jobs[0];
    if (job && job.status === "pending_review") {
      byId("publishedTitle").textContent = "Sent for review";
      byId("publishedSub").textContent = "This job will go live after Kaam Karo approves it.";
    } else {
      byId("publishedTitle").textContent = "Job is live";
      byId("publishedSub").textContent = "Workers can now apply. Applicants will appear in your dashboard.";
    }
  }
  function getPostPayDisplay() {
    var amount = byId("postPayAmount").value.trim();
    var period = byId("postPayPeriod").value;
    return amount && period ? "Rs " + amount + " " + period : "";
  }
  function postPayPeriodFor(pay) {
    var value = String(pay || "").toLowerCase();
    if (value.indexOf("day") >= 0) return "Per Day";
    if (value.indexOf("week") >= 0) return "Per Week";
    if (value.indexOf("year") >= 0) return "Per Year";
    return "Per Month";
  }
  function isLiveEditableJob(job) {
    if (!isEmployerJob(job)) return false;
    if (["expired","deleted","removed","rejected"].indexOf(String(job.status || "").toLowerCase()) >= 0) return false;
    return !job.expiresAt || Number(job.expiresAt) > Date.now();
  }
  function setPostTypeValue(value) {
    var select = byId("postType");
    if (!select) return;
    var wanted = normalizedPostText(value).replace(/-/g, " ");
    var option = Array.from(select.options).find(function (item) {
      return normalizedPostText(item.value).replace(/-/g, " ") === wanted;
    });
    select.value = option ? option.value : "Full Time";
  }
  function clearPostJobForm() {
    ["postTitle","postPayAmount","postLocation","postShift","postDesc","postRequirements"].forEach(function (id) {
      if (byId(id)) byId(id).value = "";
    });
    if (byId("postPayPeriod")) byId("postPayPeriod").value = "Per Month";
    if (byId("postOpenings")) byId("postOpenings").value = "1";
    setPostTypeValue("Full Time");
    delete selectedLocations.postJob;
    resetVisibilityChoice();
    renderPostDescCounter();
  }
  function fillPostJobForm(job) {
    if (!job) return;
    byId("postTitle").value = job.title || "";
    byId("postPayAmount").value = String(job.pay || "").replace(/[^\d]/g, "");
    byId("postPayPeriod").value = postPayPeriodFor(job.pay);
    byId("postLocation").value = job.formatted_location || job.city || "";
    selectedLocations.postJob = selectedLocationFromInput(byId("postLocation").value) || selectedLocationFromPlaceId(job.place_id) || normalizeLocation(job);
    setPostTypeValue(job.type || "Full Time");
    byId("postShift").value = job.shift || "";
    byId("postOpenings").value = String(job.openings || 1);
    byId("postDesc").value = job.desc || "";
    byId("postRequirements").value = job.requirements || "";
    renderPostDescCounter();
  }
  function renderPostJobMode() {
    if (!byId("postJobHeading")) return;
    var editing = jobFormMode === "edit";
    var reposting = jobFormMode === "repost";
    byId("postJobTag").textContent = editing ? "Edit Job" : (reposting ? "Repost" : "Post Job");
    byId("postJobHeading").textContent = editing ? "Edit live job" : (reposting ? "Repost job" : "Post a job");
    byId("postJobRuleCopy").textContent = editing
      ? "Update the live job details below."
      : "Free job stays live for 15 days. You can post 1 free job every 30 days.";
    byId("postEditWarning").hidden = !editing;
    byId("postJobContinue").textContent = editing ? "Save changes" : "Continue";
  }
  function openCreateJob(returnTo) {
    jobFormMode = "create";
    editingJobId = "";
    repostSourceJobId = "";
    jobFormReturnScreen = returnTo || "employerDash";
    clearPostJobForm();
    renderPostJobMode();
    show("postJob");
  }
  function openEditJob(jobId) {
    var job = state.jobs.find(function (item) { return item.id === jobId; });
    if (!isEmployerJob(job)) return toast("You can only edit your own jobs.");
    if (!isLiveEditableJob(job)) return toast("This job has expired. Repost it to start a new live period.");
    jobFormMode = "edit";
    editingJobId = job.id;
    repostSourceJobId = "";
    jobFormReturnScreen = currentScreen === "employerJobs" ? "employerJobs" : "employerJobDetail";
    fillPostJobForm(job);
    renderPostJobMode();
    show("postJob");
  }
  function openRepostJob(jobId) {
    var job = state.jobs.find(function (item) { return item.id === jobId; });
    if (!isEmployerJob(job)) return toast("You can only repost your own jobs.");
    if (isLiveEditableJob(job)) return toast("This job is still live. Use Edit Job instead.");
    jobFormMode = "repost";
    editingJobId = "";
    repostSourceJobId = job.id;
    jobFormReturnScreen = currentScreen === "employerJobDetail" ? "employerJobDetail" : "employerJobs";
    fillPostJobForm(job);
    renderPostJobMode();
    show("postJob");
  }
  function editableJobSnapshot(job) {
    return {
      title: job.title || "",
      pay: job.pay || "",
      city: job.city || "",
      district: job.district || "",
      state: job.state || "",
      formatted_location: job.formatted_location || "",
      type: job.type || "",
      shift: job.shift || "",
      openings: Number(job.openings || 1),
      desc: job.desc || "",
      requirements: job.requirements || ""
    };
  }
  function textTokens(value) {
    return normalizedPostText(value).split(/[^a-z0-9]+/).filter(function (token) { return token.length > 2; });
  }
  function unrelatedText(before, after) {
    var oldTokens = textTokens(before);
    var newTokens = textTokens(after);
    if (oldTokens.length < 8 || newTokens.length < 8) return false;
    var overlap = oldTokens.filter(function (token) { return newTokens.indexOf(token) >= 0; }).length;
    return overlap / Math.min(oldTokens.length, newTokens.length) < 0.25;
  }
  function titleChangedCompletely(before, after) {
    var oldTitle = normalizedPostText(before);
    var newTitle = normalizedPostText(after);
    if (!oldTitle || !newTitle || oldTitle === newTitle || oldTitle.indexOf(newTitle) >= 0 || newTitle.indexOf(oldTitle) >= 0) return false;
    return unrelatedText(oldTitle, newTitle) || textTokens(oldTitle).every(function (token) { return textTokens(newTitle).indexOf(token) < 0; });
  }
  function jobEditChangeType(job, draft) {
    var location = draft.location || {};
    return titleChangedCompletely(job.title, draft.title)
      || normalizedPostText(job.city) !== normalizedPostText(location.city)
      || (job.state && normalizedPostText(job.state) !== normalizedPostText(location.state))
      || postPayPeriodFor(job.pay) !== byId("postPayPeriod").value
      || normalizedPostText(job.type).replace(/-/g, " ") !== normalizedPostText(draft.type).replace(/-/g, " ")
      || unrelatedText(job.desc, draft.desc)
      ? "major"
      : "minor";
  }
  async function saveEditedJob() {
    var job = state.jobs.find(function (item) { return item.id === editingJobId; });
    if (!isEmployerJob(job)) return toast("You can only edit your own jobs.");
    if (!isLiveEditableJob(job)) return toast("This job has expired. Repost it to start a new live period.");
    var draft = validateJobDraft();
    if (!draft) return;
    var moderation = analyzeJobDraft(draft, job.id);
    if (moderation.rejected) return toast("This job update cannot be saved. Please review posting rules.");
    var before = editableJobSnapshot(job);
    var changeType = jobEditChangeType(job, draft);
    var location = draft.location;
    Object.assign(job, {
      title: draft.title,
      pay: draft.pay,
      city: location.city,
      district: location.district,
      state: location.state,
      country: location.country,
      formatted_location: location.formatted_location,
      place_id: location.place_id,
      lat: location.lat,
      lng: location.lng,
      type: draft.type,
      remote: draft.type === "Remote",
      shift: draft.shift,
      openings: draft.openings,
      desc: draft.desc,
      requirements: draft.requirements,
      updatedAt: Date.now()
    });
    if (changeType === "major") job.status = "pending_review";
    state.jobEditHistory.unshift({
      id: "job-edit-" + Date.now(),
      jobId: job.id,
      employerId: state.defaultBusinessId,
      editedByUserId: state.user.id,
      oldValues: before,
      newValues: editableJobSnapshot(job),
      changeType: changeType,
      createdAt: Date.now()
    });
    state.jobEditHistory = state.jobEditHistory.slice(0, 100);
    audit("job_edited_" + changeType, changeType === "major" ? "Major job edit queued for review" : "Live job updated", job, state.user.id);
    save();
    await saveJobRemote(job);
    selectedJobId = job.id;
    show(jobFormReturnScreen || "employerDash");
    toast(changeType === "major" ? "Job updated and sent for review." : "Job updated.");
  }
  function employerPostCount() {
    return employerJobs(true).length;
  }
  function isEmployerJob(job) {
    return !!(job && state.defaultBusinessId && (job.businessId === state.defaultBusinessId || job.employerId === state.defaultBusinessId));
  }
  function employerJobs(includeDeleted) {
    return state.jobs.filter(function (job) {
      return isEmployerJob(job) && (includeDeleted || ["deleted","removed"].indexOf(String(job.status || "").toLowerCase()) < 0);
    });
  }
  function normalizedPostText(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
  }
  function activeFreeJobs() {
    var now = Date.now();
    return employerJobs().filter(function (job) {
      return job.visibility !== "boost" && ["approved","pending_review"].indexOf(job.status || "approved") >= 0 && (!job.expiresAt || job.expiresAt > now);
    });
  }
  function freePostHistory() {
    var history = (state.postingHistory || []).filter(function (item) {
      return item.businessId === state.defaultBusinessId && item.visibility === "free";
    });
    return history.concat(employerJobs(true).filter(function (job) { return job.visibility !== "boost"; }).map(function (job) {
      return { businessId: state.defaultBusinessId, visibility: "free", title: job.title, desc: job.desc, createdAt: job.createdAt || 0 };
    }));
  }
  function freePostEligibility() {
    if (activeFreeJobs().length) return { ok: false, reason: "You already have 1 free job live. Boost this job or wait until the free post expires." };
    var cutoff = Date.now() - 30 * 86400000;
    var recent = freePostHistory().filter(function (item) { return (item.createdAt || 0) > cutoff; }).sort(function (a, b) { return b.createdAt - a.createdAt; })[0];
    if (recent) {
      var waitDays = Math.max(1, Math.ceil((recent.createdAt + 30 * 86400000 - Date.now()) / 86400000));
      return { ok: false, reason: "Free jobs are limited to 1 post every 30 days. Try again in " + waitDays + " day" + (waitDays === 1 ? "" : "s") + " or choose Boost." };
    }
    return { ok: true };
  }
  function duplicatePostExists(draft, excludeJobId) {
    var title = normalizedPostText(draft.title);
    var desc = normalizedPostText(draft.desc);
    var jobDuplicate = employerJobs(true).some(function (job) {
      return job.id !== excludeJobId && normalizedPostText(job.title) === title && normalizedPostText(job.desc) === desc;
    });
    var historyDuplicate = (state.postingHistory || []).some(function (item) {
      return item.businessId === state.defaultBusinessId && normalizedPostText(item.title) === title && normalizedPostText(item.desc) === desc;
    });
    return jobDuplicate || historyDuplicate;
  }
  function analyzeJobDraft(draft, excludeJobId) {
    var text = [
      draft.title,
      draft.desc,
      (currentBusinessProfile() && currentBusinessProfile().businessName) || "",
      draft.city,
      draft.pay,
      byId("postType").value || ""
    ].join(" ").toLowerCase();
    var reasons = [];
    var rejected = false;
    moderationRules.prohibited.forEach(function (rule) {
      if (rule.words.some(function (word) { return text.indexOf(word) >= 0; })) {
        rejected = true;
        if (reasons.indexOf(rule.reason) < 0) reasons.push(rule.reason);
      }
    });
    moderationRules.suspicious.forEach(function (rule) {
      if (rule.words.some(function (word) { return text.indexOf(word) >= 0; }) && reasons.indexOf(rule.reason) < 0) reasons.push(rule.reason);
    });
    var amount = Number((byId("postPayAmount").value || "").replace(/[^\d]/g, ""));
    if (amount && amount > 80000 && draft.desc.length < 80) reasons.push("Very high pay with vague work");
    if (duplicatePostExists(draft, excludeJobId)) {
      rejected = true;
      reasons.push("Duplicate job post");
    }
    if (employerJobs(true).filter(function (job) { return (job.deletedAt || job.status === "deleted") && (job.updatedAt || job.createdAt || 0) > Date.now() - 86400000; }).length >= 3) reasons.push("Repeated delete and repost activity");
    if (employerPostCount() < 3) reasons.push("First 3 employer jobs require manual review");
    return { rejected: rejected, reasons: reasons, riskScore: reasons.length * 20 + (rejected ? 60 : 0) };
  }
  function render() {
    [
      applyCopy,
      renderAppHeader,
      fillBasicDefaults,
      renderCategories,
      renderSkills,
      renderOnboardingAvailability,
      renderPayPrefs,
      renderPhotoStatus,
      renderPhotoBadge,
      renderNavs,
      function () { if (byId("jobFeed")) renderFeed(); },
      function () { if (byId("searchResults")) renderSearch(); },
      function () { if (byId("workerApplications")) renderWorkerApplications(); },
      renderEmployer,
      renderFullWorkerProfile,
      renderEmployerProfile,
      renderPublicEmployerProfile,
      renderAccountSettings,
      renderProfileEdit,
      renderAdminQueue,
      renderChat,
      renderLegal,
      renderNotifications,
      renderJobReview,
      renderPostJobMode,
      renderPostDescCounter,
      expireInactiveMatches,
      renderHeroDynamicCard,
      initLocationAutocomplete,
      renderPublished,
      function () {
        var profileBadges = workerBadges();
        if (byId("profileName")) byId("profileName").textContent = state.worker.name || "Worker Profile";
        if (byId("profileMeta")) byId("profileMeta").textContent = state.worker.city || state.user.city || "Location not set";
        if (byId("workerAvatar")) {
          if (state.worker.photo_url) byId("workerAvatar").innerHTML = '<img src="' + state.worker.photo_url + '" alt="">';
          else byId("workerAvatar").textContent = initials(state.worker.name || state.user.displayName);
        }
    if (byId("profileBadges")) byId("profileBadges").innerHTML = profileBadges.map(function (b) { return '<span class="badge ' + b.className + '">' + b.label + '</span>'; }).join("");
        var strength = profileStrength();
        if (byId("profileStrengthText")) byId("profileStrengthText").textContent = strength + "%";
        if (byId("profileStrengthBar")) byId("profileStrengthBar").style.width = strength + "%";
        if (byId("profileStrengthStar")) byId("profileStrengthStar").style.left = strength + "%";
        if (byId("workerSwitchCta")) byId("workerSwitchCta").textContent = hasEmployerProfile() ? "Switch to Hiring" : "SETUP HIRING";
        if (byId("employerSwitchCta")) byId("employerSwitchCta").textContent = hasWorkerProfile() ? "Switch to Job Search" : "SETUP JOB SEARCH";
        if (byId("workerProfileLocationText")) byId("workerProfileLocationText").textContent = workerLocationLine();
        if (byId("workerProfileAgeText")) byId("workerProfileAgeText").textContent = state.worker.age ? state.worker.age + " years" : "Age not added yet";
        if (byId("workerProfileGenderText")) byId("workerProfileGenderText").textContent = state.worker.gender || "Optional";
        if (byId("workerProfileExperienceText")) byId("workerProfileExperienceText").textContent = workerExperienceLine();
        if (byId("workerProfileWorkText")) byId("workerProfileWorkText").textContent = workerWorkLine();
        if (byId("workerProfileAvailabilityText")) byId("workerProfileAvailabilityText").textContent = workerAvailabilityLine();
        if (byId("workerProfilePayText")) byId("workerProfilePayText").textContent = state.worker.openAnyPay ? "Open to any pay" : (state.worker.payRange || "Preferred pay not added yet");
        if (byId("workerProfileSkillsText")) byId("workerProfileSkillsText").textContent = (state.worker.skills || []).join(", ") || "No skills added yet";
      }
    ].forEach(function (step) {
      try {
        step();
      } catch (error) {
        console.warn("Kaam Karo render step skipped:", error);
      }
    });
  }
  async function finishWorker() {
    state.workerComplete = true;
    var workerId = state.defaultWorkerId || state.worker.id || ("worker-" + Date.now());
    state.defaultWorkerId = workerId;
    state.worker.id = workerId;
    if (byId("workerName") && byId("workerName").value.trim()) state.worker.name = byId("workerName").value.trim();
    if (byId("workerGender") && byId("workerGender").value) state.worker.gender = byId("workerGender").value;
    if (byId("workerAge") && byId("workerAge").value.trim()) state.worker.age = byId("workerAge").value.trim();
    var finalWorkerLocation = byId("workerCity") ? (selectedLocations.workerBasic || selectedLocationFromInput(byId("workerCity").value.trim())) : null;
    if (finalWorkerLocation) {
      applyStructuredLocation("user", finalWorkerLocation);
      applyStructuredLocation("worker", finalWorkerLocation);
    }
    state.worker.preferredJob = state.worker.preferredJob || "Any Job";
    state.worker.availability = workerAvailabilityLine();
    state.user.displayName = state.worker.name;
    state.user.city = state.worker.city;
    state.user.location = state.worker.formatted_location || state.worker.city;
    state.workerProfiles[workerId] = {
      workerId: workerId,
      userId: state.user.id || "user-demo",
      name: state.worker.name,
      gender: state.worker.gender,
      age: state.worker.age,
      city: state.worker.city,
      district: state.worker.district || "",
      state: state.worker.state || "",
      country: state.worker.country || "India",
      location: state.worker.formatted_location || state.worker.city,
      formatted_location: state.worker.formatted_location || state.worker.city,
      place_id: state.worker.place_id || "",
      lat: state.worker.lat || null,
      lng: state.worker.lng || null,
      workPreference: (state.worker.jobTypes && state.worker.jobTypes.length) ? state.worker.jobTypes.join(", ") : state.worker.preferredJob,
      skills: state.worker.skills.slice(),
      experience: state.worker.experience || "Fresher",
      availability: state.worker.availability,
      startAvailability: state.worker.startAvailability,
      availableDays: (state.worker.availableDays || []).slice(),
      shiftPreference: state.worker.shiftPreference,
      locationPreference: locationMode,
      preferredPay: state.worker.openAnyPay ? "Open to any pay" : (state.worker.payRange || ""),
      photoVerificationStatus: state.user.photoVerificationStatus || "not_uploaded",
      trustBadges: workerBadges().map(function (badge) { return badge.label; }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    var nextWorkerRoute = pendingWorkerRoute || "jobs";
    pendingWorkerRoute = "";
    setupReturnRoute = "";
    localStorage.removeItem("kkPendingWorkerRoute");
    localStorage.removeItem("kkSetupReturnRoute");
    updateLocalAuthProfileFlags();
    save();
    await saveWorkerProfileRemote();
    track("worker_onboarding_complete");
    show(nextWorkerRoute);
  }
  function validateJobDraft() {
    var title = byId("postTitle").value.trim();
    var pay = getPostPayDisplay();
    var amount = byId("postPayAmount").value.trim();
    var period = byId("postPayPeriod").value;
    var city = byId("postLocation").value.trim();
    var location = selectedLocations.postJob || selectedLocationFromInput(city);
    var desc = byId("postDesc").value.trim();
    if (!title) return toast("Job title required.");
    if (!amount) return toast("Salary required.");
    if (!period) return toast("Salary type required.");
    if (!city) return toast("Location required.");
    if (!location) return toast("Please select a location from the list.");
    if (desc.length > 700) return toast("Job description must be 700 characters or less.");
    if (descriptionWordCount(desc) < 15) {
      if (byId("postDescError")) byId("postDescError").style.display = "block";
      return toast("Please add at least 15 words so workers understand the job clearly.");
    }
    if (byId("postDescError")) byId("postDescError").style.display = "none";
    return {
      title: title,
      pay: pay,
      city: location.city,
      location: location,
      desc: desc,
      type: byId("postType").value,
      shift: byId("postShift").value.trim(),
      openings: Math.max(1, Number(byId("postOpenings").value || 1)),
      requirements: byId("postRequirements").value.trim()
    };
  }
  async function addPostedJob() {
    if (!hasEmployerProfile()) return goToEmployerRoute("postJob");
    var draft = validateJobDraft();
    if (!draft) return;
    if (!postVisibility) {
      if (byId("visibilityError")) byId("visibilityError").style.display = "block";
      return toast("Please select a visibility option.");
    }
    if (postVisibility === "free") {
      var freeLimit = freePostEligibility();
      if (!freeLimit.ok) return toast(freeLimit.reason);
    }
    if (!byId("jobRules").checked) {
      byId("jobRulesError").style.display = "block";
      return toast("Please confirm the job is genuine before publishing.");
    }
    byId("jobRulesError").style.display = "none";
    var moderation = analyzeJobDraft(draft, repostSourceJobId);
    if (moderation.rejected) {
      var rejectedBusiness = currentBusinessProfile();
      audit("rejected", moderation.reasons.join(", "), { id: "draft-" + Date.now(), title: draft.title, pay: draft.pay, city: draft.city, type: draft.type, employer: rejectedBusiness ? rejectedBusiness.businessName : "Business", desc: draft.desc, status: "rejected" }, "system");
      toast("This job cannot be published. Please review posting rules.");
      return;
    }
    var needsPayment = postVisibility === "boost";
    var status = needsPayment ? "pending_review" : (moderation.reasons.length ? "pending_review" : "approved");
    var business = currentBusinessProfile();
    var postLocation = draft.location;
    var created = Date.now();
    var job = { id: "job-" + created, businessId: state.defaultBusinessId, employerId: state.defaultBusinessId, companyName: business.businessName, title: draft.title, pay: draft.pay, city: postLocation.city, district: postLocation.district, state: postLocation.state, formatted_location: postLocation.formatted_location, place_id: postLocation.place_id, lat: postLocation.lat, lng: postLocation.lng, distance: "Nearby", type: draft.type, shift: draft.shift, openings: draft.openings, requirements: draft.requirements, employer: business.businessName, badge: postVisibility === "boost" ? "Urgent" : "New", visibility: postVisibility, remote: draft.type === "Remote", desc: draft.desc, status: status, riskScore: moderation.riskScore, flagReasons: moderation.reasons, reportCount: 0, previousPosts: employerPostCount(), repostedFromJobId: repostSourceJobId || "", createdAt: created, expiresAt: needsPayment ? null : created + 15 * 86400000, paymentVerified: !needsPayment };
    state.jobs.unshift(job);
    if (repostSourceJobId) {
      var repostSource = state.jobs.find(function (item) { return item.id === repostSourceJobId; });
      if (repostSource) repostSource.repostCount = Number(repostSource.repostCount || 0) + 1;
    }
    save();
    var remoteJob = await saveJobRemote(job);
    if (needsPayment) {
      try {
        if (!remoteJob && !isLocalPrototype()) throw new Error("Job must sync before payment. Please try again.");
        toast("Opening secure payment...");
        await payForBoostRemote(job);
        job.paymentVerified = true;
        job.boosted = true;
        job.expiresAt = Date.now() + 28 * 86400000;
        job.status = moderation.reasons.length ? "pending_review" : "approved";
        await saveJobRemote(job);
      } catch (error) {
        state.jobs = state.jobs.filter(function (item) { return item.id !== job.id; });
        job.status = "deleted";
        job.deletedAt = Date.now();
        await saveJobRemote(job);
        save();
        toast(error && error.message ? error.message : "Payment was not completed.");
        return;
      }
    }
    state.postingHistory.push({ businessId: state.defaultBusinessId, visibility: postVisibility, title: draft.title, desc: draft.desc, createdAt: created, status: job.status, riskScore: moderation.riskScore });
    save();
    audit(job.status === "approved" ? "approved" : "pending_review", job.status === "approved" ? "Auto-approved" : moderation.reasons.join(", "), job, "system");
    track(postVisibility === "boost" ? "employer_job_boosted_posted" : "employer_job_free_posted");
    jobFormMode = "create";
    repostSourceJobId = "";
    editingJobId = "";
    show("published");
  }
  function openPublishConfirmation() {
    var copy = postVisibility === "boost"
      ? "<b>Boosted Post:</b><br>Rs 199 per job. Live for 28 days."
      : "<b>Free Post:</b><br>Live for 15 days. One free post allowed every 30 days.";
    openModal("Confirm job post", '<p class="small">' + copy + '</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn primary" data-confirm-post-job>Publish Job</button></div>');
  }
  function performAccountDelete() {
    var keepJobs = state.jobs.filter(function (job) { return !job.employerId && !job.businessId; });
    state.workerComplete = false;
    state.employerComplete = false;
    state.workerProfiles = {};
    state.businessProfiles = {};
    state.defaultWorkerId = "";
    state.defaultBusinessId = "";
    state.applications = [];
    state.conversations = [];
    state.messages = [];
    state.notifications = [];
    state.jobs = keepJobs;
    state.user = { id: "user-demo", displayName: "", phone: "", city: "", location: "", phoneVerified: false, photoVerificationStatus: "not_uploaded", photoVerified: false, authenticated: false };
    state.worker = { id: "john", name: "", gender: "", age: "", city: "", experience: "", skills: [], jobTypes: [], availability: "", preferredJob: "Any Job", preferredType: "Full-time", bio: "", phoneVerified: false, photoVerified: false, startAvailability: "", availableDays: [], shiftPreference: "", flexibleAvailability: false };
    state.employer = { id: "", ownerId: "john", name: "", business: "", phone: "", type: "", city: "" };
    localStorage.removeItem("kkPendingWorkerRoute");
    localStorage.removeItem("kkPendingEmployerRoute");
    localStorage.removeItem("kkRole");
    localStorage.removeItem("kkLastMode");
    save();
    closeModal();
    show("landing");
    toast("Account deleted");
  }
  document.addEventListener("kaamkaro:location-selected", function (event) {
    if (!event.detail || !event.detail.context || !event.detail.location) return;
    saveLocationTo(event.detail.context, event.detail.location);
  });
  document.addEventListener("click", async function (event) {
    var lang = event.target.closest("[data-lang]");
    if (lang) return setLang(lang.dataset.lang);
    var descChip = event.target.closest("[data-desc-chip]");
    if (descChip) { addDescriptionSentence(descChip.dataset.descChip); return; }
    if (event.target.closest("[data-confirm-delete-account]")) { performAccountDelete(); return; }
    var legalLink = event.target.closest("[data-legal]");
    if (legalLink) { currentLegal = legalLink.dataset.legal; show("legal"); return; }
    var menuBack = event.target.closest("[data-menu-back]");
    if (menuBack) {
      if (isEditMode && (currentScreen === "profileEdit" || currentScreen === "verifyId")) {
        returnFromEditMode();
        return;
      }
      show(menuReturn || "jobs"); return;
    }
    var chatBack = event.target.closest("[data-chat-back]");
    if (chatBack) {
      if (selectedConversationId) { selectedConversationId = null; renderChat(); return; }
      show(menuReturn || (currentRole === "employer" ? "employerDash" : "jobs"));
      return;
    }
    var report = event.target.closest("[data-report]");
    if (report) {
      reportContext = report.dataset.report || "general";
      if (reportContext === "job") {
        var list = filteredJobs(byId("jobSearch") ? byId("jobSearch").value : "");
        selectedReportJobId = list[jobIndex] ? list[jobIndex].id : selectedJobId;
      }
      show("report");
      return;
    }
    var reportReason = event.target.closest("[data-report-reason]");
    if (reportReason) {
      var reason = reportReason.dataset.reportReason;
      if (reportContext === "chat") {
        selectedReportReason = reason;
        openModal("Tell us what happened", '<label class="input"><textarea id="reportDetails" placeholder="Tell us what happened"></textarea></label><p class="small mt">Reporting this chat will disconnect this match and remove the conversation for both sides.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-report-disconnect>Report and Disconnect</button></div>');
        return;
      }
      if (reportContext === "job" && selectedReportJobId) {
        var reportedJob = state.jobs.find(function (job) { return job.id === selectedReportJobId; });
        if (reportedJob) {
          reportedJob.reportCount = (reportedJob.reportCount || 0) + 1;
          reportedJob.flagReasons = reportedJob.flagReasons || [];
          if (reportedJob.flagReasons.indexOf(reason) < 0) reportedJob.flagReasons.push(reason);
          reportedJob.riskScore = (reportedJob.riskScore || 0) + 15;
          if (reportedJob.status === "approved") reportedJob.status = "pending_review";
          audit("job_reported", reason, reportedJob, state.worker.id);
          save();
        }
      }
      toast("Report submitted: " + reason);
      show(menuReturn || "jobs");
      return;
    }
    var adminAction = event.target.closest("[data-admin-action]");
    if (adminAction) {
      var adminJob = state.jobs.find(function (job) { return job.id === adminAction.dataset.jobId; });
      if (!adminJob) return;
      var action = adminAction.dataset.adminAction;
      if (action === "approve") adminJob.status = "approved";
      if (action === "reject") adminJob.status = "rejected";
      if (action === "request_edit") adminJob.status = "pending_review";
      if (action === "suspend") { state.employer.moderationStatus = "suspended"; adminJob.status = "removed"; }
      if (action === "ban") { state.employer.moderationStatus = "banned"; adminJob.status = "removed"; }
      audit(action, "Admin moderation action", adminJob, "admin-001");
      save();
      toast("Admin action saved.");
      render();
      return;
    }
    var openConversation = event.target.closest("[data-open-conversation]");
    if (openConversation) { selectedConversationId = openConversation.dataset.openConversation; show("chat"); return; }
    var dashboardTarget = event.target.closest("[data-dashboard-target]");
    if (dashboardTarget) { applicantsTab = dashboardTarget.dataset.dashboardTarget; show("applicants"); return; }
    if (event.target.closest("[data-new-job]")) { openCreateJob("employerDash"); return; }
    if (event.target.closest("[data-post-job-back]")) { show(jobFormReturnScreen || "employerDash"); return; }
    var editJob = event.target.closest("[data-edit-job]");
    if (editJob) { openEditJob(editJob.dataset.editJob); return; }
    var repostJob = event.target.closest("[data-repost-job]");
    if (repostJob) { openRepostJob(repostJob.dataset.repostJob); return; }
    var deleteJob = event.target.closest("[data-delete-job]");
    if (deleteJob) {
      openModal("Delete this job?", '<p class="small">This job will be removed from the employer job list.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-job="' + deleteJob.dataset.deleteJob + '">Delete</button></div>');
      return;
    }
    var confirmDeleteJob = event.target.closest("[data-confirm-delete-job]");
    if (confirmDeleteJob) {
      var deletedJob = state.jobs.find(function (job) { return job.id === confirmDeleteJob.dataset.confirmDeleteJob; });
      if (deletedJob) {
        deletedJob.status = "deleted";
        deletedJob.deletedAt = Date.now();
        deletedJob.updatedAt = Date.now();
        state.postingHistory.push({ businessId: deletedJob.businessId, visibility: deletedJob.visibility || "free", title: deletedJob.title, desc: deletedJob.desc, createdAt: deletedJob.createdAt || Date.now(), deletedAt: deletedJob.deletedAt, status: "deleted" });
      }
      state.applications = state.applications.filter(function (app) { return app.jobId !== confirmDeleteJob.dataset.confirmDeleteJob; });
      save(); closeModal(); render(); return;
    }
    var appTab = event.target.closest("[data-applications-tab]");
    if (appTab) { applicationsTab = appTab.dataset.applicationsTab; renderWorkerApplications(); return; }
    var applicantTab = event.target.closest("[data-applicants-tab]");
    if (applicantTab) { applicantsTab = applicantTab.dataset.applicantsTab; renderEmployer(); return; }
    var chatTab = event.target.closest("[data-chat-tab]");
    if (chatTab) { chatListTab = chatTab.dataset.chatTab; renderChat(); return; }
    var favChat = event.target.closest("[data-favourite-chat]");
    if (favChat) {
      var favConvo = state.conversations.find(function (c) { return c.id === favChat.dataset.favouriteChat; });
      if (favConvo) {
        var nextFav = currentRole === "employer" ? !favConvo.favouriteEmployer : !favConvo.favouriteWorker;
        if (currentRole === "employer") favConvo.favouriteEmployer = nextFav; else favConvo.favouriteWorker = nextFav;
        save(); renderChat(); toast(nextFav ? "Added to favourites." : "Removed from favourites.");
        updateConversationRemote(favConvo);
      }
      return;
    }
    var deleteChat = event.target.closest("[data-delete-chat]");
    if (deleteChat) {
      openModal("Disconnect this match?", '<p class="small">This will remove the chat for both sides and you won’t be able to message each other unless you match again.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-chat="' + deleteChat.dataset.deleteChat + '">Disconnect</button></div>');
      return;
    }
    var confirmDeleteChat = event.target.closest("[data-confirm-delete-chat]");
    if (confirmDeleteChat) {
      var delConvo = state.conversations.find(function (c) { return c.id === confirmDeleteChat.dataset.confirmDeleteChat; });
      await disconnectMatchRemote(disconnectMatch(delConvo, "manual_disconnect"));
      closeModal();
      renderChat();
      return;
    }
    var withdrawApp = event.target.closest("[data-withdraw-app]");
    if (withdrawApp) {
      openModal("Withdraw this application?", '<p class="small">You will not be considered for this job anymore.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-withdraw-app="' + withdrawApp.dataset.withdrawApp + '">Withdraw</button></div>');
      return;
    }
    var confirmWithdraw = event.target.closest("[data-confirm-withdraw-app]");
    if (confirmWithdraw) {
      var withdrawnApp = state.applications.find(function (app) { return app.id === confirmWithdraw.dataset.confirmWithdrawApp; });
      if (withdrawnApp) { withdrawnApp.status = "Withdrawn"; await updateApplicationStatusRemote(withdrawnApp); }
      state.applications = state.applications.filter(function (app) { return app.id !== confirmWithdraw.dataset.confirmWithdrawApp; });
      save(); closeModal(); render(); return;
    }
    var removeMatch = event.target.closest("[data-remove-match]");
    if (removeMatch) {
      openModal("Leave this job?", '<p class="small">This will remove the match and delete the chat.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-remove-match="' + removeMatch.dataset.removeMatch + '">Remove Match</button></div>');
      return;
    }
    var confirmRemoveMatch = event.target.closest("[data-confirm-remove-match]");
    if (confirmRemoveMatch) {
      var matchApp = state.applications.find(function (app) { return app.id === confirmRemoveMatch.dataset.confirmRemoveMatch; });
      var removedConvo = conversationForApp(matchApp);
      await disconnectMatchRemote(disconnectMatch(removedConvo, "worker_removed_match"));
      closeModal(); render(); return;
    }
    var removeAccepted = event.target.closest("[data-remove-accepted-app]");
    if (removeAccepted) {
      openModal("Remove this applicant?", '<p class="small">This will disconnect the match and delete the chat for both sides.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-remove-accepted="' + removeAccepted.dataset.removeAcceptedApp + '">Remove Applicant</button></div>');
      return;
    }
    var confirmRemoveAccepted = event.target.closest("[data-confirm-remove-accepted]");
    if (confirmRemoveAccepted) {
      var acceptedApp = state.applications.find(function (app) { return app.id === confirmRemoveAccepted.dataset.confirmRemoveAccepted; });
      var acceptedConvo = conversationForApp(acceptedApp);
      await disconnectMatchRemote(disconnectMatch(acceptedConvo, "employer_removed_applicant"));
      closeModal(); render(); return;
    }
    if (event.target.closest("[data-confirm-report-disconnect]")) {
      var reportConvo = currentConversation();
      var reportDetails = (byId("reportDetails") && byId("reportDetails").value) || "";
      state.auditLogs.unshift({ userId: currentUserId(), action: "chat_reported", reason: selectedReportReason + ": " + reportDetails, jobSnapshot: null, timestamp: new Date().toISOString() });
      var reportRecord = { id: "report-" + Date.now(), reporterId: currentUserId(), chatId: reportConvo ? reportConvo.id : "", jobId: reportConvo ? reportConvo.jobId : "", reason: selectedReportReason, details: reportDetails, status: "open", createdAt: Date.now() };
      state.reports.unshift(reportRecord);
      await saveReportRemote(reportRecord, reportConvo);
      if (reportConvo) {
        await disconnectMatchRemote(disconnectMatch(reportConvo, "reported_" + selectedReportReason));
      }
      closeModal(); toast("Report submitted."); show(currentRole === "employer" ? "employerDash" : "jobs"); return;
    }
    if (event.target.closest("[data-scroll-chat-bottom]")) {
      var chatArea = byId("chatArea");
      if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
      return;
    }
    if (event.target.closest("[data-public-profile-back]")) {
      show(publicProfileReturn || "jobs");
      return;
    }
    var block = event.target.closest("[data-block]");
    if (block) {
      var blocked = currentConversation();
      if (blocked) {
        blocked.status = "blocked";
        audit("chat_blocked", "User blocked conversation", state.jobs.find(function (j) { return j.id === blocked.jobId; }), currentRole === "employer" ? "rick" : state.worker.id);
        save();
        renderChat();
      }
      toast("Blocked. This chat is now closed.");
      return;
    }
    if (event.target.closest("[data-mark-hired]")) {
      openModal("Confirm hire?", '<p class="small">Are you satisfied with this hire?</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn primary" data-confirm-hired>Yes, Mark as Hired</button></div>');
      return;
    }
    if (event.target.closest("[data-confirm-hired]")) {
      var hiredConvo = currentConversation();
      var hiredResult = markHiredConversation(hiredConvo);
      if (hiredResult && hiredResult.application) await updateApplicationStatusRemote(hiredResult.application);
      if (hiredResult && hiredResult.conversation) await updateConversationRemote(hiredResult.conversation);
      if (hiredResult && hiredResult.message) await saveMessageRemote(hiredResult.conversation, hiredResult.message);
      if (hiredResult && hiredResult.conversation) selectedConversationId = hiredResult.conversation.id;
      closeModal();
      toast("Worker marked as hired.");
      render();
      return;
    }
    if (event.target.closest("[data-open-rating]")) {
      pendingRating = { score: 0, quick: "" };
      openModal("How was your experience?", '<div class="toolbar">' + [1,2,3,4,5].map(function (n) { return '<button class="chip rating-star" data-rating-star="' + n + '">&#9733;</button>'; }).join("") + '</div><div class="toolbar mt">' + ["Not good","Okay","Good","Great","Excellent"].map(function (q) { return '<button class="chip" data-rating-quick="' + q + '">' + q + '</button>'; }).join("") + '</div><label class="input mt"><textarea id="ratingComment" placeholder="Write a short feedback..."></textarea></label><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn primary" data-submit-rating>Submit Feedback</button></div>');
      return;
    }
    var ratingStar = event.target.closest("[data-rating-star]");
    if (ratingStar) { pendingRating.score = Number(ratingStar.dataset.ratingStar || 0); ratingStar.parentElement.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("selected"); }); ratingStar.classList.add("selected"); return; }
    var ratingQuick = event.target.closest("[data-rating-quick]");
    if (ratingQuick) { pendingRating.quick = ratingQuick.dataset.ratingQuick; ratingQuick.parentElement.querySelectorAll(".chip").forEach(function (b) { b.classList.remove("selected"); }); ratingQuick.classList.add("selected"); return; }
    if (event.target.closest("[data-submit-rating]")) {
      var ratedConvo = currentConversation();
      if (!pendingRating.score) return toast("Choose a star rating.");
      var ratingRecord = { id: "rating-" + Date.now(), conversationId: ratedConvo.id, jobId: ratedConvo.jobId, userId: currentUserId(), fromRole: currentRole, rating: pendingRating.score, quick: pendingRating.quick, comment: byId("ratingComment") ? byId("ratingComment").value.trim() : "", status: "submitted", createdAt: Date.now() };
      state.ratings.push(ratingRecord);
      await saveRatingRemote(ratingRecord, ratedConvo);
      save(); closeModal(); toast("Feedback submitted"); renderChat(); return;
    }
    var quick = event.target.closest("[data-quick]");
    if (quick) { sendChatMessage(quick.dataset.quick); return; }
    if (event.target.closest("[data-close-modal]") || event.target.id === "appModal") { closeModal(); return; }
    var settingsModal = event.target.closest("[data-settings-modal]");
    if (settingsModal) {
      var kind = settingsModal.dataset.settingsModal;
      if (kind === "phone") openModal("Change Phone Number", '<p class="small">We will verify your new number with OTP.</p><button class="btn primary mt" data-change-phone-flow>Start OTP</button>');
      if (kind === "notifications") openModal("Notifications", '<div class="list"><label class="settings-card"><span><span>Job matches</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Chat messages</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Application updates</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Marketing</span><b>Off</b></span><input type="checkbox"></label></div><button class="btn primary mt" data-save-modal="Notifications saved">Save</button>');
      if (kind === "privacy") openModal("Privacy", '<div class="list"><label class="settings-card"><span><span>Show location</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Show selfie</span><b>On</b></span><input type="checkbox" checked></label><label class="settings-card"><span><span>Pause profile</span><b>Off</b></span><input type="checkbox"></label></div><button class="btn primary mt" data-save-modal="Privacy saved">Save</button>');
      if (kind === "faq") openModal("Help & FAQ", '<div class="list"><div class="panel small"><b>How do I apply?</b><br>Swipe right on a job.</div><div class="panel small"><b>When can I chat?</b><br>Chat unlocks after employer accepts.</div><div class="panel small"><b>How job posting works</b><br>Free jobs stay live for 15 days. Employers can post 1 free job every 30 days. Boosted jobs cost Rs 199 per job and stay live for 28 days.</div><div class="panel small"><b>Is photo required?</b><br>No, it is optional.</div></div>');
      if (kind === "refer") openModal("Refer & Earn", '<p class="small">Share Kaam Karo with friends looking for work.</p><label class="input mt"><input value="https://kaamkaro.app/ref/demo" readonly></label><button class="btn primary mt" data-save-modal="Referral link copied">Copy link</button>');
      return;
    }
    if (event.target.closest("[data-change-phone-flow]")) { phoneUpdatePending = true; closeModal(); show("otp"); toast("Enter new phone number"); return; }
    var saveModal = event.target.closest("[data-save-modal]");
    if (saveModal) { closeModal(); toast(saveModal.dataset.saveModal + " OK"); return; }
    var openJob = event.target.closest("[data-open-job-modal]");
    if (openJob && !event.target.closest("button")) {
      var detailJob = state.jobs.find(function (job) { return job.id === openJob.dataset.openJobModal; });
      if (detailJob) openModal(detailJob.title, '<div class="panel"><h2>' + detailJob.pay + '</h2><p class="small">' + detailJob.city + ' - ' + detailJob.type + ' - Posted 3h ago</p><span class="badge amber">Hiring today</span></div><p class="small mt">' + detailJob.desc + '</p><button class="btn outline mt" data-open-employer-profile="' + detailJob.id + '">' + (detailJob.employer || "View employer") + '</button><button class="btn primary mt" data-apply-job="' + detailJob.id + '">Apply</button>');
      return;
    }
    var openEmployerProfile = event.target.closest("[data-open-employer-profile]");
    if (openEmployerProfile) {
      closeModal();
      openPublicEmployerProfile(openEmployerProfile.dataset.openEmployerProfile);
      return;
    }
    if (event.target.closest("[data-undo-swipe]")) {
      if (lastSwipe && lastSwipe.type === "skip") { jobIndex = lastSwipe.index; renderFeed(); }
      byId("undoBar").classList.remove("show");
      lastSwipe = null;
      toast("Swipe undone");
      return;
    }
    if (event.target.closest("[data-refresh-jobs]")) { jobIndex = 0; renderFeed(); toast("Jobs refreshed"); return; }
    if (event.target.closest("[data-confirm-logout]")) {
      closeModal();
      try {
        if (window.KaamKaroAuth) await window.KaamKaroAuth.logout();
      } catch (error) {
        console.warn("Logout skipped:", error);
      }
      byId("phoneInput").value = "";
      if (byId("otpInput")) byId("otpInput").value = "";
      state.user.authenticated = false;
      save();
      track("logout");
      show("landing");
      toast("Logged out.");
      return;
    }
    if (event.target.closest("[data-logout]")) {
      openModal("Logout", '<p class="small">Are you sure you want to logout?</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-logout>Logout</button></div>');
      return;
    }
    var editProfile = event.target.closest("[data-edit-profile]");
    if (editProfile) {
      openProfileEdit(editProfile.dataset.editProfile, { mode: "edit", returnTo: currentScreen });
      return;
    }
    if (event.target.closest("[data-edit-photo]")) {
      openPhotoEdit({ mode: "edit", returnTo: currentScreen });
      return;
    }
    var editOption = event.target.closest("[data-edit-option]");
    if (editOption) { editDraft.value = editOption.dataset.editOption; markEditDirty(); renderProfileEdit(); return; }
    var editLocation = event.target.closest("[data-edit-location]");
    if (editLocation) {
      var pickedEditLocation = selectedLocationFromPlaceId(editLocation.dataset.editLocation);
      if (pickedEditLocation) saveLocationTo("profileEdit", pickedEditLocation);
      renderProfileEdit();
      return;
    }
    var editWork = event.target.closest("[data-edit-work]");
    if (editWork) {
      editDraft.workTypes = editDraft.workTypes || [];
      var workIndex = editDraft.workTypes.indexOf(editWork.dataset.editWork);
      if (workIndex >= 0) editDraft.workTypes.splice(workIndex, 1); else editDraft.workTypes.push(editWork.dataset.editWork);
      markEditDirty(); renderProfileEdit(); return;
    }
    var editDay = event.target.closest("[data-edit-day]");
    if (editDay) {
      editDraft.days = editDraft.days || [];
      var dayIndex = editDraft.days.indexOf(editDay.dataset.editDay);
      if (dayIndex >= 0) editDraft.days.splice(dayIndex, 1); else editDraft.days.push(editDay.dataset.editDay);
      markEditDirty(); renderProfileEdit(); return;
    }
    if (event.target.closest("[data-edit-all-days]")) {
      var allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var currentlyAll = allDays.every(function (day) { return (editDraft.days || []).indexOf(day) >= 0; });
      editDraft.days = currentlyAll ? [] : allDays.slice();
      markEditDirty(); renderProfileEdit(); return;
    }
    var editStart = event.target.closest("[data-edit-start]");
    if (editStart) { editDraft.start = editStart.dataset.editStart; markEditDirty(); renderProfileEdit(); return; }
    var editShift = event.target.closest("[data-edit-shift]");
    if (editShift) { editDraft.shift = editShift.dataset.editShift; markEditDirty(); renderProfileEdit(); return; }
    var suggestSkill = event.target.closest("[data-edit-suggest-skill]");
    if (suggestSkill) {
      editDraft.skills = editDraft.skills || [];
      if (editDraft.skills.indexOf(suggestSkill.dataset.editSuggestSkill) < 0) editDraft.skills.push(suggestSkill.dataset.editSuggestSkill);
      markEditDirty(); renderProfileEdit(); return;
    }
    var removeEditSkill = event.target.closest("[data-edit-remove-skill]");
    if (removeEditSkill) {
      editDraft.skills = (editDraft.skills || []).filter(function (skill) { return skill !== removeEditSkill.dataset.editRemoveSkill; });
      markEditDirty(); renderProfileEdit(); return;
    }
    if (event.target.closest("[data-edit-add-skill]")) {
      var skillInput = byId("profileEditInput");
      var newSkill = skillInput ? skillInput.value.trim() : "";
      if (newSkill) {
        editDraft.skills = editDraft.skills || [];
        if (editDraft.skills.indexOf(newSkill) < 0) editDraft.skills.push(newSkill);
        markEditDirty(); renderProfileEdit();
      }
      return;
    }
    if (event.target.closest("[data-save-profile-edit]")) {
      await saveProfileEdit();
      return;
    }
    if (event.target.closest("[data-cancel-profile-edit]")) {
      returnFromEditMode();
      return;
    }
    var accountProfile = event.target.closest("[data-account-profile]");
    if (accountProfile) {
      if (accountProfile.dataset.accountProfile === "worker") {
        currentRole = "worker";
        localStorage.setItem("kkRole", "worker");
        goToWorkerRoute("profile");
      } else {
        currentRole = "employer";
        localStorage.setItem("kkRole", "employer");
        goToEmployerRoute("employerProfile");
      }
      return;
    }
    if (event.target.closest("[data-delete-account]")) {
      var expectedDeletePhone = (state.user.phone || state.employer.phone || "").replace(/\D/g, "").slice(-10);
      if (byId("deleteConfirmPhone").value.replace(/\D/g, "") !== expectedDeletePhone) return toast("Type your mobile number to confirm.");
      openModal("Are you absolutely sure?", '<p>This cannot be undone. All your data and history will be removed.</p><div class="btn-row mt"><button class="btn outline" data-close-modal>Cancel</button><button class="btn danger" data-confirm-delete-account>Permanently Delete</button></div>');
      return;
    }
    if (event.target.closest("[data-profile-tab]")) {
      if (currentRole === "employer") goToEmployerRoute("employerProfile"); else goToWorkerRoute("profile");
      return;
    }
    var switchMode = event.target.closest("[data-switch-mode]");
    if (switchMode) {
      var targetMode = switchMode.dataset.switchMode;
      setupReturnRoute = currentScreen;
      localStorage.setItem("kkSetupReturnRoute", setupReturnRoute);
      if (targetMode === "employer") {
        if (hasEmployerProfile()) {
          setupReturnRoute = "";
          localStorage.removeItem("kkSetupReturnRoute");
          currentRole = "employer";
          localStorage.setItem("kkRole", currentRole);
          toast("Hire Workers mode.");
          show("employerDash");
        } else {
          pendingEmployerRoute = "employerDash";
          localStorage.setItem("kkPendingEmployerRoute", pendingEmployerRoute);
          toast("Set up your business first.");
          show("employerSetup");
        }
      } else {
        if (hasWorkerProfile()) {
          setupReturnRoute = "";
          localStorage.removeItem("kkSetupReturnRoute");
          currentRole = "worker";
          localStorage.setItem("kkRole", currentRole);
          toast("Find Work mode.");
          show("jobs");
        } else {
          pendingWorkerRoute = "jobs";
          localStorage.setItem("kkPendingWorkerRoute", pendingWorkerRoute);
          toast("Create your worker profile first.");
          show("workerBasic");
        }
      }
      return;
    }
    if (event.target.closest("[data-setup-home]")) {
      var homeRoute = setupReturnRoute || (currentRole === "employer" ? "employerDash" : "jobs");
      setupReturnRoute = "";
      pendingEmployerRoute = "";
      pendingWorkerRoute = "";
      localStorage.removeItem("kkSetupReturnRoute");
      localStorage.removeItem("kkPendingEmployerRoute");
      localStorage.removeItem("kkPendingWorkerRoute");
      show(homeRoute);
      return;
    }
    var workerHomeEdit = event.target.closest("[data-worker-home-edit]");
    if (workerHomeEdit) {
      var quickField = workerHomeEdit.dataset.workerHomeEdit === "availability" ? "workerAvailability" : "workerLocation";
      openProfileEdit(quickField, { mode: "home_empty_state_edit", returnTo: "jobs" });
      return;
    }
    var go = event.target.closest("[data-go]");
    if (go) {
      var targetRoute = go.dataset.go;
      if (targetRoute === "postJob" && currentScreen !== "jobVisibility") {
        openCreateJob(currentScreen === "employerJobDetail" ? "employerJobDetail" : "employerDash");
        return;
      }
      if (isEditMode && (currentScreen === "profileEdit" || currentScreen === "verifyId") && unsafeEditReturnScreen(targetRoute)) {
        returnFromEditMode();
        return;
      }
      if (targetRoute === "workerBasic" && !state.workerComplete && !state.defaultWorkerId) {
        state.worker.name = "";
        state.worker.gender = "";
        state.worker.age = "";
        state.worker.city = "";
        state.worker.experience = "";
        state.worker.skills = [];
        state.worker.jobTypes = [];
        state.worker.preferredJob = "Any Job";
        state.worker.startAvailability = "";
        state.worker.availableDays = [];
        state.worker.shiftPreference = "";
        state.worker.flexibleAvailability = false;
        save();
      }
      if (targetRoute === "chat") {
        if (currentRole === "employer") goToEmployerRoute("chat"); else goToWorkerRoute("chat");
      } else if (isEmployerRoute(targetRoute)) {
        goToEmployerRoute(targetRoute);
      } else if (isWorkerRoute(targetRoute)) {
        goToWorkerRoute(targetRoute);
      } else {
        show(targetRoute);
      }
      return;
    }
    if (event.target.closest("[data-send-otp]")) {
      var phone = byId("phoneInput").value.replace(/\D/g, "");
      if (phone.length !== 10) return toast("Enter a valid 10 digit phone number.");
      try {
        var otpRequest = window.KaamKaroAuth ? await window.KaamKaroAuth.sendOtp(phone) : { phone: phone, mode: "demo" };
        if (otpRequest.bypassOtp) {
          var bypassUser = otpRequest.user || {};
          activateAccountState(bypassUser, otpRequest.phone);
          save();
          track("otp_bypassed_for_testing");
          toast("Testing login active. OTP skipped for now.");
          routeAfterOtp();
          return;
        }
        state.pendingLoginPhone = otpRequest.phone;
        save();
        track("otp_requested");
        show("otpCode");
        if (otpRequest.mode === "local-dev") toast("Local test OTP: 123456");
      } catch (error) {
        console.warn("OTP request failed:", error);
        toast(error.message || "Something went wrong. Please try again.");
      }
      return;
    }
    if (event.target.closest("[data-verify-otp]")) {
      var otp = byId("otpInput").value.replace(/\D/g, "");
      if (window.KaamKaroAuth && window.KaamKaroAuth.isSupabaseConfigured()) {
        if (otp.length !== 6) return toast("Enter the 6 digit OTP code.");
      } else if (otp.length !== 4 && otp.length !== 6) {
        return toast("Enter the OTP code.");
      }
      try {
        var authResult = window.KaamKaroAuth ? await window.KaamKaroAuth.verifyOtp(state.pendingLoginPhone || state.user.phone || state.employer.phone || byId("phoneInput").value, otp) : { phone: state.pendingLoginPhone || state.user.phone || state.employer.phone, user: null };
        var authUser = authResult.user || {};
        activateAccountState(authUser, authResult.phone || state.user.phone || state.employer.phone);
        delete state.pendingLoginPhone;
        save();
        await hydrateSupabaseSession();
        track("otp_verified");
        if (phoneUpdatePending) { phoneUpdatePending = false; toast("Phone number updated OK"); show("accountSettings"); return; }
        routeAfterOtp();
      } catch (error) {
        console.warn("OTP verification failed:", error);
        toast(error.message || "Something went wrong. Please try again.");
      }
      return;
    }
    if (event.target.closest("[data-change-number]")) { show("otp"); return; }
    if (event.target.closest("[data-resend-otp]")) { toast("OTP sent again."); track("otp_resend"); return; }
    var workerBasic = event.target.closest("[data-worker-basic]");
    if (workerBasic) {
      state.worker.name = byId("workerName").value.trim();
      state.worker.gender = byId("workerGender").value;
      state.worker.age = byId("workerAge").value.trim();
      var workerLocation = selectedLocations.workerBasic || selectedLocationFromInput(byId("workerCity").value.trim());
      if (!workerLocation) return toast("Please select a location from the list.");
      applyStructuredLocation("user", workerLocation);
      applyStructuredLocation("worker", workerLocation);
      save();
      show("workerWork");
      return;
    }
    var anyJob = event.target.closest("[data-any-job]");
    if (anyJob) { state.worker.preferredJob = "Any Job"; state.worker.jobTypes = []; save(); renderCategories(); toast("All jobs will be shown."); return; }
    var addJobType = event.target.closest("[data-add-job-type]");
    if (addJobType) { addWorkerJobType(byId("workSearch") ? byId("workSearch").value : ""); return; }
    var workCat = event.target.closest("[data-work-cat]");
    if (workCat) { addWorkerJobType(workCat.dataset.workCat); return; }
    var removeJobType = event.target.closest("[data-remove-job-type]");
    if (removeJobType) {
      state.worker.jobTypes = (state.worker.jobTypes || []).filter(function (type) { return type !== removeJobType.dataset.removeJobType; });
      if (!state.worker.jobTypes.length) state.worker.preferredJob = "Any Job";
      save(); renderCategories(); return;
    }
    var skill = event.target.closest("[data-skill]");
    if (skill) {
      var i = state.worker.skills.indexOf(skill.dataset.skill);
      if (i >= 0) state.worker.skills.splice(i, 1); else state.worker.skills.push(skill.dataset.skill);
      save(); renderSkills(); return;
    }
    var removeSkill = event.target.closest("[data-remove-skill]");
    if (removeSkill) {
      state.worker.skills = state.worker.skills.filter(function (s) { return s !== removeSkill.dataset.removeSkill; });
      save(); renderSkills(); return;
    }
    var addSkill = event.target.closest("[data-add-skill]");
    if (addSkill) {
      var value = byId("manualSkill").value.trim();
      if (value && state.worker.skills.indexOf(value) < 0) state.worker.skills.push(value);
      byId("manualSkill").value = "";
      save(); renderSkills(); return;
    }
    var exp = event.target.closest("[data-exp]");
    if (exp) { state.worker.experience = exp.dataset.exp; exp.parentElement.querySelectorAll(".choice").forEach(function (c) { c.classList.remove("selected"); }); exp.classList.add("selected"); save(); return; }
    var onboardStart = event.target.closest("[data-onboard-start]");
    if (onboardStart) { state.worker.flexibleAvailability = false; state.worker.startAvailability = onboardStart.dataset.onboardStart; save(); renderOnboardingAvailability(); return; }
    if (event.target.closest("[data-onboard-all-days]")) {
      state.worker.flexibleAvailability = false;
      var allDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
      var hasAllDays = allDays.every(function (day) { return (state.worker.availableDays || []).indexOf(day) >= 0; });
      state.worker.availableDays = hasAllDays ? [] : allDays.slice();
      save(); renderOnboardingAvailability(); return;
    }
    var onboardDay = event.target.closest("[data-onboard-day]");
    if (onboardDay) {
      state.worker.flexibleAvailability = false;
      state.worker.availableDays = state.worker.availableDays || [];
      var onboardDayIndex = state.worker.availableDays.indexOf(onboardDay.dataset.onboardDay);
      if (onboardDayIndex >= 0) state.worker.availableDays.splice(onboardDayIndex, 1); else state.worker.availableDays.push(onboardDay.dataset.onboardDay);
      save(); renderOnboardingAvailability(); return;
    }
    var onboardShift = event.target.closest("[data-onboard-shift]");
    if (onboardShift) { state.worker.flexibleAvailability = false; state.worker.shiftPreference = onboardShift.dataset.onboardShift; save(); renderOnboardingAvailability(); return; }
    if (event.target.closest("[data-flexible-availability]")) {
      state.worker.flexibleAvailability = !state.worker.flexibleAvailability;
      if (state.worker.flexibleAvailability) {
        state.worker.startAvailability = "";
        state.worker.availableDays = [];
        state.worker.shiftPreference = "";
      }
      save(); renderOnboardingAvailability(); return;
    }
    if (event.target.closest("[data-upload-photo]")) {
      if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Take a clear photo of your face (head and shoulders).";
      if (byId("photoFile")) byId("photoFile").click();
      else {
        applyPhotoVerified("local-photo-verified");
        toast("Photo uploaded successfully");
      }
      return;
    }
    if (event.target.closest("[data-add-city]")) { setActiveCity(byId("jobSearch") ? byId("jobSearch").value : ""); return; }
    if (event.target.closest("[data-clear-city]")) { activeCity = ""; localStorage.removeItem("kkActiveCity"); renderFeed(); return; }
    var locMode = event.target.closest("[data-location-mode]");
    if (locMode) { locationMode = locMode.dataset.locationMode; locMode.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); }); locMode.classList.add("selected"); if (byId("locationHint")) byId("locationHint").textContent = locationMode === "remote" ? "Showing remote work." : "Showing nearby options."; return; }
    var openPay = event.target.closest("[data-open-pay]");
    if (openPay) {
      payOpen = !payOpen;
      state.worker.openAnyPay = payOpen;
      openPay.classList.toggle("selected", payOpen);
      byId("payRange").style.display = payOpen ? "none" : "block";
      save();
      return;
    }
    var payType = event.target.closest("[data-pay-type]");
    if (payType) {
      state.worker.payType = payType.dataset.payType;
      payType.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      payType.classList.add("selected");
      save();
      return;
    }
    var payRange = event.target.closest("[data-pay-range]");
    if (payRange) {
      state.worker.payRange = payRange.dataset.payRange;
      byId("payPref").value = state.worker.payRange;
      byId("payRanges").querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      payRange.classList.add("selected");
      save();
      return;
    }
    var visibility = event.target.closest("[data-visibility]");
    if (visibility) {
      postVisibility = visibility.dataset.visibility;
      visibility.parentElement.querySelectorAll(".plan").forEach(function (p) { p.classList.remove("selected"); });
      visibility.classList.add("selected");
      if (byId("publishJobBtn")) byId("publishJobBtn").disabled = false;
      if (byId("visibilityError")) byId("visibilityError").style.display = "none";
      return;
    }
    var finish = event.target.closest("[data-finish-worker]");
    if (finish) { await finishWorker(); return; }
    var finishEmp = event.target.closest("[data-finish-employer]");
    if (finishEmp) {
      state.employerComplete = true;
      var businessId = state.defaultBusinessId || ("biz-" + Date.now());
      state.defaultBusinessId = businessId;
      state.employer.id = businessId;
      state.employer.ownerId = state.user.id || state.worker.id;
      state.employer.business = byId("businessName").value.trim();
      state.employer.name = byId("contactName").value.trim();
      state.employer.phone = byId("businessPhone").value.trim() || state.employer.phone;
      state.employer.type = byId("businessType").value || byId("businessTypeOther").value || state.employer.type;
      var businessLocationInput = byId("businessLocation");
      var businessLocation = selectedLocations.businessSetup || selectedLocationFromInput(businessLocationInput ? businessLocationInput.value.trim() : "");
      if (!businessLocation) return toast("Please select a location from the list.");
      applyStructuredLocation("employer", businessLocation);
      state.user.displayName = state.employer.name || state.user.displayName;
      state.user.city = state.employer.city || state.user.city;
      state.user.location = state.user.city;
      state.businessProfiles[businessId] = { businessId: businessId, ownerId: state.user.id || state.worker.id, businessName: state.employer.business, contactPersonName: state.employer.name, city: state.employer.city, district: state.employer.district, state: state.employer.state, country: state.employer.country || "India", location: state.employer.formatted_location, formatted_location: state.employer.formatted_location, place_id: state.employer.place_id || "", lat: state.employer.lat || null, lng: state.employer.lng || null, phone: state.employer.phone, type: state.employer.type, createdAt: Date.now() };
      var nextEmployerRoute = pendingEmployerRoute || "employerDash";
      pendingEmployerRoute = "";
      setupReturnRoute = "";
      localStorage.removeItem("kkPendingEmployerRoute");
      localStorage.removeItem("kkSetupReturnRoute");
      updateLocalAuthProfileFlags();
      save();
      await saveEmployerProfileRemote();
      track("employer_setup_complete"); show(nextEmployerRoute); return;
    }
    var filter = event.target.closest("[data-filter]");
    if (filter) {
      activeFilter = filter.dataset.filter;
      locationMode = activeFilter === "remote" ? "remote" : (activeFilter === "near" ? "near" : "city");
      if (activeFilter === "near" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function () {}, function () {}, { enableHighAccuracy: false, timeout: 2500, maximumAge: 600000 });
      }
      jobIndex = 0;
      filter.parentElement.querySelectorAll(".chip").forEach(function (c) { c.classList.remove("selected"); });
      filter.classList.add("selected");
      renderFeed();
      return;
    }
    var applyJob = event.target.closest("[data-apply-job]");
    if (applyJob) { await applyToJob(applyJob.dataset.applyJob); return; }
    var next = event.target.closest("[data-next-job]");
    if (next) { await nextJob(); return; }
    var selectJob = event.target.closest("[data-select-job]");
    if (selectJob) { await applyToJob(selectJob.dataset.selectJob); return; }
    var jobDetail = event.target.closest("[data-job-detail]");
    if (jobDetail) { selectedJobId = jobDetail.dataset.jobDetail; show("employerJobDetail"); return; }
    var openWorker = event.target.closest("[data-open-worker]");
    if (openWorker) {
      selectedWorkerId = openWorker.dataset.openWorker;
      selectedJobId = openWorker.dataset.jobId || selectedJobId;
      var viewedApp = appForSelected();
      if (viewedApp && viewedApp.status === "Interested") { viewedApp.status = "Viewed"; notify("Employer viewed your profile.", "applications"); save(); }
      show("workerProfileView");
      return;
    }
    var rejectApp = event.target.closest("[data-reject-app]");
    if (rejectApp) { await setApplicationStatus(rejectApp.dataset.rejectApp, "Rejected"); return; }
    var acceptApp = event.target.closest("[data-accept-app]");
    if (acceptApp) { await setApplicationStatus(acceptApp.dataset.acceptApp, "Accepted"); return; }
    if (event.target.closest("[data-reject-current]")) { await setApplicationStatus(null, "Rejected"); return; }
    if (event.target.closest("[data-accept-current]")) { await setApplicationStatus(null, "Accepted"); return; }
    if (event.target.closest("[data-review-job]")) {
      if (validateJobDraft()) {
        if (jobFormMode === "edit") await saveEditedJob();
        else { resetVisibilityChoice(); show("jobVisibility"); }
      }
      return;
    }
    if (event.target.closest("[data-post-job]")) { openPublishConfirmation(); return; }
    if (event.target.closest("[data-confirm-post-job]")) { closeModal(); await addPostedJob(); return; }
    var toastTarget = event.target.closest("[data-toast]");
    if (toastTarget) toast(toastTarget.dataset.toast);
  });
  document.addEventListener("input", function (event) {
    if (event.target.matches("[data-location-input]")) {
      fillLocationDatalist(event.target.value);
      var exactLocation = selectedLocationFromInput(event.target.value);
      if (exactLocation) saveLocationTo(event.target.dataset.locationInput, exactLocation);
      else {
        delete selectedLocations[event.target.dataset.locationInput];
        if (event.target.dataset.locationInput === "profileEdit") editDraft.location = null;
      }
    }
    if (event.target.id === "jobSearch") { jobIndex = 0; renderFeed(); }
    if (event.target.id === "manualSearch") renderSearch();
    if (event.target.id === "postDesc") renderPostDescCounter();
    if (event.target.id === "locationSearch") { state.worker.city = event.target.value.trim() || state.worker.city; save(); renderFeed(); }
    if (event.target.id === "profileEditInput") {
      editDraft.value = event.target.value.trim();
      if (editingProfileField !== "workerSkills") markEditDirty();
    }
    if (event.target.id === "jobRules" && event.target.checked) byId("jobRulesError").style.display = "none";
    if (event.target.id === "deleteConfirmPhone") {
      var typedDeletePhone = event.target.value.replace(/\D/g, "").slice(0, 10);
      event.target.value = typedDeletePhone;
      var expectedPhone = (state.user.phone || state.employer.phone || "").replace(/\D/g, "").slice(-10);
      var matches = typedDeletePhone === expectedPhone && expectedPhone.length === 10;
      byId("deleteAccountBtn").disabled = !matches;
      if (byId("deletePhoneError")) byId("deletePhoneError").textContent = typedDeletePhone.length === 10 && !matches ? "Number does not match this account." : "";
    }
    if (event.target.id === "payPref") { state.worker.payRange = event.target.value.trim(); state.worker.openAnyPay = false; save(); }
  });
  document.addEventListener("change", async function (event) {
    if (event.target.id === "photoFile") {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Checking photo...";
      if (window.KaamKaroProfile && window.KaamKaroProfile.uploadProfilePhoto) {
        try {
          var publicPhotoUrl = await window.KaamKaroProfile.uploadProfilePhoto(file, state);
          if (publicPhotoUrl) {
            applyPhotoVerified(publicPhotoUrl);
            if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Photo uploaded successfully";
            stopPhotoCamera();
            toast("Photo uploaded successfully");
            render();
            if (isEditMode && currentScreen === "verifyId") returnFromEditMode();
            return;
          }
        } catch (error) {
          console.warn("Supabase photo upload failed:", error);
          if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Upload failed. Saved locally for now.";
        }
      }
      var reader = new FileReader();
      reader.onload = function () {
        applyPhotoVerified(String(reader.result || "local-photo-verified"));
        if (byId("photoCameraStatus")) byId("photoCameraStatus").textContent = "Photo uploaded successfully";
        stopPhotoCamera();
        toast("Photo uploaded successfully");
        render();
        if (isEditMode && currentScreen === "verifyId") returnFromEditMode();
      };
      reader.readAsDataURL(file);
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.target.id === "workSearch" && event.key === "Enter") {
      event.preventDefault();
      addWorkerJobType(event.target.value);
    }
    if (event.target.id === "jobSearch" && event.key === "Enter") {
      event.preventDefault();
      setActiveCity(event.target.value);
    }
  });
  document.addEventListener("pointerdown", function (event) {
    pointerCard = event.target.closest("#jobFeed .job-card");
    if (!pointerCard) return;
    pointerStartX = event.clientX;
    pointerDeltaX = 0;
    pointerCard.style.transition = "none";
  });
  document.addEventListener("pointermove", function (event) {
    if (!pointerStartX || !pointerCard) return;
    pointerDeltaX = event.clientX - pointerStartX;
    var width = pointerCard.offsetWidth || 320;
    var progress = Math.min(1, Math.abs(pointerDeltaX) / width);
    var rotate = Math.max(-10, Math.min(10, pointerDeltaX / 18));
    var resistance = Math.sign(pointerDeltaX) * Math.pow(Math.abs(pointerDeltaX), .96);
    var scale = 1 - progress * .035;
    pointerCard.style.transform = "translateX(" + resistance + "px) rotate(" + rotate + "deg) scale(" + scale + ")";
    pointerCard.classList.toggle("swipe-like", pointerDeltaX > 22);
    pointerCard.classList.toggle("swipe-skip", pointerDeltaX < -22);
  });
  document.addEventListener("pointerup", function (event) {
    if (!pointerStartX || !pointerCard) return;
    var card = pointerCard;
    var delta = pointerDeltaX || (event.clientX - pointerStartX);
    var threshold = (card.offsetWidth || 320) * .32;
    pointerStartX = 0;
    pointerCard = null;
    pointerDeltaX = 0;
    card.style.transition = "transform .24s cubic-bezier(.16,.9,.2,1)";
    if (delta < -threshold) {
      card.style.transform = "translateX(-118vw) rotate(-10deg) scale(.96)";
      setTimeout(function () { nextJob(); card.style.transform = ""; }, 210);
      return;
    }
    if (delta > threshold) {
      card.style.transform = "translateX(118vw) rotate(10deg) scale(.98)";
      var list = filteredJobs("");
      if (list.length) setTimeout(function () { track("job_swipe_right"); applyToJob(list[jobIndex].id); card.style.transform = ""; }, 210);
      return;
    }
    card.classList.remove("swipe-like", "swipe-skip");
    card.style.transition = "transform .28s cubic-bezier(.18,1.35,.28,1)";
    card.style.transform = "translateX(0) rotate(0deg) scale(1)";
    setTimeout(function () { card.style.transition = ""; card.style.transform = ""; }, 290);
  });
  byId("sendChat").addEventListener("click", function () {
    var text = byId("chatText").value.trim();
    if (!text) return;
    sendChatMessage(text);
    byId("chatText").value = "";
  });
  byId("chatText").addEventListener("keydown", function (event) {
    if (event.key === "Enter") byId("sendChat").click();
  });
  window.kkGo = show;
  setupScreenBodies();
  document.querySelectorAll(".screen > nav.nav").forEach(function (nav) { nav.remove(); });
  document.querySelectorAll(".screen:not(.active)").forEach(function (screen) { screen.classList.add("was-right"); });
  fillBasicDefaults();
  if (byId("payRange")) byId("payRange").style.display = "none";
  render();
  hydrateSupabaseSession();
})();
