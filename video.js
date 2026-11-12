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
