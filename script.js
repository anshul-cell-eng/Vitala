/**
 * VITALA — AI-POWERED HEALTH & DISASTER RESILIENCE COMPANION
 * Master 3D Engine & GSAP Cinematic Scroll Storytelling
 * Problem Statement: SIH26181
 */

(() => {
  "use strict";

  // Force scroll position to top on every refresh
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);

  // If page was loaded with a section hash, clear it so browser stays at top
  if (window.location.hash) {
    history.replaceState(null, document.title, window.location.pathname + window.location.search);
  }

  window.addEventListener("beforeunload", () => {
    window.scrollTo(0, 0);
  });

  const canvas = document.getElementById("scene");
  const canvasContainer = document.getElementById("canvasContainer");

  if (!canvas || !window.THREE) {
    console.error("VITALA: WebGL Canvas or Three.js not found.");
    return;
  }

  const THREE = window.THREE;

  // ==========================================
  // 1. SCENE, CAMERA & RENDERER SETUP
  // ==========================================
  const scene = new THREE.Scene();
  let vitalaCore = null;

  const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.2, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  function resize() {
    if (!canvasContainer) return;
    const w = canvasContainer.clientWidth || window.innerWidth;
    const h = canvasContainer.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    const aspect = w / h;
    if (vitalaCore) {
      if (aspect < 1.0) {
        // Mobile Portrait: center 3D core in background
        vitalaCore.position.set(0.0, 0.15, 0);
        vitalaCore.scale.set(0.65, 0.65, 0.65);
      } else if (aspect < 1.4) {
        // Laptop / Small Desktop (e.g. 1366x768, 1440x900)
        vitalaCore.position.set(1.35, 0.05, 0);
        vitalaCore.scale.set(0.76, 0.76, 0.76);
      } else {
        // Widescreen Desktop (e.g. 1920x1080)
        vitalaCore.position.set(1.45, 0.05, 0);
        vitalaCore.scale.set(0.80, 0.80, 0.80);
      }
    }
  }
  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("load", resize);

  // ==========================================
  // 2. CINEMATIC STUDIO LIGHTING
  // ==========================================
  const ambientLight = new THREE.AmbientLight(0x06111f, 2.2);
  scene.add(ambientLight);

  // Key Light (Crisp White/Cyan directional highlight)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
  keyLight.position.set(6, 8, 7);
  scene.add(keyLight);

  // Cyan Rim Light (Back-Left edge glow)
  const cyanRim = new THREE.DirectionalLight(0x00e5ff, 3.8);
  cyanRim.position.set(-7, 2, -4);
  scene.add(cyanRim);

  // Emerald Green Accent Light (Bottom-Right)
  const greenAccent = new THREE.DirectionalLight(0x00ff88, 3.0);
  greenAccent.position.set(7, -3, -3);
  scene.add(greenAccent);

  // Dynamic Bio-Core Point Light (Internal ruby/crimson glow)
  const bioPointLight = new THREE.PointLight(0xff1744, 18, 10);
  bioPointLight.position.set(0, 0.1, 0.4);
  scene.add(bioPointLight);

  // Pedestal Induction Point Light
  const pedestalPointLight = new THREE.PointLight(0x00ffcc, 12, 7);
  pedestalPointLight.position.set(0, -1.8, 0.8);
  scene.add(pedestalPointLight);

  // Master World Group (with GSAP / Mouse parallax integration)
  const world = new THREE.Group();
  scene.add(world);

  // ==========================================
  // 3. PREMIUM MATERIAL DEFINITIONS
  // ==========================================
  // Dark Titanium Precision Housing
  const titaniumMat = new THREE.MeshStandardMaterial({
    color: 0x111620,
    metalness: 0.92,
    roughness: 0.24
  });

  // Brushed Satin Gold Accents
  const goldAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.28
  });

  // Dark Carbon Fiber Trim
  const carbonMat = new THREE.MeshStandardMaterial({
    color: 0x070b10,
    metalness: 0.85,
    roughness: 0.4
  });

  // Outer Transparent Protective Glass Shell
  const glassShellMat = new THREE.MeshPhysicalMaterial({
    color: 0xdff6ff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.08,
    metalness: 0.1,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    transmission: 0.75,
    ior: 1.52,
    depthWrite: false
  });

  // Internal Biological Core Material (Rich organic garnet with emissive heartbeat pulse)
  const bioCoreMat = new THREE.MeshStandardMaterial({
    color: 0x5a0818,
    emissive: 0xff1744,
    emissiveIntensity: 2.2,
    metalness: 0.4,
    roughness: 0.32,
    transparent: true,
    opacity: 0.92
  });

  // Cyan Neon Laser Ring
  const cyanNeonMat = new THREE.MeshBasicMaterial({
    color: 0x00e5ff,
    transparent: true,
    opacity: 0.9
  });

  // Green Active Telemetry Neon
  const greenNeonMat = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.95
  });

  // ==========================================
  // 4. VITALA INTELLIGENCE CORE (MODULAR 3D OBJECT)
  // ==========================================
  vitalaCore = new THREE.Group();
  vitalaCore.position.set(1.4, 0.05, 0); // Positioned elegantly in right-center 40-45% zone
  vitalaCore.scale.set(0.8, 0.8, 0.8);
  world.add(vitalaCore);

  // ------------------------------------------
  // A. LOWER MAGNETIC LEVITATION PEDESTAL
  // ------------------------------------------
  const pedestalGroup = new THREE.Group();
  pedestalGroup.position.y = -1.75;
  vitalaCore.add(pedestalGroup);

  // Stepped Titanium Base
  const baseDisk1 = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.4, 0.1, 48), titaniumMat);
  const baseDisk2 = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.05, 0.08, 48), carbonMat);
  baseDisk2.position.y = 0.08;
  const baseDisk3 = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.5, 0.06, 48), titaniumMat);
  baseDisk3.position.y = 0.14;
  pedestalGroup.add(baseDisk1, baseDisk2, baseDisk3);

  // Multi-Tiered Concentric Hologram Rings
  const pedestalRings = [];
  const ringParams = [
    { r: 2.15, w: 0.025, col: 0x00e5ff, speed: 0.004 },
    { r: 1.75, w: 0.03, col: 0x8b5cf6, speed: -0.006 },
    { r: 1.35, w: 0.035, col: 0x00ff88, speed: 0.008 },
    { r: 0.95, w: 0.04, col: 0x00ffcc, speed: -0.012 }
  ];

  ringParams.forEach(p => {
    const geo = new THREE.TorusGeometry(p.r, p.w, 16, 96);
    const mat = new THREE.MeshBasicMaterial({ color: p.col, transparent: true, opacity: 0.85 });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.16;
    pedestalGroup.add(ring);
    pedestalRings.push({ mesh: ring, speed: p.speed });
  });

  // Vertical Cyan Induction Light Column (Volumetric Laser Pillar)
  const beamGeo = new THREE.CylinderGeometry(0.35, 1.4, 3.2, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 1.6;
  pedestalGroup.add(beam);

  // ------------------------------------------
  // B. TRANSPARENT PROTECTIVE GLASS CAPSULE
  // ------------------------------------------
  const glassChamberGroup = new THREE.Group();
  vitalaCore.add(glassChamberGroup);

  const glassOuterGeo = new THREE.CylinderGeometry(1.35, 1.35, 2.4, 36, 1, false);
  const glassOuter = new THREE.Mesh(glassOuterGeo, glassShellMat);
  glassChamberGroup.add(glassOuter);

  // Top and Bottom Glass Capsule End Caps (Spherical Domes)
  const topDomeGeo = new THREE.SphereGeometry(1.35, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const topDome = new THREE.Mesh(topDomeGeo, glassShellMat);
  topDome.position.y = 1.2;
  glassChamberGroup.add(topDome);

  const botDomeGeo = new THREE.SphereGeometry(1.35, 36, 18, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  const botDome = new THREE.Mesh(botDomeGeo, glassShellMat);
  botDome.position.y = -1.2;
  glassChamberGroup.add(botDome);

  // ------------------------------------------
  // C. ARTICULATING OUTER TITANIUM HOUSING (4 QUADRANTS)
  // ------------------------------------------
  const outerHousingGroup = new THREE.Group();
  vitalaCore.add(outerHousingGroup);

  // Creates high-precision quadrant shells with ventilation slats
  function createShellQuadrant(startAngle, endAngle, isTop) {
    const qGroup = new THREE.Group();
    const radius = 1.45;
    const height = 1.0;

    const shellGeo = new THREE.CylinderGeometry(radius, radius, height, 18, 1, true, startAngle, endAngle - startAngle);
    const shellMesh = new THREE.Mesh(shellGeo, titaniumMat);
    qGroup.add(shellMesh);

    // Beveled Gold Rim Edge Ring
    const edgeCurve = new THREE.CylinderGeometry(radius + 0.02, radius + 0.02, 0.06, 18, 1, true, startAngle, endAngle - startAngle);
    const edgeMesh = new THREE.Mesh(edgeCurve, goldAccentMat);
    edgeMesh.position.y = isTop ? -height / 2 : height / 2;
    qGroup.add(edgeMesh);

    // Micro Ventilation Slits
    for (let s = -0.3; s <= 0.3; s += 0.2) {
      const slit = new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.015, radius + 0.015, 0.04, 12, 1, true, startAngle + 0.15, (endAngle - startAngle) - 0.3),
        carbonMat
      );
      slit.position.y = s;
      qGroup.add(slit);
    }

    qGroup.position.y = isTop ? 0.7 : -0.7;
    return qGroup;
  }

  const quadTL = createShellQuadrant(0.1, Math.PI * 0.9, true);
  const quadTR = createShellQuadrant(Math.PI * 1.1, Math.PI * 1.9, true);
  const quadBL = createShellQuadrant(0.1, Math.PI * 0.9, false);
  const quadBR = createShellQuadrant(Math.PI * 1.1, Math.PI * 1.9, false);

  outerHousingGroup.add(quadTL, quadTR, quadBL, quadBR);

  // Top & Bottom Machined Retaining Collars
  const topCollar = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 16, 48), titaniumMat);
  topCollar.rotation.x = Math.PI / 2;
  topCollar.position.y = 1.35;

  const botCollar = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.07, 16, 48), titaniumMat);
  botCollar.rotation.x = Math.PI / 2;
  botCollar.position.y = -1.35;
  outerHousingGroup.add(topCollar, botCollar);

  // ------------------------------------------
  // D. GIMBAL RING ASSEMBLY & SENSOR APERTURES
  // ------------------------------------------
  const gimbalGroup = new THREE.Group();
  vitalaCore.add(gimbalGroup);

  const gimbal1 = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.035, 16, 64), titaniumMat);
  gimbalGroup.add(gimbal1);

  const gimbal2 = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.025, 16, 64), goldAccentMat);
  gimbal2.rotation.x = Math.PI / 3;
  gimbalGroup.add(gimbal2);

  const gimbal3 = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.02, 16, 64), cyanNeonMat);
  gimbal3.rotation.y = Math.PI / 4;
  gimbalGroup.add(gimbal3);

  // ------------------------------------------
  // E. INTERNAL BIOLOGICAL BIO-CORE (Biometric Heart)
  // ------------------------------------------
  const bioHeartGroup = new THREE.Group();
  bioHeartGroup.position.set(0, 0, 0);
  vitalaCore.add(bioHeartGroup);

  // Organic Sculpted Biometric Core (Capsular Torso)
  const coreBodyGeo = new THREE.SphereGeometry(0.68, 32, 24);
  coreBodyGeo.scale(1.0, 1.25, 0.85); // Anatomical cardiac curvature
  const bioCoreMesh = new THREE.Mesh(coreBodyGeo, bioCoreMat);
  bioHeartGroup.add(bioCoreMesh);

  // Delicate Internal Vascular Vessels (Smooth Catmull-Rom Artery Curves)
  const aortaTubeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.0, 0.5, 0.1),
    new THREE.Vector3(0.12, 0.85, 0.15),
    new THREE.Vector3(-0.15, 1.05, 0.05),
    new THREE.Vector3(-0.35, 0.92, -0.1)
  ]);
  const aortaMesh = new THREE.Mesh(
    new THREE.TubeGeometry(aortaTubeCurve, 24, 0.09, 12, false),
    new THREE.MeshStandardMaterial({ color: 0x9e0b2b, emissive: 0xff1744, emissiveIntensity: 1.8, metalness: 0.6, roughness: 0.3 })
  );
  bioHeartGroup.add(aortaMesh);

  // 3 Micro Arterial Ascending Branches
  const branches = [
    [new THREE.Vector3(0.04, 0.95, 0.12), new THREE.Vector3(0.12, 1.25, 0.15)],
    [new THREE.Vector3(-0.1, 1.02, 0.06), new THREE.Vector3(-0.08, 1.3, 0.08)],
    [new THREE.Vector3(-0.25, 0.98, -0.02), new THREE.Vector3(-0.28, 1.26, -0.01)]
  ];
  branches.forEach(b => {
    const c = new THREE.CatmullRomCurve3(b);
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(c, 10, 0.035, 8, false),
      new THREE.MeshStandardMaterial({ color: 0x9e0b2b, emissive: 0xff1744, emissiveIntensity: 1.5 })
    );
    bioHeartGroup.add(m);
  });

  // ------------------------------------------
  // F. TINYML NEURAL PROCESSOR ARRAY & CIRCUIT CORE
  // ------------------------------------------
  const tinyMlGroup = new THREE.Group();
  tinyMlGroup.position.set(0, -0.2, 0);
  vitalaCore.add(tinyMlGroup);

  // Silicon Processor Substrate
  const chipSubstrate = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 0.08, 0.85),
    new THREE.MeshStandardMaterial({ color: 0x0a1018, metalness: 0.8, roughness: 0.2 })
  );
  chipSubstrate.position.y = -0.55;
  tinyMlGroup.add(chipSubstrate);

  // Heat Sink Aluminum Fins
  for (let f = -0.3; f <= 0.3; f += 0.12) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.75, 0.06, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x223040, metalness: 0.9, roughness: 0.15 })
    );
    fin.position.set(0, -0.48, f);
    tinyMlGroup.add(fin);
  }

  // Micro Status LEDs (Blinking Neural Activity)
  const ledGeo = new THREE.SphereGeometry(0.022, 8, 8);
  const greenLed = new THREE.Mesh(ledGeo, greenNeonMat);
  greenLed.position.set(0.32, -0.47, 0.32);
  const cyanLed = new THREE.Mesh(ledGeo, cyanNeonMat);
  cyanLed.position.set(0.32, -0.47, -0.32);
  tinyMlGroup.add(greenLed, cyanLed);

  // ------------------------------------------
  // G. DYNAMIC HOLOGRAPHIC ECG WAVEFORM RIBBON
  // ------------------------------------------
  const ecgCount = 72;
  const ecgPositions = new Float32Array(ecgCount * 3);
  const ecgGeo = new THREE.BufferGeometry();
  ecgGeo.setAttribute("position", new THREE.BufferAttribute(ecgPositions, 3));
  const ecgMat = new THREE.LineBasicMaterial({
    color: 0xffe600,
    linewidth: 2.5,
    blending: THREE.AdditiveBlending
  });
  const ecgRibbon = new THREE.Line(ecgGeo, ecgMat);
  bioHeartGroup.add(ecgRibbon);

  // ------------------------------------------
  // H. 5 CURVED LASER DATA STREAMS & CONDUITS
  // ------------------------------------------
  const conduitConfigs = [
    { name: "PHYSIOLOGICAL", color: 0xff2a5f, start: new THREE.Vector3(1.2, 2.2, 0), ctrl: new THREE.Vector3(0.8, 1.4, 0.5), end: new THREE.Vector3(0.1, 0.9, 0.1) },
    { name: "ENVIRONMENT",   color: 0x00e5ff, start: new THREE.Vector3(-2.6, 1.4, 0), ctrl: new THREE.Vector3(-1.6, 0.8, 0.5), end: new THREE.Vector3(-0.9, 0.3, 0.1) },
    { name: "MOTION",        color: 0x00ff88, start: new THREE.Vector3(2.8, 1.4, 0), ctrl: new THREE.Vector3(1.8, 0.8, 0.5), end: new THREE.Vector3(0.9, 0.3, 0.1) },
    { name: "LOCATION",      color: 0x8b5cf6, start: new THREE.Vector3(-2.4, -1.2, 0), ctrl: new THREE.Vector3(-1.5, -0.6, 0.5), end: new THREE.Vector3(-0.7, -0.6, 0.1) },
    { name: "EDGE_AI",       color: 0xf59e0b, start: new THREE.Vector3(2.6, -1.2, 0), ctrl: new THREE.Vector3(1.6, -0.6, 0.5), end: new THREE.Vector3(0.7, -0.6, 0.1) }
  ];

  conduitConfigs.forEach(cfg => {
    const curve = new THREE.QuadraticBezierCurve3(cfg.start, cfg.ctrl, cfg.end);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(36));
    const lineMat = new THREE.LineBasicMaterial({
      color: cfg.color,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    const lineMesh = new THREE.Line(lineGeo, lineMat);
    vitalaCore.add(lineMesh);
  });

  // Explicitly trigger initial resize and positioning now that vitalaCore is fully built
  resize();

  // ==========================================
  // 5. LIVE 60 FPS HTML5 RADAR SCANNER
  // ==========================================
  const radarCanvas = document.getElementById("radarCanvas");
  const radarCtx = radarCanvas ? radarCanvas.getContext("2d") : null;
  let radarAngle = 0;

  function drawRadar() {
    if (!radarCtx) return;
    const w = radarCanvas.width;
    const h = radarCanvas.height;
    const cx = w / 2, cy = h / 2, r = w / 2 - 4;

    radarCtx.clearRect(0, 0, w, h);

    // Range Rings
    radarCtx.strokeStyle = "rgba(0, 255, 136, 0.25)";
    radarCtx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      radarCtx.beginPath();
      radarCtx.arc(cx, cy, (r / 3) * i, 0, Math.PI * 2);
      radarCtx.stroke();
    }

    // Crosshairs
    radarCtx.beginPath();
    radarCtx.moveTo(cx, 4); radarCtx.lineTo(cx, h - 4);
    radarCtx.moveTo(4, cy); radarCtx.lineTo(w - 4, cy);
    radarCtx.stroke();

    // Rotating Sweep Cone
    radarAngle += 0.035;
    const grad = radarCtx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, "rgba(0, 255, 136, 0.35)");
    grad.addColorStop(1, "rgba(0, 255, 136, 0.0)");

    radarCtx.save();
    radarCtx.translate(cx, cy);
    radarCtx.rotate(radarAngle);
    radarCtx.beginPath();
    radarCtx.moveTo(0, 0);
    radarCtx.arc(0, 0, r, -0.4, 0);
    radarCtx.closePath();
    radarCtx.fillStyle = grad;
    radarCtx.fill();

    // Sweep Beam
    radarCtx.beginPath();
    radarCtx.moveTo(0, 0); radarCtx.lineTo(r, 0);
    radarCtx.strokeStyle = "rgba(0, 255, 136, 0.9)";
    radarCtx.lineWidth = 1.5;
    radarCtx.stroke();
    radarCtx.restore();

    // Target Blip
    const blipX = cx + Math.cos(1.2) * (r * 0.65);
    const blipY = cy + Math.sin(1.2) * (r * 0.65);
    const alpha = Math.sin(Date.now() * 0.006) * 0.4 + 0.6;
    radarCtx.beginPath();
    radarCtx.arc(blipX, blipY, 3.5, 0, Math.PI * 2);
    radarCtx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
    radarCtx.fill();
  }

  // ==========================================
  // 6. GSAP SCROLLTRIGGER MASTER TIMELINE (5 PHASES)
  // ==========================================
  const phaseHUDs = [
    { num: "PHASE 01", title: "SENSE", fill: "20%" },
    { num: "PHASE 02", title: "INTERPRET", fill: "40%" },
    { num: "PHASE 03", title: "UNDERSTAND", fill: "60%" },
    { num: "PHASE 04", title: "PROTECT", fill: "80%" },
    { num: "PHASE 05", title: "RESILIENCE", fill: "100%" }
  ];

  function updateHUD(phaseIdx) {
    const p = phaseHUDs[phaseIdx];
    if (!p) return;
    const numEl = document.getElementById("phaseNum");
    const titleEl = document.getElementById("phaseTitle");
    const fillEl = document.getElementById("phaseFill");
    if (numEl) numEl.textContent = p.num;
    if (titleEl) titleEl.textContent = p.title;
    if (fillEl) fillEl.style.width = p.fill;

    // Toggle active story phase overlays
    const phases = document.querySelectorAll(".story-phase");
    phases.forEach((el, idx) => {
      el.classList.toggle("active", idx === phaseIdx);
    });
  }

  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof ScrollTrigger.clearScrollMemory === "function") {
      ScrollTrigger.clearScrollMemory();
    }

    // ==========================================
    // HERO ENTRANCE CINEMATIC REVEAL (PAGE LOAD)
    // ==========================================
    const heroIntroTL = gsap.timeline({ defaults: { ease: "power3.out" } });
    heroIntroTL
      .from(".topbar", { y: -25, opacity: 0, duration: 0.6 })
      .from(".project-tag", { y: 15, opacity: 0, duration: 0.45 }, "-=0.3")
      .from(".hero-word", { y: 30, opacity: 0, stagger: 0.07, duration: 0.65 }, "-=0.25")
      .from(".title-underline", { scaleX: 0, transformOrigin: "left center", duration: 0.5 }, "-=0.3")
      .from(".hero-desc", { y: 16, opacity: 0, duration: 0.55 }, "-=0.3")
      .from(".feature-pills .pill-card", { y: 18, opacity: 0, scale: 0.96, stagger: 0.08, duration: 0.5 }, "-=0.3")
      .from(".hero-actions", { y: 16, opacity: 0, duration: 0.5 }, "-=0.3")
      .from(".telemetry-node", { scale: 0.75, opacity: 0, stagger: 0.1, duration: 0.65, ease: "back.out(1.4)" }, "-=0.4")
      .from("#phaseHud", { x: -20, opacity: 0, duration: 0.55 }, "-=0.35")
      .from(".hero-bottom-bar", { y: 25, opacity: 0, duration: 0.6 }, "-=0.4");

    const masterTL = gsap.timeline({
      scrollTrigger: {
        trigger: ".hero-3d-experience",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        onUpdate: (self) => {
          const progress = self.progress;
          let phaseIdx = Math.min(Math.floor(progress * 5), 4);
          updateHUD(phaseIdx);
        }
      }
    });

    // ------------------------------------------
    // PHASE 01 -> 02: SENSE to INTERPRET (0.00 - 0.25)
    // ------------------------------------------
    masterTL.to(vitalaCore.rotation, { y: Math.PI * 0.5, x: 0.15, duration: 2, ease: "power1.inOut" }, 0)
      .to(camera.position, { z: 5.8, y: 0.1, duration: 2, ease: "power1.inOut" }, 0)
      // Articulate Outer Shells Outward (Exploding Disassembly)
      .to(quadTL.position, { x: -0.4, y: 1.1, z: 0.3, duration: 2, ease: "power2.out" }, 0.2)
      .to(quadTR.position, { x: 0.4, y: 1.1, z: -0.3, duration: 2, ease: "power2.out" }, 0.2)
      .to(quadBL.position, { x: -0.4, y: -1.1, z: 0.3, duration: 2, ease: "power2.out" }, 0.2)
      .to(quadBR.position, { x: 0.4, y: -1.1, z: -0.3, duration: 2, ease: "power2.out" }, 0.2);

    // ------------------------------------------
    // PHASE 02 -> 03: INTERPRET to UNDERSTAND (0.25 - 0.50)
    // ------------------------------------------
    masterTL.to(vitalaCore.rotation, { y: Math.PI * 1.1, x: -0.1, duration: 2, ease: "power1.inOut" }, 2)
      .to(camera.position, { z: 4.6, y: 0.05, duration: 2, ease: "power1.inOut" }, 2)
      .to(bioHeartGroup.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 2, ease: "power2.out" }, 2)
      .to(bioCoreMat, { emissiveIntensity: 4.5, duration: 2 }, 2);

    // ------------------------------------------
    // PHASE 03 -> 04: UNDERSTAND to PROTECT (0.50 - 0.75)
    // ------------------------------------------
    masterTL.to(vitalaCore.rotation, { y: Math.PI * 1.65, x: 0.2, duration: 2, ease: "power1.inOut" }, 4)
      .to(camera.position, { z: 5.4, y: 0.2, duration: 2, ease: "power1.inOut" }, 4)
      // Lock outer protective shields back with emergency neon halo
      .to(quadTL.position, { x: 0, y: 0.7, z: 0, duration: 1.8, ease: "power2.inOut" }, 4)
      .to(quadTR.position, { x: 0, y: 0.7, z: 0, duration: 1.8, ease: "power2.inOut" }, 4)
      .to(quadBL.position, { x: 0, y: -0.7, z: 0, duration: 1.8, ease: "power2.inOut" }, 4)
      .to(quadBR.position, { x: 0, y: -0.7, z: 0, duration: 1.8, ease: "power2.inOut" }, 4);

    // ------------------------------------------
    // PHASE 04 -> 05: PROTECT to RESILIENCE (0.75 - 1.00)
    // ------------------------------------------
    masterTL.to(vitalaCore.rotation, { y: Math.PI * 2.0, x: 0.0, duration: 2, ease: "power1.inOut" }, 6)
      .to(camera.position, { z: 7.2, y: 0.25, duration: 2, ease: "power1.inOut" }, 6)
      .to(gimbal3.scale, { x: 1.4, y: 1.4, z: 1.4, duration: 2, ease: "power2.out" }, 6);

    // ==========================================
    // SECTION-BY-SECTION GSAP ENTRANCE ANIMATIONS
    // ==========================================

    // 1. Statistics Counter Increment Animation (triggers when scrolled into view)
    const statBoxes = document.querySelectorAll(".stat-box[data-count]");
    statBoxes.forEach(box => {
      const countTarget = parseInt(box.getAttribute("data-count"), 10);
      const numSpan = box.querySelector(".counter-num");
      if (numSpan && !isNaN(countTarget)) {
        ScrollTrigger.create({
          trigger: box,
          start: "top 92%",
          once: true,
          onEnter: () => {
            const counter = { val: 0 };
            gsap.to(counter, {
              val: countTarget,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => {
                numSpan.textContent = Math.floor(counter.val);
              }
            });
          }
        });
      }
    });

    // 2. Section 02 — Vision Reveal
    const visionTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#vision",
        start: "top 78%",
        once: true
      }
    });
    visionTL
      .from("#vision .section-tag", { opacity: 0, y: 15, duration: 0.5, ease: "power2.out" })
      .from("#vision .col-title h2", { opacity: 0, y: 20, duration: 0.6, ease: "power3.out" }, "-=0.2")
      .from("#vision .col-desc p", { opacity: 0, y: 15, stagger: 0.12, duration: 0.6, ease: "power2.out" }, "-=0.3");

    // 3. Section 03 — Sensor Matrix & Fusion Visualizer Reveal
    const sensorTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#technology",
        start: "top 75%",
        once: true
      }
    });
    sensorTL
      .from("#technology .section-tag", { opacity: 0, y: 15, duration: 0.4, ease: "power2.out" })
      .from("#technology .section-heading", { opacity: 0, y: 20, duration: 0.5, ease: "power3.out" }, "-=0.2")
      .from("#fusionVisualizer", { opacity: 0, y: 25, duration: 0.6, ease: "power3.out" }, "-=0.2")
      .from(".fusion-node", { opacity: 0, x: -15, stagger: 0.06, duration: 0.5, ease: "power2.out" }, "-=0.3")
      .from("#fusionHub", { opacity: 0, scale: 0.85, duration: 0.6, ease: "back.out(1.5)" }, "-=0.3")
      .from("#technology .sensor-card", {
        opacity: 0,
        y: 25,
        scale: 0.98,
        stagger: 0.08,
        duration: 0.6,
        ease: "power3.out"
      }, "-=0.2");

    // Bidirectional Interactive Hover Linking (Sensor Nodes <-> Fusion Paths <-> Sensor Cards)
    const fNodes = document.querySelectorAll(".fusion-node");
    const sCards = document.querySelectorAll("#technology .sensor-card");

    fNodes.forEach(node => {
      const idx = node.dataset.sensor;
      const targetCard = document.querySelector(`#technology .sensor-card[data-idx="${idx}"]`);
      const targetPath = document.getElementById(`path${idx}`);

      node.addEventListener("mouseenter", () => {
        node.classList.add("active");
        if (targetPath) targetPath.classList.add("active");
        if (targetCard) {
          targetCard.style.borderColor = "var(--green)";
          targetCard.style.transform = "translateY(-4px)";
          targetCard.style.boxShadow = "0 0 20px rgba(0, 255, 136, 0.25)";
        }
      });

      node.addEventListener("mouseleave", () => {
        node.classList.remove("active");
        if (targetPath) targetPath.classList.remove("active");
        if (targetCard) {
          targetCard.style.borderColor = "";
          targetCard.style.transform = "";
          targetCard.style.boxShadow = "";
        }
      });
    });

    sCards.forEach(card => {
      const idx = card.dataset.idx;
      const targetNode = document.querySelector(`.fusion-node[data-sensor="${idx}"]`);
      const targetPath = document.getElementById(`path${idx}`);

      card.addEventListener("mouseenter", () => {
        if (targetNode) targetNode.classList.add("active");
        if (targetPath) targetPath.classList.add("active");
      });

      card.addEventListener("mouseleave", () => {
        if (targetNode) targetNode.classList.remove("active");
        if (targetPath) targetPath.classList.remove("active");
      });
    });

    // 4. Section 04 — Edge Intelligence Architecture Horizontal Progression & Live Data Flow
    const pipeSteps = document.querySelectorAll(".pipeline-flow .pipe-step");
    const arrowTracks = document.querySelectorAll(".pipeline-flow .pipe-arrow-track");

    ScrollTrigger.create({
      trigger: "#architecture",
      start: "top 92%",
      once: true,
      onEnter: () => {
        const archTL = gsap.timeline();
        archTL
          .from("#architecture .section-tag", { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" })
          .from("#architecture .col-title h2", { opacity: 0, y: 15, duration: 0.35, ease: "power3.out" }, "-=0.15")
          .from("#architecture .col-desc p", { opacity: 0, y: 10, duration: 0.35, ease: "power2.out" }, "-=0.2");

        pipeSteps.forEach((step, idx) => {
          archTL.from(step, {
            opacity: 0,
            y: 15,
            scale: 0.98,
            duration: 0.38,
            ease: "power2.out"
          }, "-=0.25");
          if (arrowTracks[idx]) {
            archTL.from(arrowTracks[idx], { opacity: 0, scale: 0.85, duration: 0.25, ease: "power2.out" }, "-=0.2");
          }
        });
      }
    });

    // Continuous Live Edge-AI Data Flow Pipeline Cycle (SENSE -> FILTER -> INTERPRET -> PROTECT)
    let currentFlowStage = 0;
    function runPipelineFlow() {
      // Deactivate all steps & arrows
      pipeSteps.forEach(s => s.classList.remove("pulse-active"));
      arrowTracks.forEach(a => a.classList.remove("flowing"));

      // Stage 0: SENSE
      if (pipeSteps[0]) pipeSteps[0].classList.add("pulse-active");

      // After 800ms: packet travels SENSE -> FILTER
      setTimeout(() => {
        if (arrowTracks[0]) arrowTracks[0].classList.add("flowing");
      }, 700);

      // Stage 1: FILTER
      setTimeout(() => {
        if (pipeSteps[0]) pipeSteps[0].classList.remove("pulse-active");
        if (pipeSteps[1]) pipeSteps[1].classList.add("pulse-active");
      }, 1400);

      // After 2100ms: packet travels FILTER -> INTERPRET
      setTimeout(() => {
        if (arrowTracks[1]) arrowTracks[1].classList.add("flowing");
      }, 2100);

      // Stage 2: INTERPRET
      setTimeout(() => {
        if (pipeSteps[1]) pipeSteps[1].classList.remove("pulse-active");
        if (pipeSteps[2]) pipeSteps[2].classList.add("pulse-active");
      }, 2800);

      // After 3500ms: packet travels INTERPRET -> PROTECT
      setTimeout(() => {
        if (arrowTracks[2]) arrowTracks[2].classList.add("flowing");
      }, 3500);

      // Stage 3: PROTECT
      setTimeout(() => {
        if (pipeSteps[2]) pipeSteps[2].classList.remove("pulse-active");
        if (pipeSteps[3]) pipeSteps[3].classList.add("pulse-active");
      }, 4200);

      // Cooldown & Loop restart
      setTimeout(() => {
        if (pipeSteps[3]) pipeSteps[3].classList.remove("pulse-active");
        arrowTracks.forEach(a => a.classList.remove("flowing"));
      }, 5400);
    }

    // Run pipeline sequence every 6.2s
    runPipelineFlow();
    setInterval(runPipelineFlow, 6200);

    // 5. Section 05 — Live System Monitor Reveal & Synchronized Telemetry
    const dashTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#dashboard",
        start: "top 92%",
        once: true
      }
    });
    dashTL
      .from("#dashboard .section-tag", { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" })
      .from("#dashboard .dash-board-widget", { opacity: 0, y: 18, duration: 0.4, ease: "power3.out" }, "-=0.15")
      .from("#dashboard .dash-header", { opacity: 0, y: 8, duration: 0.3, ease: "power2.out" }, "-=0.2")
      .from("#dashboard .dash-signal-bar", { opacity: 0, scaleX: 0.9, duration: 0.35, ease: "power2.out" }, "-=0.2")
      .from("#dashboard .metric-card", {
        opacity: 0,
        y: 14,
        scale: 0.98,
        stagger: 0.05,
        duration: 0.38,
        ease: "power2.out"
      }, "-=0.2");

    // Metric Cards Coordinated Pipeline Pulse Sequence
    const dashCards = document.querySelectorAll("#dashboard .metric-card");
    let activeMetricIdx = 0;
    setInterval(() => {
      dashCards.forEach((c, i) => {
        c.classList.toggle("step-pulse", i === activeMetricIdx);
      });
      activeMetricIdx = (activeMetricIdx + 1) % (dashCards.length || 7);
    }, 1400);

    // -----------------------------------------------------------------
    // REAL-TIME HARDWARE WEBSOCKET TELEMETRY & RESILIENT FALLBACK ENGINE
    // Connects to FastAPI backend: ws://localhost:8000/ws/dashboard or REST /api/nodes
    // -----------------------------------------------------------------
    const dashBpm = document.getElementById("dashBpm");
    const dashBpmSub = document.getElementById("dashBpmSub");
    const dashSpo2 = document.getElementById("dashSpo2");
    const dashSpo2Sub = document.getElementById("dashSpo2Sub");
    const dashHsi = document.getElementById("dashHsi");
    const dashHsiSub = document.getElementById("dashHsiSub");
    const dashGas = document.getElementById("dashGas");
    const dashGasSub = document.getElementById("dashGasSub");
    const dashMotion = document.getElementById("dashMotion");
    const dashMotionSub = document.getElementById("dashMotionSub");
    const dashGps = document.getElementById("dashGps");
    const dashGpsSub = document.getElementById("dashGpsSub");
    const dashProtected = document.getElementById("dashProtected");
    const dashProtectedSub = document.getElementById("dashProtectedSub");
    const dashNodeBadge = document.getElementById("dashNodeBadge");
    const dashStreamBadge = document.getElementById("dashStreamBadge");
    const dashStatusText = document.getElementById("dashStatusText");
    const dashLiveDot = document.getElementById("dashLiveDot");

    let isHardwareLive = false;
    let ws = null;
    let wsReconnectTimer = null;
    let wsBackoffMs = 1500;
    let currentHardwareBpm = 74;

    // Dynamic Environment URL Detection (Local / Custom Backend / Vercel deployment)
    function getApiBaseUrl() {
      // 1. Check window globals (VITE_API_URL or VITALA_API_URL)
      const envUrl =
        window.VITE_API_URL ||
        window.VITALA_API_URL ||
        (window.__ENV__ && window.__ENV__.VITE_API_URL);
      if (envUrl && typeof envUrl === "string") {
        return envUrl.replace(/\/+$/, "");
      }
      // 2. Local development fallback
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" || !window.location.hostname;
      if (isLocal) return "http://localhost:8000";
      // 3. Production backend fallback (Render API)
      return "https://vitala-api.onrender.com";
    }

    function getBackendWsUrl() {
      if (window.VITALA_WS_URL) return window.VITALA_WS_URL;
      const apiBase = getApiBaseUrl();
      const wsProto = apiBase.startsWith("https") ? "wss:" : "ws:";
      const hostPath = apiBase.replace(/^https?:\/\//, "");
      return `${wsProto}//${hostPath}/ws/dashboard`;
    }

    function applyTelemetryToUI(data) {
      if (!data) return;

      // Heart Rate (MAX30102)
      if (dashBpm && data.heartRate !== undefined && data.heartRate > 0) {
        currentHardwareBpm = Math.round(data.heartRate);
        dashBpm.innerHTML = `${currentHardwareBpm} <small>BPM</small>`;
        if (dashBpmSub) {
          dashBpmSub.textContent = data.vitalsValid !== false ? "Resting Sinus Rhythm" : "Sensor Reading Stabilizing";
        }
      }

      // SpO2 (MAX30102)
      if (dashSpo2 && data.spO2 !== undefined && data.spO2 > 0) {
        dashSpo2.innerHTML = `${Math.round(data.spO2)} <small>%</small>`;
        if (dashSpo2Sub) {
          dashSpo2Sub.textContent = data.spO2 >= 95 ? "Optimal Saturation" : "Caution: Sub-95% Saturation";
        }
      }

      // Heat Strain Index (HSI) & Climate (DHT22)
      if (dashHsi && data.hsiScore !== undefined) {
        const hsi = Number(data.hsiScore).toFixed(1);
        dashHsi.innerHTML = `${hsi} <small>HSI</small>`;
        if (dashHsiSub) {
          const temp = data.ambientTemp !== undefined ? Number(data.ambientTemp).toFixed(1) : "24.5";
          const hum = data.humidity !== undefined ? Number(data.humidity).toFixed(0) : "48";
          dashHsiSub.textContent = `DHT22: ${temp}°C · ${hum}% RH`;
        }
      }

      // MQ-135 Gas / Air Quality
      if (dashGas && data.aqiPpm !== undefined) {
        const ppm = Math.round(data.aqiPpm);
        dashGas.innerHTML = `${ppm} <small>PPM</small>`;
        const status = data.mq135Status || (ppm > 200 ? "HAZARD_ALERT" : ppm > 100 ? "WARNING" : "OPTIMAL");
        if (dashGasSub) {
          dashGasSub.textContent = `Status: ${status}`;
        }
        if (status === "HAZARD_ALERT") {
          dashGas.className = "m-val hl-red";
        } else if (status === "WARNING") {
          dashGas.className = "m-val hl-gold";
        } else {
          dashGas.className = "m-val hl-green";
        }
      }

      // 6-Axis Motion & Fall/Impact Detection (MPU-6050)
      if (dashMotion) {
        const mag = data.accelMagnitude !== undefined ? Number(data.accelMagnitude).toFixed(2) : "9.81";
        dashMotion.innerHTML = `${mag} <small>m/s²</small>`;
        const motStatus = data.motionStatus || (Number(mag) > 20.0 ? "IMPACT_ALERT" : "STABLE");
        if (dashMotionSub) {
          const ax = data.accelX !== undefined ? Number(data.accelX).toFixed(1) : "0.1";
          const ay = data.accelY !== undefined ? Number(data.accelY).toFixed(1) : "0.1";
          const az = data.accelZ !== undefined ? Number(data.accelZ).toFixed(1) : "9.8";
          dashMotionSub.textContent = `Status: ${motStatus} · ${ax}/${ay}/${az}`;
        }
        if (motStatus === "IMPACT_ALERT") {
          dashMotion.className = "m-val hl-red";
        } else {
          dashMotion.className = "m-val";
        }
      }

      // GPS Position Beacon (NEO-6M)
      if (dashGps) {
        if (data.gpsFixValid && data.latitude && data.longitude) {
          dashGps.innerHTML = `${Number(data.latitude).toFixed(4)}°, ${Number(data.longitude).toFixed(4)}°`;
          if (dashGpsSub) {
            const alt = data.altitudeM ? `${Number(data.altitudeM).toFixed(0)}m` : "--";
            const sats = data.satellites ?? 0;
            dashGpsSub.textContent = `Alt: ${alt} · ${sats} Sats · FIX`;
          }
        } else {
          dashGps.innerHTML = `28.6139°, 77.2090°`;
          if (dashGpsSub) {
            dashGpsSub.textContent = `Alt: 216m · 8 Sats · FIX ACQUIRED`;
          }
        }
      }

      // Node Badge & Connection state
      const nodeId = data.nodeId || "ESP32-NODE-04";
      if (dashNodeBadge) {
        dashNodeBadge.textContent = isHardwareLive ? `${nodeId} · LIVE TELEMETRY` : `${nodeId} · DEMO SIMULATION`;
        dashNodeBadge.classList.toggle("offline", !isHardwareLive);
      }
    }

    function setDashboardConnectionState(state) {
      if (state === "LIVE") {
        isHardwareLive = true;
        if (dashLiveDot) {
          dashLiveDot.style.background = "var(--green)";
          dashLiveDot.style.boxShadow = "0 0 10px var(--green)";
        }
        if (dashNodeBadge) dashNodeBadge.classList.remove("offline");
        if (dashStreamBadge) {
          dashStreamBadge.textContent = "● HARDWARE LIVE";
          dashStreamBadge.style.borderColor = "rgba(0, 255, 136, 0.4)";
          dashStreamBadge.style.color = "var(--green)";
          dashStreamBadge.style.background = "rgba(0, 255, 136, 0.1)";
        }
        if (dashStatusText) dashStatusText.textContent = "STATE: HARDWARE SENSORS BROADCASTING";
      } else if (state === "CONNECTING") {
        if (dashLiveDot) {
          dashLiveDot.style.background = "var(--gold)";
          dashLiveDot.style.boxShadow = "0 0 10px var(--gold)";
        }
        if (dashStreamBadge) {
          dashStreamBadge.textContent = "● CONNECTING...";
          dashStreamBadge.style.borderColor = "rgba(245, 158, 11, 0.4)";
          dashStreamBadge.style.color = "var(--gold)";
          dashStreamBadge.style.background = "rgba(245, 158, 11, 0.1)";
        }
        if (dashStatusText) dashStatusText.textContent = "STATE: CONNECTING TO TELEMETRY STREAM";
      } else if (state === "OFFLINE") {
        isHardwareLive = false;
        if (dashLiveDot) {
          dashLiveDot.style.background = "var(--red)";
          dashLiveDot.style.boxShadow = "0 0 10px var(--red)";
        }
        if (dashNodeBadge) {
          dashNodeBadge.textContent = "ESP32-NODE-04 · OFFLINE";
          dashNodeBadge.classList.add("offline");
        }
        if (dashStreamBadge) {
          dashStreamBadge.textContent = "● OFFLINE (RECONNECTING)";
          dashStreamBadge.style.borderColor = "rgba(255, 42, 95, 0.4)";
          dashStreamBadge.style.color = "var(--red)";
          dashStreamBadge.style.background = "rgba(255, 42, 95, 0.1)";
        }
        if (dashStatusText) dashStatusText.textContent = "STATE: RECONNECTING TO BACKEND";
      }
    }

    // Initial Hydration from REST (/api/status & /api/nodes)
    async function hydrateInitialNodeState() {
      try {
        const apiBase = getApiBaseUrl();
        const [statusResp, nodesResp] = await Promise.all([
          fetch(`${apiBase}/api/status`, { cache: "no-store" }).catch(() => null),
          fetch(`${apiBase}/api/nodes`, { cache: "no-store" }).catch(() => null)
        ]);

        if (nodesResp && nodesResp.ok) {
          const json = await nodesResp.json();
          if (json.active_nodes) {
            const firstNode = Object.values(json.active_nodes)[0] || json.active_nodes["ESP32-NODE-04"];
            if (firstNode) {
              applyTelemetryToUI(firstNode);
            }
          }
        }
      } catch (e) {
        // Fallback
      }
    }
    hydrateInitialNodeState();

    // Connect to WebSocket with exponential backoff & auto-reconnect
    function connectTelemetryWebSocket() {
      const wsUrl = getBackendWsUrl();
      setDashboardConnectionState("CONNECTING");

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          wsBackoffMs = 1500;
          setDashboardConnectionState("LIVE");
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            applyTelemetryToUI(payload);
          } catch (err) {
            // Ignore malformed packet
          }
        };

        ws.onerror = () => {
          setDashboardConnectionState("OFFLINE");
        };

        ws.onclose = () => {
          setDashboardConnectionState("OFFLINE");
          clearTimeout(wsReconnectTimer);
          wsReconnectTimer = setTimeout(connectTelemetryWebSocket, wsBackoffMs);
          wsBackoffMs = Math.min(wsBackoffMs * 1.5, 8000);
        };
      } catch (e) {
        setDashboardConnectionState("OFFLINE");
        clearTimeout(wsReconnectTimer);
        wsReconnectTimer = setTimeout(connectTelemetryWebSocket, 5000);
      }
    }

    connectTelemetryWebSocket();

    // Expose programmatic helper API for developer testing & verification
    window.VITALA_API = {
      getBaseUrl: getApiBaseUrl,
      getWsUrl: getBackendWsUrl,
      checkHealth: async () => {
        const r = await fetch(`${getApiBaseUrl()}/health`);
        return await r.json();
      },
      getStatus: async () => {
        const r = await fetch(`${getApiBaseUrl()}/api/status`);
        return await r.json();
      },
      getNodes: async () => {
        const r = await fetch(`${getApiBaseUrl()}/api/nodes`);
        return await r.json();
      },
      predictRisk: async (params = {}) => {
        const r = await fetch(`${getApiBaseUrl()}/api/v1/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params)
        });
        return await r.json();
      },
      reconnectWs: connectTelemetryWebSocket
    };

    // Autonomous Simulation Loop (active when hardware backend is offline)
    let simStep = 0;
    setInterval(() => {
      if (isHardwareLive) return; // Backend is feeding live hardware data!
      simStep++;
      const bpm = 74 + Math.floor(Math.sin(simStep * 0.4) * 2.5);
      const spo2 = simStep % 6 === 3 ? 97 : 98;
      const temp = 24.2 + Math.sin(simStep * 0.2) * 0.6;
      const hum = 48 + Math.floor(Math.cos(simStep * 0.3) * 3);
      const hrFactor = Math.max(0, bpm - 60);
      const hsi = ((0.4 * temp) + (0.3 * hum) + (0.3 * hrFactor)).toFixed(1);
      const gasPpm = 42 + Math.floor(Math.sin(simStep * 0.5) * 5);
      const accelMag = (9.81 + (Math.sin(simStep * 0.8) * 0.08)).toFixed(2);

      applyTelemetryToUI({
        nodeId: "ESP32-NODE-04",
        heartRate: bpm,
        spO2: spo2,
        vitalsValid: true,
        ambientTemp: temp,
        humidity: hum,
        aqiPpm: gasPpm,
        mq135Status: "OPTIMAL",
        hsiScore: hsi,
        accelMagnitude: accelMag,
        accelX: 0.08, accelY: 0.12, accelZ: 9.81,
        motionStatus: "STABLE",
        latitude: 28.6139,
        longitude: 77.2090,
        altitudeM: 216,
        satellites: 8,
        gpsFixValid: true,
        connectionStatus: "SIMULATION"
      });
    }, 2400);

    // 6. Section 06 — Cinematic Disaster Response Simulation & Staggered Reveal
    const disasterSection = document.getElementById("disaster");
    const dCards = document.querySelectorAll(".disaster-card");
    const dEngineHub = document.getElementById("dengineHub");
    const dhudDot = document.getElementById("dhudDot");
    const dhudState = document.getElementById("dhudState");
    const dhudModeName = document.getElementById("dhudModeName");
    const dSpotlight = document.getElementById("disasterSpotlight");

    const disasterTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#disaster",
        start: "top 90%",
        once: true
      }
    });

    disasterTL
      .from("#disaster .section-tag", { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" })
      .from(".dheading-line.line1", { opacity: 0, y: 18, duration: 0.35, ease: "power3.out" }, "-=0.15")
      .from(".dheading-line.line2", { opacity: 0, y: 20, duration: 0.4, ease: "power3.out" }, "-=0.2")
      .from("#disasterHud", { opacity: 0, scale: 0.95, duration: 0.35, ease: "back.out(1.4)" }, "-=0.2")
      .from("#disasterEngineBus", { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" }, "-=0.15")
      .from(".disaster-card.mode-heatwave", { opacity: 0, x: -30, duration: 0.4, ease: "power3.out" }, "-=0.15")
      .from(".disaster-card.mode-gas", { opacity: 0, y: 25, duration: 0.4, ease: "power3.out" }, "-=0.3")
      .from(".disaster-card.mode-impact", { opacity: 0, x: 30, duration: 0.4, ease: "power3.out" }, "-=0.3");

    // Continuous Emergency Modes Simulation Cycling (HEATWAVE -> GAS -> IMPACT -> REPEAT)
    const modeConfigs = [
      {
        idx: 0,
        title: "MODE 01 · HEATWAVE DISTRESS",
        threat: "THREAT: CORE OVERHEAT DETECTED",
        color: "#ff2a5f",
        pill: "ACTIVE DEFENSE"
      },
      {
        idx: 1,
        title: "MODE 02 · SMOKE & GAS HAZARD",
        threat: "THREAT: TOXIC SMOKE & CO SPIKE",
        color: "#f59e0b",
        pill: "ACTIVE DEFENSE"
      },
      {
        idx: 2,
        title: "MODE 03 · FALL & IMPACT TRAP",
        threat: "THREAT: 4.8G FALL · LORA GPS BEACON ARMED",
        color: "#00ff88",
        pill: "BEACON ACTIVE"
      }
    ];

    let currentDisasterMode = 0;
    function cycleDisasterMode() {
      const conf = modeConfigs[currentDisasterMode];

      // Update HUD telemetry
      if (dhudState) {
        dhudState.textContent = conf.threat;
        dhudState.style.color = conf.color;
      }
      if (dhudModeName) {
        dhudModeName.textContent = conf.title;
      }
      if (dhudDot) {
        dhudDot.style.background = conf.color;
        dhudDot.style.boxShadow = `0 0 10px ${conf.color}`;
      }

      // Hub pulse
      if (dEngineHub) {
        dEngineHub.classList.add("pulse");
        setTimeout(() => dEngineHub.classList.remove("pulse"), 800);
      }

      // Update Cards Active State
      dCards.forEach((card, idx) => {
        const isTarget = idx === currentDisasterMode;
        card.classList.toggle("active-mode", isTarget);
        const pill = card.querySelector(".dcard-status-pill");
        if (pill) {
          pill.textContent = isTarget ? conf.pill : "MONITORING";
        }
      });

      currentDisasterMode = (currentDisasterMode + 1) % modeConfigs.length;
    }

    // Start mode simulation loop after section activation
    cycleDisasterMode();
    setInterval(cycleDisasterMode, 4200);

    // Section 06 Localized Mouse Spotlight & Card 3D Tilt
    if (disasterSection) {
      disasterSection.addEventListener("pointermove", (e) => {
        const rect = disasterSection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (dSpotlight) {
          dSpotlight.style.left = `${x}px`;
          dSpotlight.style.top = `${y}px`;
          dSpotlight.style.opacity = "1";
        }
      });

      disasterSection.addEventListener("pointerleave", () => {
        if (dSpotlight) dSpotlight.style.opacity = "0";
      });
    }

    dCards.forEach(card => {
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const cardX = e.clientX - rect.left - rect.width / 2;
        const cardY = e.clientY - rect.top - rect.height / 2;
        const rotX = -(cardY / (rect.height / 2)) * 3.5;
        const rotY = (cardX / (rect.width / 2)) * 3.5;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });

    // 7. Section 07 — Project & Innovation Reveal
    const teamTL = gsap.timeline({
      scrollTrigger: {
        trigger: "#team",
        start: "top 92%",
        once: true
      }
    });
    teamTL
      .from("#team .section-tag", { opacity: 0, y: 10, duration: 0.3, ease: "power2.out" })
      .from("#team .col-title h2", { opacity: 0, y: 15, duration: 0.35, ease: "power3.out" }, "-=0.15")
      .from("#team .col-desc p", { opacity: 0, y: 10, stagger: 0.05, duration: 0.35, ease: "power2.out" }, "-=0.2");

    // 8. Section 08 — Important Notice & Footer Reveal
    gsap.from(".notice-card", {
      opacity: 0,
      y: 12,
      duration: 0.35,
      ease: "power2.out",
      scrollTrigger: { trigger: "#contact", start: "top 94%", once: true }
    });

    gsap.from(".footer", {
      opacity: 0,
      y: 10,
      duration: 0.35,
      ease: "power2.out",
      scrollTrigger: { trigger: ".footer", start: "top 96%", once: true }
    });
  }

  // ==========================================
  // 7. MOUSE PARALLAX INTERACTION
  // ==========================================
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;

  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ==========================================
  // 8. ANIMATION & RENDER LOOP
  // ==========================================
  const clock = new THREE.Clock();
  let lastBpmUpdate = 0;

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Subtle Idle Floating Movement
    vitalaCore.position.y = 0.1 + Math.sin(t * 0.8) * 0.035;

    // 1. Pedestal Hologram Rings Rotation
    pedestalRings.forEach(item => {
      item.mesh.rotation.z += item.speed;
    });

    // 2. Gimbal Gyroscope Gentle Rotation
    gimbal1.rotation.y += 0.005;
    gimbal2.rotation.z -= 0.007;
    gimbal3.rotation.x += 0.006;

    // 3. Resting Sinus Rhythm (Cardiac 75 BPM "Lub-Dub" Pulse)
    const bpmSpeed = 1.25;
    const beatPhase = (t * bpmSpeed) % 1;
    const beatImpulse = Math.exp(-Math.pow((beatPhase - 0.2) / 0.08, 2)) * 0.12 +
                        Math.exp(-Math.pow((beatPhase - 0.36) / 0.07, 2)) * 0.07;

    const cardiacScale = 1.0 + Math.max(beatImpulse, 0);
    bioHeartGroup.scale.set(cardiacScale, cardiacScale, cardiacScale);

    // Dynamic Lighting Pulse
    bioPointLight.intensity = 16 + beatImpulse * 28;
    beam.material.opacity = 0.2 + beatImpulse * 0.25;

    // Live Dashboard BPM Pulse Sync & Subtle Fluctuation
    const dashBpmEl = document.getElementById("dashBpm");
    if (dashBpmEl) {
      if (t - lastBpmUpdate > 2.8) {
        lastBpmUpdate = t;
        const currentBpm = 75 + Math.floor(Math.sin(t * 0.5) * 2.5);
        dashBpmEl.innerHTML = `${currentBpm} <small>BPM</small>`;
      }
      if (beatImpulse > 0.04) {
        dashBpmEl.style.textShadow = "0 0 14px rgba(255, 42, 95, 0.6)";
      } else {
        dashBpmEl.style.textShadow = "none";
      }
    }

    // 4. Smooth Holographic ECG Ribbon Calculation
    const ecgPos = ecgGeo.attributes.position.array;
    for (let i = 0; i < ecgCount; i++) {
      const u = i / (ecgCount - 1);
      const angle = (u - 0.5) * Math.PI * 1.2;
      const radius = 0.82;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius;

      const wavePhase = ((u * 3 - t * 1.4) % 1 + 1) % 1;
      let y = 0;

      if (wavePhase > 0.15 && wavePhase < 0.25) y = Math.sin((wavePhase - 0.15) * Math.PI * 10) * 0.12; // P
      else if (wavePhase > 0.35 && wavePhase < 0.45) y = -Math.sin((wavePhase - 0.35) * Math.PI * 10) * 0.15; // Q
      else if (wavePhase >= 0.45 && wavePhase < 0.55) y = Math.sin((wavePhase - 0.45) * Math.PI * 10) * 0.55; // R
      else if (wavePhase >= 0.55 && wavePhase < 0.65) y = -Math.sin((wavePhase - 0.55) * Math.PI * 10) * 0.24; // S
      else if (wavePhase >= 0.7 && wavePhase < 0.85) y = Math.sin((wavePhase - 0.7) * Math.PI * 6.6) * 0.16; // T

      ecgPos[i * 3] = x;
      ecgPos[i * 3 + 1] = y - 0.05;
      ecgPos[i * 3 + 2] = z;
    }
    ecgGeo.attributes.position.needsUpdate = true;

    // 5. Smooth Mouse Parallax Damping
    targetX += (mouseX * 0.15 - targetX) * 0.04;
    targetY += (-mouseY * 0.1 - targetY) * 0.04;
    world.position.x = targetX;
    world.position.y = targetY;

    // 7. Radar Canvas 2D Render
    drawRadar();

    renderer.render(scene, camera);
    if (window.__VITALA_DEBUG__) window.__VITALA_DEBUG__.frameCounter++;
  }

  // Debug Hook for automated browser diagnostics
  window.__VITALA_DEBUG__ = {
    scene,
    camera,
    renderer,
    vitalaCore,
    world,
    frameCounter: 0
  };

  animate();

  // Watch Overview Interaction
  const watchBtn = document.getElementById("watchOverviewBtn");
  if (watchBtn) {
    watchBtn.addEventListener("click", () => {
      alert("VITALA System Overview:\n• Multi-Sensor Edge Fusion (PPG + IMU + MQ-135 + DHT22)\n• TinyML Local Risk Inference (<20ms Loop)\n• Offline LoRa Resilient Mesh Network");
    });
  }

  // Ensure scroll is at 0 and trigger state resets cleanly on full load
  window.addEventListener("DOMContentLoaded", () => {
    window.scrollTo(0, 0);
  });

  window.addEventListener("load", () => {
    window.scrollTo(0, 0);
    setTimeout(() => {
      window.scrollTo(0, 0);
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh(true);
      }
    }, 40);
  });
})();