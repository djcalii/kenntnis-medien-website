// Folgen mit Veröffentlichungszeit (data-ab): vorher nur als „Demnächst“ zeigen, danach als volle Karte.
// So muss am Donnerstag um 18 Uhr nichts mehr von Hand hochgeladen werden.
(function () {
  var jetzt = Date.now(), naechste = null;
  var liste = document.getElementById("bald-liste"), block = document.getElementById("demnaechst");
  var bald = [];
  document.querySelectorAll(".video-karte[data-ab]").forEach(function (karte) {
    var ab = Date.parse(karte.dataset.ab);
    if (isNaN(ab) || ab <= jetzt) return;
    if (naechste === null || ab < naechste) naechste = ab;
    var titel = karte.querySelector("h2"), bild = karte.querySelector(".video img");
    bald.push({ ab: ab, titel: titel ? titel.textContent : "", bild: bild ? bild.getAttribute("src") : "", pdf: !!karte.querySelector('a[href$=".pdf"]') });
    karte.parentNode.removeChild(karte);
  });
  if (liste && block && bald.length) {
    bald.sort(function (a, b) { return a.ab - b.ab; });
    bald.forEach(function (f) {
      var d = new Date(f.ab);
      // z. B. „Do., 26. Nov. · 18 Uhr“ (kurz, damit es am Handy in eine Zeile passt)
      var datum = d.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Berlin" }) + " · " +
        d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Berlin" }).replace(":00", "") + " Uhr";
      var li = document.createElement("li");
      li.innerHTML = '<img alt="" loading="lazy"><div><span class="bald-datum"></span><b></b><small></small></div>';
      li.querySelector("img").src = f.bild;
      li.querySelector(".bald-datum").textContent = datum;
      li.querySelector("b").textContent = f.titel;
      li.querySelector("small").textContent = f.pdf ? "Lernvideo und Arbeitsblatt" : "Lernvideo";
      liste.appendChild(li);
    });
    block.hidden = false;
    // Eine Zeile oben unter der Einleitung: nächste Folge, Tipp springt zum Block „Demnächst“
    var einleitung = document.querySelector(".einleitung");
    if (einleitung) {
      var erste = liste.querySelector("li");
      var zeile = document.createElement("a");
      zeile.className = "naechste-folge";
      zeile.href = "#demnaechst";
      zeile.innerHTML = '<span>Nächste Folge:</span> <b></b> <span class="wann"></span> <span aria-hidden="true">↓</span>';
      zeile.querySelector("b").textContent = bald[0].titel + " ·";
      zeile.querySelector(".wann").textContent = erste.querySelector(".bald-datum").textContent;
      einleitung.parentNode.insertBefore(zeile, einleitung.nextSibling);
    }
  }
  // Seite bleibt offen, während die nächste Folge erscheint: dann neu laden
  if (naechste !== null && naechste - jetzt < 864e5) setTimeout(function () { location.reload(); }, naechste - jetzt + 2000);
})();

// Videos erst nach Klick laden (Zwei-Klick-Lösung): Vorher wird keine Verbindung zu YouTube aufgebaut.
document.querySelectorAll(".video button[data-id]").forEach(function (knopf) {
  knopf.addEventListener("click", function () {
    var rahmen = document.createElement("iframe");
    rahmen.src = "https://www.youtube-nocookie.com/embed/" + knopf.dataset.id + "?autoplay=1&rel=0";
    rahmen.title = knopf.getAttribute("aria-label") || "Video";
    rahmen.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    rahmen.allowFullscreen = true;
    knopf.parentNode.replaceChild(rahmen, knopf);
  });
});
