// Zet het thema voordat de pagina tekent, zodat er geen lichte flits ontstaat.
// Dit bestand hoort in <head> te staan, niet onderaan de body.
(() => {
  const opslagsleutel = "werkruimte-thema";
  const wortel = document.documentElement;
  const voorkeur = window.matchMedia("(prefers-color-scheme: dark)");

  const bewaard = () => {
    try {
      return localStorage.getItem(opslagsleutel);
    } catch {
      return null;
    }
  };

  const pas_toe = (thema) => {
    wortel.dataset.theme = thema;
  };

  const huidig = () => {
    const keuze = bewaard();
    if (keuze === "dark" || keuze === "light") return keuze;
    return voorkeur.matches ? "dark" : "light";
  };

  pas_toe(huidig());

  // Zonder eigen keuze volgt de werkruimte het systeem, ook als dat wisselt.
  voorkeur.addEventListener("change", () => {
    if (!bewaard()) pas_toe(huidig());
  });

  const koppel = () => {
    const schakelaar = document.querySelector("#darkModeSetting");
    if (!schakelaar) return;
    schakelaar.checked = wortel.dataset.theme === "dark";
    schakelaar.addEventListener("change", () => {
      const thema = schakelaar.checked ? "dark" : "light";
      pas_toe(thema);
      try {
        localStorage.setItem(opslagsleutel, thema);
      } catch {
        // Geen opslag beschikbaar; de keuze geldt dan voor deze sessie.
      }
    });

    // De knop "Herstel beginstand" laat het thema weer het systeem volgen.
    const herstel = document.querySelector("#resetPrototypeSettings");
    if (herstel) {
      herstel.addEventListener("click", () => {
        try {
          localStorage.removeItem(opslagsleutel);
        } catch {
          // niets te wissen
        }
        pas_toe(huidig());
        schakelaar.checked = wortel.dataset.theme === "dark";
      });
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", koppel);
  } else {
    koppel();
  }
})();
