# ANEF – Statut du dossier de naturalisation

Extension Chrome non officielle permettant de mieux suivre l’avancement de son dossier de naturalisation sur le portail ANEF
(*Administration numérique pour les étrangers en France*).

## Objectif

L’interface ANEF ne montre qu’une frise générique (demande envoyée, examen des pièces, etc.) et cache les statuts techniques
utilisés en interne par l’administration (codes chiffrés).

Cette extension :

- intercepte, déchiffre et interprète le statut technique de votre dossier ;
- ajoute une étape complémentaire sur la frise avec une description compréhensible ;
- affiche un infobulle détaillé avec :
  - l’intitulé “métier” du statut,
  - le code technique ANEF,
  - la date de mise à jour du statut ;
- expose, quand c’est possible, des informations complémentaires (entretien d’assimilation, décret, récépissé de complétude, etc.),
  en s’appuyant sur le projet open source `status_naturalisation`.

## Fonctionnement

1. Lors du chargement de l’onglet **« Demande d’accès à la Nationalité Française »** sur le site ANEF,
   l’extension injecte un script dans la page.
2. Le script appelle les API ANEF (par exemple `/api/anf/dossier-stepper`) en réutilisant la session de l’utilisateur.
3. Le statut chiffré renvoyé par l’API est déchiffré en local (via une clé privée embarquée) et traduit
   en une phrase lisible (ex. : « Préfecture : En attente affectation à un agent »).
4. Une nouvelle étape est ajoutée sur la frise ANEF avec :
   - une icône sablier rouge,
   - une description courte,
   - un rappel du temps écoulé (ex. « il y a 22 jrs »).
5. Un survol de cette étape affiche un infobulle détaillé avec le code technique et la date exacte.

## Installation (mode développeur)

1. Cloner ce dépôt ou télécharger le ZIP via GitHub puis le décompresser.
2. Ouvrir Chrome et aller sur `chrome://extensions`.
3. Activer le **Mode développeur**.
4. Cliquer sur **« Charger l’extension non empaquetée »** et choisir le dossier du projet.
5. Se connecter à son compte sur le portail ANEF et ouvrir l’onglet **« Demande d’accès à la Nationalité Française »**.
6. Vérifier que l’icône de l’extension apparaît dans Chrome et qu’une étape supplémentaire s’affiche sur la frise.

## Icônes

Les icônes de l’extension (16, 48, 128 px) utilisent la Marianne issue du projet open source `status_naturalisation`.

## Avertissements

- Cette extension n’est pas un service officiel de l’État français.
- Les informations affichées sont issues des API ANEF mais leur interprétation est fournie à titre purement indicatif.
- Utilisation à vos risques et périls ; vérifiez toujours votre situation auprès de l’administration compétente.
