# Guide de modération

Pour la personne qui modère Signal Lycées (aujourd'hui, Kevin seul). Il dit ce qui peut être publié, comment trancher les cas
limites et quoi faire quand un message révèle un danger. Les règles publiques, celles que lisent les élèves, sont sur
[/regles](https://signal-lycees.fr/regles) : ce guide les applique, il ne les contredit jamais.

## 1. Le principe

On publie des **situations**, jamais des **personnes**. Un signalement dit ce qui ne va pas dans un lycée (locaux, cantine,
cours non assurés, sécurité, organisation) ; il ne désigne, n'accuse ni ne moque personne, élève ou adulte.

En cas de doute : **on ne publie pas tel quel**. On reformule si c'est possible sans trahir l'élève, sinon on refuse avec
un motif. Un signalement refusé à tort se redépose ; une personne mise en cause à tort ne s'efface pas d'Internet.

## 2. Ce qui arrive avant toi

Chaque signalement passe par trois couches. Tu ne vois que ce qu'elles n'ont pas su trancher.

| Couche | Ce qu'elle fait | Ce qu'elle ne fait jamais |
|---|---|---|
| **Règles** (`src/server/moderation/rules.ts`) | Repère contacts (e-mail, téléphone, pseudo, lien), noms (« M. Dupont », « Kevin DURAND »), rôles (« le CPE »), insultes, menaces, détresse, contenu sexuel, tentatives de manipulation de l'IA. | Publier : elles ne font que bloquer ou durcir. |
| **Jev** (`decide.ts`) | Donne une probabilité par risque : données personnelles, personne identifiable, insulte, harcèlement, diffamation, menace, détresse, sexuel/mineur, hors sujet. Publie si tout est sous 0,15. | Refuser seul, sauf insulte confirmée par les règles, ou spam certain. |
| **Second avis GPT** (`second-decide.ts`, interrupteur au tableau de bord) | Quand Jev hésite : publie, publie après une **reformulation légère** (au moins 60 % des mots de l'élève gardés, règles relancées sur le nouveau texte), ou te laisse la main. | Refuser, ou toucher aux cas urgents, aux reproches visant une personne et aux tentatives de manipulation. |

Ce qui arrive dans **/admin/moderation** a donc toujours une raison affichée (règle déclenchée, risque au-dessus du seuil,
avis GPT). Lis-la : elle dit où regarder. Les cas **URGENT** sont en tête, avec un bandeau rouge.

L'**interrupteur « Publication automatique »** du tableau de bord envoie tout en revue manuelle. À couper en cas de vague
d'abus ou de doute sur l'IA, puis à rallumer.

## 3. Publier, reformuler ou refuser

### Publiable

- Un manque ou un dysfonctionnement : « Toilettes du bâtiment B fermées depuis deux semaines ».
- Des cours qui ne sont pas assurés, dit du point de vue des élèves : « Cours de maths non assurés depuis 3 semaines en 1re ».
- Une organisation qui pose problème : « Emploi du temps changé chaque semaine sans prévenir ».
- Un sentiment collectif, sans cible : « Beaucoup d'élèves ne se sentent pas en sécurité à la sortie ».
- Un ton vif ou familier, tant qu'il ne vise personne : « La cantine c'est vraiment n'importe quoi » se publie.

### Non publiable tel quel

| Ce que dit le texte | Pourquoi | Que faire |
|---|---|---|
| « Prof de maths non remplacé depuis 3 semaines » | Désigne une personne, absente peut-être pour une raison qui ne regarde qu'elle. | Reformuler : « Cours de maths non assurés depuis 3 semaines ». |
| « La CPE ne fait rien contre le harcèlement » | Reproche à une personne identifiable (il n'y a souvent qu'un ou deux CPE). | Reformuler vers la situation : « Les signalements de harcèlement ne semblent pas suivis ». Si le texte n'est qu'un reproche personnel : refuser (PERSON). |
| « M. X crie sur les élèves », « elle vole dans la caisse du foyer » | Accusation contre une personne. | Refuser (ACCUSATION). Si des élèves sont en danger : voir la partie 5. |
| « Le prof d'allemand », « la nouvelle surveillante », « le seul prof de philo » | Dans un petit lycée, c'est une personne nommée. | Retirer le rôle, garder la situation. |
| Classe précise d'un élève, surnom, pseudo, initiales | Données personnelles. | Retirer, ou refuser (PERSONAL_DATA) si rien ne reste. |
| Insultes, moqueries, mépris envers qui que ce soit | Interdit, même envers « l'administration ». | Refuser (INSULT), sauf mot isolé retirable sans changer le sens. |
| « Test », pub, texte sans rapport avec un lycée | Hors sujet. | Refuser (OFF_TOPIC). |
| Même problème, même lycée, déjà publié | Doublon. | Refuser (DUPLICATE) : l'élève est invité à confirmer l'existant. |

### Bien reformuler

Le bouton « Modifier et publier » garde une trace de la version de l'élève. Une bonne reformulation :

- **retire** ce qui identifie (nom, rôle unique, classe, horaire trop précis) ;
- **garde** le fait, la durée, les conséquences et les mots de l'élève autant que possible ;
- **n'ajoute rien** : pas de chiffre, de cause ou d'interprétation que l'élève n'a pas écrits ;
- **ne lisse pas** la colère en langue de bois : « c'est insupportable » peut rester.

Exemple. Avant : « Mme Durand (SVT, 2nde 4) est absente depuis septembre et personne ne la remplace, on va rater le bac ».
Après : « Cours de SVT non assurés depuis septembre en 2nde, sans remplacement : les élèves s'inquiètent pour la suite de
l'année ».

Si la reformulation change le sens, ou si l'élève ne s'y reconnaîtrait plus : **refuse avec un motif** plutôt que de
réécrire.

### Les petits lycées

Une description anodine dans un lycée de 1 500 élèves identifie quelqu'un dans un lycée de 150 : « le prof d'anglais »,
« la cuisinière », « l'élève en fauteuil ». Regarde la taille et le type d'établissement (lycée professionnel, agricole,
privé, section d'un lycée polyvalent) sur sa fiche. Plus il est petit, plus tu retires de détails.

## 4. Les motifs de refus

L'élève voit le motif grâce à son lien de suivi (obligation du règlement européen DSA). Choisis le plus précis ; ajoute une
précision publique si elle aide l'élève à redéposer correctement. La note interne, elle, n'est vue que par la modération.

| Code | Quand l'utiliser |
|---|---|
| **PERSON** | Le texte vise une personne identifiable, et la reformulation ne suffit pas. |
| **PERSONAL_DATA** | Nom, contact, pseudo, classe précise d'un élève. |
| **INSULT** | Insultes, moqueries ou mépris. |
| **ACCUSATION** | Faits graves présentés contre quelqu'un (vol, violence, harcèlement par un adulte…). |
| **OFF_TOPIC** | Test, spam, sans rapport avec un lycée. |
| **DUPLICATE** | Déjà signalé pour ce lycée. |
| **SERIOUS** | Situation grave (détresse, danger) : le motif rappelle le 119 et le 3114. À utiliser en plus de la procédure de la partie 5. |
| **OTHER** | Rien d'autre ne convient : la précision publique est alors obligatoire. |

## 5. Cas urgents : détresse, menace, contenu sexuel

Ces signalements arrivent marqués **URGENT**, avec une notification Telegram 🚨. Ils ne sont **jamais publiés**. Si
l'élève a écrit des signes de détresse, la page de confirmation lui a déjà affiché les numéros d'aide.

**Détresse** (« j'ai envie d'en finir », « je n'en peux plus », automutilation) :

1. Ne pas publier. Refuser avec le motif **SERIOUS** : l'élève le verra avec son lien de suivi, et le motif rappelle le
   **3114** (prévention du suicide) et le **119** (enfance en danger), gratuits, 24 h/24.
2. Le site est anonyme : on ne peut pas recontacter l'élève, et c'est voulu. Ne cherche pas à l'identifier.
3. Si le texte nomme un lycée et décrit un danger **immédiat**, appelle le **119** : il peut alerter les services de
   l'établissement. En cas de danger de mort imminent : **112** ou **17**.

**Menace** (arme, attentat, « je vais le tuer », appel à la violence) :

1. Ne pas publier, ne pas supprimer : garder la trace (le texte reste en base, la purge n'intervient qu'après 90 jours).
2. Menace crédible contre des personnes ou un lycée : **17** ou **112** si c'est imminent, sinon signalement sur
   **Pharos** (internet-signalement.gouv.fr), en citant le lycée et le texte.
3. Refuser avec le motif **SERIOUS** et une note interne qui dit ce qui a été fait.

**Contenu sexuel impliquant un mineur, agression, harcèlement sexuel :**

1. Ne pas publier. Signalement **Pharos** pour un contenu illicite ; **119** si un mineur est en danger.
2. Ne jamais télécharger ni recopier ailleurs un contenu sexuel impliquant un mineur.
3. Refuser avec le motif **SERIOUS**.

Dans tous les cas, écris dans la **note interne** ce que tu as fait et quand : c'est ta protection si on te le demande plus
tard.

## 6. Après publication

- **« Signaler un contenu »** : chaque signalement arrive dans la file. Les motifs « personne visée » et « données
  personnelles » sont prioritaires. **Au troisième signalement ouvert**, le problème est dépublié automatiquement en
  attendant ta décision (notification 🚩). Tu le republies tel quel, tu le modifies ou tu le retires.
- **👎 « Pas sérieux »** : jamais public, ne masque jamais rien. À partir de **5 👎 représentant au moins la moitié des 👍**,
  le problème revient dans ta file (notification 👎). Les 👎 déjà examinés ne comptent plus.
- **« Semble résolu »** : géré automatiquement par les votes des élèves, pas par la modération.

## 7. Mobilisations (📣)

Affichées 72 h après leur date, jamais avec une heure ni un lieu de rendez-vous.

- **Signalées par un élève** : toujours à valider dans **/admin/mobilisations**. Relis les motifs : rien qui vise une
  personne, aucun appel à la dégradation, aucun lieu ni horaire de rassemblement.
- **Tirées de la presse** : publiées seules quand Jev est sûr ; s'il hésite, le second avis GPT publie, te les laisse à
  valider ou les écarte en te prévenant (notification 🚫 avec sa raison et le lien de l'article : ajoute-la à la main si
  c'est une erreur).
- **Listes de lycées fermés** (lot `presse-liste`) : toujours à valider. Ouvre l'article, vérifie le **lycée exact**
  (deux « Diderot » à Lyon ne sont pas le même établissement) et la **date**, refuse les erreurs une par une, puis publie
  le reste d'un clic.

## 8. Revue de presse

On n'affiche que le titre, le média, la date et le lien. On écarte un article dont le **titre** nomme ou rend reconnaissable
une personne (élève, enseignant, victime), un titre racoleur, une rumeur ou une tribune. Un fait divers grave lors d'un
blocus se publie s'il est factuel et que personne n'y est reconnaissable.

## 9. Délais visés

| Cas | Délai |
|---|---|
| URGENT | Dans l'heure, dès que tu vois la notification. |
| Problème dépublié après 3 signalements de contenu | Dans la journée. |
| File normale | Sous 24 h. |
| Mobilisation à valider | Le jour même (elle n'a de sens que pendant 72 h). |

Si tu ne peux pas tenir ces délais (vacances, maladie), coupe la **publication automatique** et indique-le sur la page de
contact : mieux vaut un site lent qu'un site qui publie sans relecture.

## 10. Traçabilité et données

- Chaque décision est inscrite dans le **journal** (/admin/logs) : qui, quoi, quand, avant et après.
- Le texte original de l'élève est conservé pour la modération, puis **effacé 90 jours** après publication ou refus.
- Aucune donnée ne permet d'identifier un élève : pas de compte, pas d'e-mail, une empreinte technique hachée. Ne cherche
  jamais à remonter à un auteur, même pour un contenu grave : c'est aux autorités saisies (119, Pharos) de le faire.
