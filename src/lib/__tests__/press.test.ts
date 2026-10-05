import { describe, expect, it } from "vitest";
import { decidePress, decidePressMobilization, decideWithSecondOpinion, matchPlaces, mentionsHighSchool, parseRss } from "../press";

const rss = `<?xml version="1.0"?><rss><channel>
<item><title>Blocus au lycée Ampère : les élèves réclament des moyens - Lyon Capitale</title>
<link>https://news.google.com/rss/articles/abc</link><pubDate>Thu, 01 Oct 2026 08:30:00 GMT</pubDate>
<source url="https://www.lyoncapitale.fr">Lyon Capitale</source></item>
<item><title><![CDATA[Chauffage en panne &amp; salles glacées au lycée]]></title>
<link>https://www.exemple.fr/a</link><pubDate>Fri, 02 Oct 2026 10:00:00 +0200</pubDate></item>
<item><title>Sans lien</title><link>pas-une-url</link><pubDate>x</pubDate></item>
</channel></rss>`;

describe("revue de presse", () => {
  it("lit un flux RSS et retire la source répétée dans le titre", () => {
    const items = parseRss(rss, "Exemple");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Blocus au lycée Ampère : les élèves réclament des moyens", source: "Lyon Capitale" });
    expect(items[1]).toMatchObject({ title: "Chauffage en panne & salles glacées au lycée", source: "Exemple" });
  });
  it("ne garde que les titres qui parlent de lycées", () => {
    expect(mentionsHighSchool("Les lycéens mobilisés à Nantes")).toBe(true);
    expect(mentionsHighSchool("LYCÉE : grève des surveillants")).toBe(true);
    expect(mentionsHighSchool("Élection municipale à Lycée-Ville")).toBe(true);
    expect(mentionsHighSchool("Grève à la SNCF")).toBe(false);
  });
  it("publie seulement quand Jev est sûr, sinon demande une vérification", () => {
    expect(decidePress({ relevance: 0.95, sensitive: 0.05, offTopic: 0.02 }).status).toBe("PUBLISHED");
    expect(decidePress({ relevance: 0.6, sensitive: 0.05, offTopic: 0.1 }).status).toBe("PENDING");
    expect(decidePress({ relevance: 0.95, sensitive: 0.6, offTopic: 0.02 }).status).toBe("PENDING");
    expect(decidePress({ relevance: 0.1, sensitive: 0, offTopic: 0.1 }).status).toBe("REJECTED");
    expect(decidePress({ relevance: 0.9, sensitive: 0, offTopic: 0.9 }).status).toBe("REJECTED");
    expect(decidePress(null).status).toBe("PENDING");
  });
  it("rattache prudemment à une commune et à un lycée", () => {
    const cities = [
      { slug: "lyon", name: "Lyon", schools: [{ id: "a", name: "Lycée Ampère" }, { id: "b", name: "Lycée général et technologique Édouard Herriot" }] },
      { slug: "saint-denis-reunion", name: "Saint-Denis", schools: [] },
    ];
    expect(matchPlaces("Blocus au lycée Ampère à Lyon", cities)).toEqual({ citySlug: "lyon", schoolIds: ["a"] });
    expect(matchPlaces("Lyon : 30 lycées bloqués", cities)).toEqual({ citySlug: "lyon", schoolIds: [] });
    expect(matchPlaces("Le lycée Herriot de Lyon bloqué", cities).schoolIds).toEqual(["b"]); // nom de famille seul
    expect(matchPlaces("Lyon : la herriot n'est pas une école", cities).schoolIds).toEqual([]); // sans majuscule : non
    expect(matchPlaces("Le lycée Édouard Herriot de Lyon bloqué", cities).schoolIds).toEqual(["b"]);
    expect(matchPlaces("Blocage à Lyonnais", cities).citySlug).toBeNull();
    const more = [...cities, { slug: "tours", name: "Tours", schools: [] }, { slug: "saint-denis-93", name: "Saint-Denis", schools: [] }];
    expect(matchPlaces("Les tours du lycée évacuées", more).citySlug).toBeNull();
    expect(matchPlaces("Tours : les lycéens dans la rue", more).citySlug).toBe("tours");
    expect(matchPlaces("Blocus à Saint-Denis", more).citySlug).toBeNull();
    const romilly = [{ slug: "romilly-sur-seine", name: "Romilly-sur-Seine", schools: [
      { id: "jc", name: "Lycée Fréderic et Irène Joliot-Curie" }, { id: "dd", name: "Lycée professionnel Denis Diderot" },
    ] }];
    expect(matchPlaces("Manifestation lycéenne : 250 personnes devant le lycée Joliot-Curie de Romilly-sur-Seine", romilly).schoolIds).toEqual(["jc"]);
    const nimes = [{ slug: "nimes", name: "Nîmes", schools: [
      { id: "h1", name: "Lycée polyvalent Ernest Hemingway" }, { id: "h2", name: "Section d'enseignement professionnel du Lycée Ernest Hemingway" }, { id: "x", name: "Lycée Albert Camus" },
    ] }];
    const lyon = [{ slug: "lyon", name: "Lyon", schools: [{ id: "c", name: "Lycée professionnel de coiffure de Lyon" }, { id: "d", name: "Ecole professionnelle privée Académie d'Art Dentaire Lyon" }] }];
    expect(matchPlaces("Mobilisation lycéenne à Lyon : après les violences", lyon).schoolIds).toEqual([]);
    expect(matchPlaces("Nîmes : rassemblement devant le lycée Hemingway", nimes).schoolIds).toEqual(["h1", "h2"]);
  });
  it("double vérification : publie un article factuel sans personne reconnaissable ni titre racoleur, écarte le reste", () => {
    const jev = { relevance: 0.96, sensitive: 0.7, offTopic: 0.04 };
    const ok = { aboutHighSchools: true, identifiesPerson: false, sensational: false, factual: true, verdict: "publish" as const, reason: "fait rapporté" };
    expect(decideWithSecondOpinion(jev, ok).status).toBe("PUBLISHED");
    expect(decideWithSecondOpinion(jev, { ...ok, identifiesPerson: true }).status).toBe("REJECTED");
    expect(decideWithSecondOpinion(jev, { ...ok, sensational: true }).status).toBe("REJECTED");
    expect(decideWithSecondOpinion(jev, { ...ok, verdict: "unsure" }).status).toBe("REJECTED");
    expect(decideWithSecondOpinion({ ...jev, relevance: 0.4 }, ok).status).toBe("REJECTED");
    expect(decideWithSecondOpinion(jev, { ...ok, aboutHighSchools: false, verdict: "reject" }).status).toBe("REJECTED");
    expect(decideWithSecondOpinion(jev, null).status).toBe("PENDING"); // GPT indisponible : on réessaiera
  });
  it("mobilisation tirée d'un titre : publiée si Jev est sûr, à valider s'il hésite, jamais depuis un article écarté", () => {
    expect(decidePressMobilization(0.95, "PUBLISHED")).toBe("PUBLISHED");
    expect(decidePressMobilization(0.95, "PENDING")).toBe("PENDING");
    expect(decidePressMobilization(0.7, "PUBLISHED")).toBe("PENDING");
    expect(decidePressMobilization(0.3, "PUBLISHED")).toBeNull();
    expect(decidePressMobilization(0.95, "REJECTED")).toBeNull();
    expect(decidePressMobilization(undefined, "PUBLISHED")).toBeNull();
  });
});
