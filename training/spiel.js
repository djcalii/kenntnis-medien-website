// Finns Detektivbüro – Fall 1: Das Handyverbot
// Alles läuft nur im Browser. Es wird nichts gespeichert und nichts verschickt.
(function () {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const buehne = $("#buehne"), szene = $("#szene"), hud = $("#hud"), meterBox = $("#meter");
  const bild = (n) => "../bilder/" + n + ".webp";
  const finnBild = (p) => bild("finn-" + p);
  const sym = (n) => bild("sym-" + n);
  const warte = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Ton ----------
  let tonAn = true;
  const toene = {};
  ["ding", "fehler", "jubel", "pop", "stempel", "wusch"].forEach((n) => { toene[n] = new Audio("../ton/" + n + ".mp3"); toene[n].preload = "auto"; });
  function ton(n, laut = 0.6) {
    if (!tonAn || !toene[n]) return;
    try { const a = toene[n].cloneNode(); a.volume = laut; a.play().catch(() => {}); } catch (e) {}
  }
  $("#ton").onclick = () => {
    tonAn = !tonAn;
    $("#ton").setAttribute("aria-pressed", tonAn);
    $("#ton").setAttribute("aria-label", tonAn ? "Ton ausschalten" : "Ton einschalten");
    if (tonAn) ton("pop");
  };

  // ---------- Spielstand (nur im Arbeitsspeicher) ----------
  let S;
  function neuerStand() {
    S = { name: "", geteilt: false, urteilFehl: false, tonFehl: false, tipp: false, spuren: [], beweise: [], akte: 0 };
  }

  // ---------- Bausteine ----------
  function zeige(html, dunkel = false) {
    szene.innerHTML = html;
    buehne.classList.toggle("dunkel", dunkel);
    window.scrollTo({ top: 0 });
  }
  function finn(pose, text, opts = {}) {
    return `<div class="finn-zeile ${opts.oben ? "oben" : ""}">
      <img class="finn rein ${opts.klein ? "klein" : ""}" src="${finnBild(pose)}" alt="Finn">
      <div class="blase"><b class="wer">FINN</b><span class="tipp-text" data-text="${text.replace(/"/g, "&quot;")}"></span></div>
    </div>`;
  }
  function tippeAlles() {
    szene.querySelectorAll(".tipp-text").forEach((el) => {
      const text = el.dataset.text; let i = 0;
      el.textContent = "";
      const t = setInterval(() => { i += 2; el.textContent = text.slice(0, i); if (i >= text.length) clearInterval(t); }, 22);
      el.parentElement.onclick = () => { clearInterval(t); el.textContent = text; };
    });
  }
  function finnSagt(pose, text, ziel) {
    const alt = ziel.querySelector(".finn-zeile");
    const neu = document.createElement("div");
    neu.innerHTML = finn(pose, text, { klein: true });
    if (alt) alt.replaceWith(neu.firstElementChild); else ziel.appendChild(neu.firstElementChild);
    tippeAlles();
  }
  function meter(wert) {
    if (wert == null) { meterBox.hidden = true; return; }
    meterBox.hidden = false;
    requestAnimationFrame(() => { $("#meter-stand").style.width = wert + "%"; });
  }
  function akteDazu() {
    S.akte++;
    $("#hud-zahl").textContent = S.akte;
    const a = $("#hud-akte"); a.classList.remove("plopp"); void a.offsetWidth; a.classList.add("plopp");
  }
  function msg(verlauf, m) {
    const d = document.createElement("div");
    d.className = "msg" + (m.ich ? " ich" : "") + (m.info ? " info" : "");
    d.innerHTML = m.info ? m.text : `${m.ich ? "" : `<b style="color:${m.farbe || "#0F766E"}">${m.name}</b>`}${m.weiter ? '<span class="weiter">Weitergeleitet</span>' : ""}${m.text}`;
    verlauf.appendChild(d);
    verlauf.scrollTop = verlauf.scrollHeight;
    ton(m.info ? "wusch" : "pop", 0.35);
  }
  function konfetti() {
    const k = document.createElement("div"); k.className = "konfetti";
    const farben = ["#FACC15", "#0B3F9E", "#0F766E", "#FB923C", "#EC4899", "#FFFFFF"];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = farben[i % farben.length];
      c.style.animationDelay = Math.random() * 0.8 + "s";
      c.style.animationDuration = 1.6 + Math.random() * 1.4 + "s";
      k.appendChild(c);
    }
    buehne.appendChild(k);
    setTimeout(() => k.remove(), 4000);
  }
  function handy(kopf, unter) {
    return `<div class="handy"><div class="handy-schirm">
      <div class="handy-kopf"><span class="gruppe">5b</span><span>${kopf}<small>${unter}</small></span></div>
      <div class="verlauf" id="verlauf"></div>
    </div></div>`;
  }
  const LINA = { name: "Lina", farbe: "#0F766E" };
  const MO = { name: "Mo", farbe: "#B45309" };
  const ELA = { name: "Ela", farbe: "#7C3AED" };
  const KETTENBRIEF = "WICHTIG!!! Ab Montag sind Handys an ALLEN Schulen verboten!!! Schick das SOFORT an alle!!!";

  // ---------- 1. Start ----------
  function start() {
    neuerStand();
    hud.hidden = true; meter(null);
    zeige(`<div class="titel-karte">
        <span class="marke">FINNS DETEKTIVBÜRO</span>
        <h1>Fall 1:<br>Das Handyverbot</h1>
        <p>Ein Detektivspiel mit Finn, dem Fakten-Fuchs</p>
      </div>
      ${finn("winkt", "Hey, gut, dass du da bist! In meinem Büro ist heute richtig was los. Ich brauche Verstärkung. Bist du dabei?")}
      <div class="knoepfe"><button class="sk tippen" id="los">Ich bin dabei!</button></div>
      <p class="eltern">Ohne Anmeldung. Es wird nichts gespeichert.</p>`);
    tippeAlles();
    $("#los").onclick = () => { ton("pop"); namenWahl(); };
  }

  // ---------- 2. Detektiv-Name ----------
  const VORNE = ["Blitz", "Turbo", "Funkel", "Schlau", "Adler", "Raketen", "Spür", "Super", "Mond", "Donner"];
  const HINTEN = ["fuchs", "nase", "auge", "pfote", "eule", "luchs", "falke", "ohr", "katze", "dachs"];
  function namen() {
    const s = new Set();
    while (s.size < 3) {
      const v = VORNE[Math.floor(Math.random() * VORNE.length)];
      const h = HINTEN[Math.floor(Math.random() * HINTEN.length)];
      s.add(v + h);
    }
    return [...s];
  }
  function namenWahl() {
    const n = namen();
    zeige(`${finn("zeigt", "Jeder Detektiv braucht einen Geheimnamen. Echte Namen verraten wir im Netz nämlich nicht! Such dir einen aus.", { oben: true })}
      <div class="namen">${n.map((x) => `<button class="sk weiss" data-n="${x}">Detektiv ${x}</button>`).join("")}
      <button class="sk" id="wuerfeln" style="background:#BFDBFE">Neue Namen würfeln</button></div>`);
    tippeAlles();
    szene.querySelectorAll("[data-n]").forEach((b) => b.onclick = () => { S.name = b.dataset.n; ton("ding"); auftrag(); });
    $("#wuerfeln").onclick = () => { ton("wusch", .3); namenWahl(); };
  }

  // ---------- 3. Das Handy klingelt ----------
  async function auftrag() {
    hud.hidden = false;
    $("#hud-zahl").textContent = "0";
    zeige(`${finn("lupe", `Willkommen im Team, Detektiv ${S.name}! Psst … hörst du das? Dein Handy!`, { oben: true })}
      <div style="position:relative">${handy("Klasse 5b", "28 Mitglieder")}</div>`, true);
    tippeAlles();
    await warte(1500);
    const h = $(".handy"); h.classList.add("wackeln"); ton("ding");
    const m = document.createElement("div");
    m.className = "mitteilung";
    m.innerHTML = `<span class="icon">5b</span><span><b>Klasse 5b</b><span>Lina: WICHTIG!!! Ab Montag …</span></span>`;
    h.parentElement.appendChild(m);
    m.onclick = chatLesen;
    const k = document.createElement("div"); k.className = "knoepfe";
    k.innerHTML = `<button class="sk tippen">Nachricht öffnen</button>`;
    szene.appendChild(k);
    k.firstChild.onclick = chatLesen;
  }

  async function chatLesen() {
    zeige(`${handy("Klasse 5b", "Lina, Mo, Ela und 25 weitere")}<div id="unten" class="knoepfe"></div>`, true);
    const v = $("#verlauf");
    meter(10);
    await warte(400); msg(v, { ...LINA, weiter: true, text: KETTENBRIEF });
    await warte(1300); msg(v, { ...MO, text: "WAS??? Echt jetzt?!" }); meter(30);
    await warte(1100); msg(v, { ...ELA, text: "Neiiin! Ich schick das sofort meiner Schwester!" }); meter(45);
    await warte(1100); msg(v, { ...MO, text: "@Detektiv " + S.name + " schick du das auch weiter!!" }); meter(55);
    await warte(700);
    $("#unten").innerHTML = `<div class="knoepfe zwei">
      <button class="sk rot" id="teilen">Weiterleiten</button>
      <button class="sk" id="pruefen">Erst Finn zeigen</button></div>`;
    $("#teilen").onclick = weiterleiten;
    $("#pruefen").onclick = () => {
      ton("pop");
      $("#unten").innerHTML = "";
      finnSagt("lupe", "Gut, dass du erst zu mir kommst! Hmm … das riecht verdächtig. Lass uns die Nachricht genau untersuchen.", $("#unten"));
      weiterKnopf($("#unten"), "Zur Spurensuche", spurensuche);
    };
  }

  async function weiterleiten() {
    S.geteilt = true;
    $("#unten").innerHTML = "";
    const v = $("#verlauf");
    ton("wusch");
    msg(v, { ich: true, weiter: true, text: KETTENBRIEF });
    meter(70);
    await warte(700); msg(v, { info: true, text: "Auch weitergeleitet an: Fußball-Team" }); meter(80);
    await warte(600); msg(v, { info: true, text: "Auch weitergeleitet an: Familie" }); meter(88);
    await warte(600); msg(v, { info: true, text: "Ela hat es an 3 Gruppen weitergeleitet" }); meter(96);
    await warte(800);
    ton("fehler", .4);
    finnSagt("stopp", "Halt, Moment! Jetzt glauben das ganz viele Leute. Dabei wissen wir noch gar nicht, ob es stimmt. Lass es uns prüfen. Danach kannst du das wieder geradebiegen.", $("#unten"));
    weiterKnopf($("#unten"), "Zur Spurensuche", spurensuche);
  }

  function weiterKnopf(ziel, text, fn) {
    const d = document.createElement("div"); d.className = "knoepfe"; d.style.marginTop = "6px";
    d.innerHTML = `<button class="sk tippen">${text}</button>`;
    ziel.appendChild(d);
    d.firstChild.onclick = () => { ton("pop"); fn(); };
    setTimeout(() => d.scrollIntoView({ behavior: "smooth", block: "end" }), 150);
  }

  // ---------- 4. Spurensuche mit der Lupe ----------
  const SPUREN = {
    weiter: { kurz: "Weitergeleitet", text: "„Weitergeleitet“: Wer hat das eigentlich zuerst geschrieben? Das weiß keiner.", finn: "Gute Spur! Lina hat es nur weitergeleitet. Woher es kommt, weiß niemand." },
    laut: { kurz: "!!! und GROSSBUCHSTABEN", text: "Ganz viele !!! und GROSSBUCHSTABEN sollen dich aufregen, damit du nicht nachdenkst.", finn: "Erwischt! Wer so schreit, will, dass du dich aufregst und nicht nachdenkst." },
    alle: { kurz: "„an ALLEN Schulen“", text: "„An ALLEN Schulen“: Das wäre eine riesige Nachricht. Dann stünde es überall.", finn: "Stark! Wenn das an allen Schulen gelten würde, wüssten es auch die Schulen und die Nachrichten." },
    sofort: { kurz: "„SOFORT an alle“", text: "„Schick das SOFORT an alle“: Druck zum Weiterleiten ist ein typischer Kettenbrief-Trick.", finn: "Sehr gut! Echte Nachrichten müssen nicht betteln, damit man sie weiterschickt." }
  };
  function spurensuche() {
    meter(S.geteilt ? 96 : 55);
    zeige(`<div class="zaehler" id="zaehler">Spuren: 0 von 4</div>
      <div class="beweis-tisch" id="tisch">
        <div class="von">Lina · in Klasse 5b</div>
        <div class="msg-gross"><span class="spur" data-spur="weiter">Weitergeleitet:</span> <span class="spur" data-spur="laut">WICHTIG!!!</span> Ab Montag sind Handys <span class="spur" data-spur="alle">an ALLEN Schulen</span> verboten!!! <span class="spur" data-spur="sofort">Schick das SOFORT an alle!!!</span></div>
      </div>
      <div id="spur-info"></div>
      ${finn("lupe", "Schnapp dir die Lupe und fahr damit über die Nachricht. Findest du alle 4 verdächtigen Spuren?", { klein: true })}
      <div class="lupe anfang" id="lupe" role="img" aria-label="Lupe zum Verschieben"></div>`, true);
    tippeAlles();
    const lupe = $("#lupe"), tisch = $("#tisch");
    const box = () => szene.getBoundingClientRect();
    // Startposition: unter dem Beweis-Tisch, rechts
    const t = tisch.getBoundingClientRect(), b = box();
    let x = t.right - b.left - 70, y = t.bottom - b.top + 70;
    setze(x, y);
    function setze(nx, ny) {
      const bb = box();
      x = Math.max(40, Math.min(bb.width - 40, nx)); y = Math.max(40, Math.min(bb.height - 40, ny));
      lupe.style.left = x + "px"; lupe.style.top = y + "px";
    }
    function pruefeUnterLupe() {
      const bb = box();
      lupe.style.pointerEvents = "none";
      // mehrere Punkte in der Linse abtasten, damit man nicht pixelgenau treffen muss
      const punkte = [[0, 0], [-22, 0], [22, 0], [0, -16], [0, 16]];
      for (const [dx, dy] of punkte) {
        const el = document.elementFromPoint(bb.left + x + dx, bb.top + y + dy);
        const sp = el && el.closest && el.closest("[data-spur]");
        if (sp) gefunden(sp);
      }
      lupe.style.pointerEvents = "";
    }
    let zieht = false, ox = 0, oy = 0;
    lupe.addEventListener("pointerdown", (e) => {
      zieht = true; lupe.setPointerCapture(e.pointerId); lupe.classList.add("ziehen"); lupe.classList.remove("anfang");
      const bb = box(); ox = e.clientX - bb.left - x; oy = e.clientY - bb.top - y;
      e.preventDefault();
    });
    lupe.addEventListener("pointermove", (e) => {
      if (!zieht) return;
      const bb = box(); setze(e.clientX - bb.left - ox, e.clientY - bb.top - oy); pruefeUnterLupe();
    });
    const loslassen = () => { zieht = false; lupe.classList.remove("ziehen"); };
    lupe.addEventListener("pointerup", loslassen);
    lupe.addEventListener("pointercancel", loslassen);
    // Antippen geht auch: Lupe fliegt hin
    szene.querySelectorAll("[data-spur]").forEach((sp) => sp.addEventListener("click", () => {
      const r = sp.getBoundingClientRect(), bb = box();
      lupe.classList.remove("anfang");
      lupe.style.transition = "left .25s, top .25s";
      setze(r.left - bb.left + r.width / 2, r.top - bb.top + r.height / 2);
      setTimeout(() => { lupe.style.transition = ""; gefunden(sp); }, 260);
    }));
    // Tipp von Finn, wenn es stockt
    let tippTimer = setTimeout(zeigeTipp, 15000);
    function zeigeTipp() {
      const offen = [...szene.querySelectorAll("[data-spur]:not(.gefunden)")];
      if (!offen.length) return;
      S.tipp = true;
      offen[0].classList.remove("hinweis"); void offen[0].offsetWidth; offen[0].classList.add("hinweis");
      finnSagt("zeigt", "Kleiner Tipp: Schau mal genau auf die Stelle, die gerade blinkt!", szene);
      tippTimer = setTimeout(zeigeTipp, 15000);
    }
    function gefunden(sp) {
      if (sp.classList.contains("gefunden")) return;
      const id = sp.dataset.spur;
      sp.classList.add("gefunden"); sp.classList.remove("hinweis");
      S.spuren.push(id); akteDazu(); ton("ding");
      clearTimeout(tippTimer); tippTimer = setTimeout(zeigeTipp, 15000);
      $("#zaehler").textContent = `Spuren: ${S.spuren.length} von 4`;
      $("#spur-info").innerHTML = `<div class="spur-karte"><b>SPUR ${S.spuren.length} IN DER FALLAKTE</b>${SPUREN[id].text}</div>`;
      if (S.spuren.length === 4) {
        clearTimeout(tippTimer);
        lupe.remove();
        ton("jubel", .5);
        finnSagt("daumen", "Wow, alle 4 Spuren gefunden! Du hast echt einen Detektiv-Blick. Jetzt brauchen wir Beweise.", szene);
        weiterKnopf(szene, "Zu den Detektiv-Werkzeugen", werkzeuge);
      } else {
        finnSagt("lupe", SPUREN[id].finn, szene);
      }
    }
  }

  // ---------- 5. Detektiv-Werkzeuge ----------
  const WERKZEUGE = {
    schule: {
      titel: "Schul-Website checken", sym: "schule",
      seite: `<div class="browser"><i></i><i></i><i></i> grundschule-am-fuchsbau.de</div>
        <div class="seite"><h3>Aktuelles</h3><ul><li>Freitag: Sportfest auf dem Schulhof</li><li>3. Dezember: Elternabend</li><li>Neue Bücher in der Bibliothek</li></ul></div>`,
      fazit: "Kein Wort von einem Handyverbot.", kurz: "Die Schule schreibt nichts davon."
    },
    news: {
      titel: "Nachrichten durchsuchen", sym: "zeitung",
      seite: `<div class="browser"><i></i><i></i><i></i> Suche: Handyverbot alle Schulen</div>
        <div class="seite"><h3>Kindernachrichten</h3><p style="margin:0">Keine Meldung zu einem Handyverbot an allen Schulen ab Montag.</p></div>`,
      fazit: "Keine Nachrichtenseite berichtet darüber.", kurz: "Keine Nachrichten berichten darüber."
    },
    lina: {
      titel: "Lina fragen", sym: "chat",
      seite: `<div class="seite" style="background:#E9EEF6">
        <div class="msg ich" style="margin-left:auto">Hey Lina, woher hast du das?</div>
        <div class="msg" style="margin-top:6px"><b style="color:#0F766E">Lina</b>Keine Ahnung … hat mir jemand aus der 6c geschickt.</div></div>`,
      fazit: "Lina hat es auch nur weitergeleitet.", kurz: "Lina weiß nicht, woher es kommt."
    }
  };
  function werkzeuge() {
    zeige(`${finn("zeigt", "Spuren allein reichen nicht. Ein echter Detektiv prüft nach! Benutze alle drei Werkzeuge.", { oben: true, klein: true })}
      <div class="knoepfe" id="werkzeugliste">${Object.entries(WERKZEUGE).map(([id, w]) =>
        `<button class="sk weiss links" data-w="${id}"><img src="${sym(w.sym)}" alt="">${w.titel}</button>`).join("")}</div>
      <div id="werkzeug-ergebnis"></div>`, true);
    tippeAlles();
    let laeuft = false;
    szene.querySelectorAll("[data-w]").forEach((b) => b.onclick = async () => {
      const id = b.dataset.w;
      if (laeuft || S.beweise.includes(id)) return;
      laeuft = true; ton("wusch", .4);
      const ziel = $("#werkzeug-ergebnis");
      ziel.innerHTML = `<div class="zaehler" style="font-size:.9rem;margin-bottom:6px">Suche läuft …</div><div class="suche"><div></div></div>`;
      await warte(1150);
      const w = WERKZEUGE[id];
      ziel.innerHTML = `<div class="ergebnis">${w.seite}<div class="fazit">Beweis: ${w.fazit}</div></div>`;
      S.beweise.push(id); akteDazu(); ton("ding");
      b.classList.add("erledigt");
      laeuft = false;
      if (S.beweise.length === 3) {
        await warte(700);
        const d = document.createElement("div");
        d.innerHTML = finn("daumen", "Klasse! Drei Beweise in der Fallakte. Jetzt bist du dran: Zeit für dein Urteil!", { klein: true });
        szene.appendChild(d.firstElementChild); tippeAlles();
        weiterKnopf(szene, "Zum Urteil", urteil);
        setTimeout(() => szene.lastElementChild.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
      }
    });
  }

  // ---------- 6. Das Urteil ----------
  function urteil() {
    meter(null);
    const zeilen = S.spuren.map((id) => SPUREN[id].kurz).concat(S.beweise.map((id) => WERKZEUGE[id].kurz));
    zeige(`<div class="akte" id="akte">
        <div style="font-family:var(--rund);font-weight:900;margin-top:10px">Fall 1: Das Handyverbot</div>
        <ul>${zeilen.map((z) => `<li>${z}</li>`).join("")}</ul>
      </div>
      ${finn("lupe", "Schau dir deine Fallakte an. Ist die Nachricht echt oder fake? Nimm den richtigen Stempel!", { klein: true })}
      <div class="knoepfe zwei"><button class="stempel echt" data-u="echt">ECHT</button><button class="stempel fake" data-u="fake">FAKE</button></div>`, false);
    tippeAlles();
    let fertig = false;
    szene.querySelectorAll("[data-u]").forEach((b) => b.onclick = async () => {
      if (fertig) return;
      const u = b.dataset.u;
      const alt = $(".stempel-abdruck"); if (alt) alt.remove();
      const s = document.createElement("div");
      s.className = "stempel-abdruck " + u; s.textContent = u.toUpperCase();
      $("#akte").appendChild(s);
      ton("stempel", .8);
      buehne.classList.remove("ruetteln"); void buehne.offsetWidth; buehne.classList.add("ruetteln");
      if (u === "echt") {
        S.urteilFehl = true;
        await warte(500);
        finnSagt("stopp", "Hmm, bist du sicher? Keine Quelle, die Schule weiß nichts, keine Nachrichten. Schau noch mal in die Fallakte!", szene);
        await warte(1400); s.remove();
      } else {
        fertig = true;
        b.closest(".knoepfe").remove();
        await warte(500); ton("jubel", .5);
        finnSagt("daumen", "FAKE! Genau richtig. Der Fall ist fast gelöst. Aber in der Klasse 5b regen sich alle noch auf …", szene);
        weiterKnopf(szene, "Zurück zum Klassenchat", handeln);
      }
    });
  }

  // ---------- 7. Handeln: die Klasse beruhigen ----------
  async function handeln() {
    zeige(`${handy("Klasse 5b", "Lina, Mo, Ela und 25 weitere")}<div id="unten"></div>`, true);
    const v = $("#verlauf");
    meter(S.geteilt ? 96 : 65);
    msg(v, { ...LINA, weiter: true, text: KETTENBRIEF });
    msg(v, { ...MO, text: "Ich bin so sauer! Wie soll ich dann mit meiner Oma telefonieren?!" });
    msg(v, { ...ELA, text: "Meine Schwester weint schon …" });
    await warte(500);
    const optionen = [
      { id: "frech", text: "Schreiben: „Ihr seid so dumm, das ist doch fake!“" },
      { id: "nett", text: "Schreiben: „Stimmt nicht! Ich hab nachgeschaut: Die Schule schreibt nichts davon. Keine Panik!“" },
      { id: "nichts", text: "Gar nichts machen" },
      { id: "loeschen", text: "Die Nachricht nur bei mir löschen" }
    ];
    $("#unten").innerHTML = `<div id="finn-platz"></div><div class="zaehler" style="margin:6px 0">Was machst du jetzt?</div>
      <div class="knoepfe">${optionen.map((o) => `<button class="sk weiss" data-o="${o.id}" style="font-size:.95rem;text-align:left">${o.text}</button>`).join("")}</div>`;
    szene.querySelectorAll("[data-o]").forEach((b) => b.onclick = async () => {
      const o = b.dataset.o;
      const fp = $("#finn-platz");
      if (o !== "nett") setTimeout(() => fp.scrollIntoView({ behavior: "smooth", block: "start" }), 1600);
      if (o === "frech") {
        S.tonFehl = true; b.disabled = true;
        msg(v, { ich: true, text: "Ihr seid so dumm, das ist doch fake!" });
        await warte(800); msg(v, { ...MO, text: "Hä? Warum bist du so gemein?" });
        await warte(700); msg(v, { ...ELA, text: "Selber dumm." }); meter(S.geteilt ? 99 : 80); ton("fehler", .4);
        finnSagt("stopp", "Was du sagst, stimmt. Aber so hört dir keiner gern zu. Jetzt streiten alle. Probier es freundlicher!", fp);
      } else if (o === "nichts") {
        b.disabled = true; ton("fehler", .3);
        finnSagt("zeigt", "Dann glauben es alle weiter und regen sich auf. Du weißt doch jetzt die Wahrheit!", fp);
      } else if (o === "loeschen") {
        b.disabled = true; ton("fehler", .3);
        finnSagt("zeigt", "Für dich ist die Nachricht jetzt weg. Aber in der Gruppe glauben es noch alle. Was hilft den anderen?", fp);
      } else {
        szene.querySelectorAll("[data-o]").forEach((x) => x.disabled = true);
        $("#unten").querySelector(".knoepfe").remove();
        $("#unten").querySelector(".zaehler").remove();
        msg(v, { ich: true, text: "Stimmt nicht! Ich hab nachgeschaut: Die Schule schreibt nichts davon. Keine Panik!" });
        meter(40);
        await warte(1000); msg(v, { ...LINA, text: "Oh nein, sorry! Ich hab es nur weitergeleitet. Ich lösch es." });
        await warte(900); msg(v, { info: true, text: "Lina hat eine Nachricht gelöscht." }); meter(20);
        await warte(800); msg(v, { ...MO, text: "Puh, zum Glück!" });
        await warte(800); msg(v, { ...ELA, text: "Danke fürs Nachschauen, " + S.name + "! Ich sag es meiner Schwester." }); meter(0);
        if (S.geteilt) {
          await warte(900);
          msg(v, { info: true, text: "Du hast die Richtigstellung auch ans Fußball-Team und an die Familie geschickt." });
        }
        await warte(600); ton("jubel", .6); konfetti();
        finnSagt("daumen", S.geteilt
          ? "Stark! Jeder fällt mal auf so was rein. Aber du hast es zugegeben und überall richtiggestellt. Das ist echter Detektiv-Mut!"
          : "Mega! Du hast nicht nur die Wahrheit gefunden, sondern auch die ganze Klasse beruhigt. Fall gelöst!", fp);
        weiterKnopf(fp, "Detektiv-Ausweis abholen", ende);
        setTimeout(() => fp.scrollIntoView({ behavior: "smooth", block: "end" }), 100);
      }
    });
  }

  // ---------- 8. Detektiv-Ausweis ----------
  function ende() {
    meter(null);
    const sterne = [
      { an: !S.geteilt, text: "Erst geprüft, dann gehandelt" },
      { an: !S.urteilFehl, text: "Richtiges Urteil beim ersten Stempel" },
      { an: !S.tonFehl, text: "Freundlich richtiggestellt" }
    ];
    const zahl = sterne.filter((s) => s.an).length;
    const satz = zahl === 3 ? "Perfekter Fall! Du bist ein Profi-Detektiv."
      : "Spiel noch mal und hol dir alle 3 Sterne!";
    zeige(`<div class="ausweis">
        <div class="ausweis-kopf"><span>DETEKTIV-AUSWEIS</span><span>Finns Detektivbüro</span></div>
        <div class="ausweis-innen">
          <img src="${finnBild("daumen")}" alt="">
          <div><div style="font-size:.8rem;color:var(--grau);font-weight:700">Geheimname</div>
            <div class="ausweis-name">Detektiv ${S.name}</div>
            <div style="font-size:.85rem;font-weight:700">Fall 1 gelöst: Das Handyverbot</div>
            <div class="sterne">${sterne.map((s, i) => `<span class="stern ${s.an ? "an" : ""}" style="animation-delay:${0.3 + i * 0.25}s"></span>`).join("")}</div>
          </div>
        </div>
        <ul class="stern-liste">${sterne.map((s) => `<li class="${s.an ? "an" : "aus"}">${s.text}</li>`).join("")}</ul>
      </div>
      <div class="zaehler">${satz}</div>
      <div class="merk">Erst prüfen, dann teilen!</div>
      <div class="knoepfe">
        <a class="sk" href="https://kenntnis-medien.de/v/fake-news">Video mit Finn ansehen</a>
        <button class="sk weiss" id="nochmal">Noch mal spielen</button>
        <button class="sk weiss" disabled>Fall 2: Das Pinguin-Foto<small>kommt bald</small></button>
      </div>
      <p class="eltern">Für Eltern und Lehrkräfte: Das Spiel übt, Falschmeldungen an typischen Spuren zu erkennen, Quellen zu prüfen und Fehler freundlich richtigzustellen (Klasse 4–6).</p>`, true);
    zahl === 3 ? (ton("jubel", .6), konfetti()) : ton("ding");
    $("#nochmal").onclick = () => { ton("pop"); start(); };
  }

  start();
})();
