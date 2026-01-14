-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 14 jan. 2026 à 01:29
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `club_fstt`
--

-- --------------------------------------------------------

--
-- Structure de la table `activite`
--

CREATE TABLE `activite` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `titre` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `dateDebut` datetime NOT NULL,
  `dateFin` datetime DEFAULT NULL,
  `lieu` varchar(200) NOT NULL,
  `placesMax` int(11) NOT NULL DEFAULT 20,
  `placesRestantes` int(11) DEFAULT NULL,
  `statut` enum('Planifiee','En_cours','Terminee','Annulee') DEFAULT 'Planifiee',
  `organisateur_id` bigint(20) UNSIGNED NOT NULL,
  `categorie_id` bigint(20) UNSIGNED DEFAULT NULL,
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `activite`
--

INSERT INTO `activite` (`id`, `titre`, `description`, `dateDebut`, `dateFin`, `lieu`, `placesMax`, `placesRestantes`, `statut`, `organisateur_id`, `categorie_id`, `updatedAt`) VALUES
(1, 'Tournoi de Football Inter-clubs', 'Tournoi amical entre les clubs de la faculté. Trophée du meilleur buteur à la clé !', '2024-03-15 14:00:00', '2024-03-15 18:00:00', 'Terrain de sport FSTT', 40, 15, 'Planifiee', 6, 1, '2026-01-12 22:50:27'),
(2, 'Session Yoga Matinale', 'Démarre ta journée avec une séance de yoga revitalisante. Tapis fournis pour les débutants.', '2024-03-20 07:30:00', '2024-03-20 08:30:00', 'Salle de gym FSTT', 25, 3, 'Planifiee', 1, 1, '2026-01-12 22:50:27'),
(3, 'Compétition d\'Escalade', 'Première compétition officielle d\'escalade du club. Ouvert à tous les niveaux.', '2024-04-05 09:00:00', '2024-04-05 17:00:00', 'Mur d\'escalade campus', 30, 0, 'Planifiee', 1, 1, '2026-01-12 22:50:27'),
(4, 'Soirée Poésie et Musique', 'Viens partager tes poèmes préférés ou jouer un morceau dans une ambiance conviviale.', '2024-03-18 19:00:00', '2024-03-18 22:00:00', 'Amphi culturel', 60, 42, 'Planifiee', 1, 2, '2026-01-12 22:50:27'),
(5, 'Exposition Photo \"Campus Vue\"', 'Exposition des meilleures photos du campus par les étudiants. Vote pour la photo de l\'année !', '2024-03-22 10:00:00', '2024-03-24 18:00:00', 'Hall principal FSTT', 200, 200, 'En_cours', 6, 2, '2026-01-12 22:50:27'),
(6, 'Atelier Peinture sur Soie', 'Apprends les techniques de peinture sur soie avec une artiste locale. Matériel fourni.', '2024-04-12 16:00:00', '2024-04-12 19:00:00', 'Atelier artistique', 15, 2, 'Planifiee', 1, 2, '2026-01-12 22:50:27'),
(7, 'Conférence AI/ML', 'Introduction aux concepts de Machine Learning et Intelligence Artificielle avec cas pratiques.', '2024-03-25 17:55:00', '2024-03-25 20:00:00', 'Amphi Tech', 150, 150, 'Planifiee', 6, 3, '2026-01-12 22:50:27'),
(8, 'Workshop Gestion de Projet Agile', 'Maîtrisez les méthodologies Agile avec des exercices pratiques et simulations.', '2024-03-28 14:00:00', '2024-03-28 17:30:00', 'Salle de conférence B2', 35, 10, 'Planifiee', 1, 3, '2026-01-12 22:50:27'),
(9, 'Préparation aux Entretiens Tech', 'Simulations d\'entretiens techniques avec feedback personnalisé par des recruteurs.', '2024-04-02 10:00:00', '2024-04-02 13:00:00', 'Career Center', 20, 1, 'Planifiee', 6, 3, '2026-01-12 22:50:27'),
(10, 'Brunch de Bienvenue', 'Accueil des nouveaux membres du club avec brunch et présentation des activités annuelles.', '2024-03-16 11:00:00', '2024-03-16 14:00:00', 'Jardin FSTT', 80, 25, 'Planifiee', 1, 4, '2026-01-12 22:50:27'),
(11, 'Soirée Jeux de Société', 'Venez découvrir une collection de jeux de société modernes dans une ambiance décontractée.', '2024-03-23 19:30:00', '2024-03-23 23:00:00', 'Foyer des étudiants', 50, 15, 'Planifiee', 6, 4, '2026-01-12 22:50:27'),
(12, 'Visite Guidée du Vieux Quartier', 'Découverte historique et culturelle du quartier ancien de la ville.', '2024-04-06 15:00:00', '2024-04-06 18:00:00', 'RDV Porte principale', 25, 8, 'Planifiee', 6, 4, '2026-01-12 22:50:27'),
(13, 'Hackathon Innovation 48h', 'Développe ton projet innovant en équipe. Prix pour les 3 meilleures solutions.', '2024-04-13 09:00:00', '2024-04-15 18:00:00', 'Espace coworking TechLab', 100, 45, 'Planifiee', 6, 5, '2026-01-12 22:50:27'),
(14, 'Tech Talk: Blockchain & Web3', 'Présentation des applications pratiques de la blockchain dans différents secteurs.', '2024-03-30 16:00:00', '2024-03-30 18:00:00', 'Salle informatique A3', 45, 20, 'Planifiee', 1, 5, '2026-01-12 22:50:27'),
(15, 'Initiation au Tennis de Table', 'Événement passé pour tester l\'affichage. Session découverte du ping-pong.', '2024-02-10 15:00:00', '2024-02-10 17:00:00', 'Salle de sport', 20, 0, 'Terminee', 1, 1, '2026-01-12 22:50:27'),
(16, 'Ciné-débat: Intelligence Artificielle', 'Projection suivie d\'un débat avec des experts. Événement passé.', '2024-02-28 18:30:00', '2024-02-28 21:30:00', 'Cinéma universitaire', 120, 0, 'Terminee', 1, 2, '2026-01-12 22:50:27'),
(17, 'Tournoi de Badminton', 'Événement annulé pour cause de météo. À reprogrammer.', '2024-03-17 10:00:00', '2024-03-17 16:00:00', 'Gymnase principal', 32, 32, 'Annulee', 1, 1, '2026-01-12 22:50:27'),
(18, 'Exposition \"Art Digital\"', 'Exposition en cours présentant des œuvres d\'art numérique par des étudiants.', '2024-03-01 09:00:00', '2024-03-31 18:00:00', 'Galerie FSTT', 500, 500, 'En_cours', 6, 2, '2026-01-12 22:50:27'),
(19, 'Conférence Carrières Tech', 'Rencontre avec des alumni travaillant dans les GAFAM. Networking garanti.', '2024-04-20 14:00:00', '2024-04-20 17:00:00', 'Grand Amphi', 300, 125, 'Planifiee', 6, 3, '2026-01-12 22:50:27'),
(20, 'Atelier Sécurité Informatique', 'Apprends à protéger tes données personnelles et professionnelles.', '2024-04-08 18:00:00', '2024-04-08 20:30:00', 'Lab sécurité info', 15, 1, 'Planifiee', 1, 5, '2026-01-12 22:50:27'),
(21, 'Réunion Générale du Club', 'Réunion de planning et d\'organisation des prochains événements.', '2024-03-29 18:00:00', '2024-03-29 20:00:00', 'Salle de réunion bureau', 25, 18, 'Planifiee', 1, NULL, '2026-01-12 22:50:27'),
(22, 'Session de Coaching CV', 'Apporte ton CV pour une relecture personnalisée par des professionnels.', '2026-01-12 16:00:00', '2026-01-12 18:00:00', 'Career Center', 30, 12, 'Planifiee', 6, 3, '2026-01-12 22:50:27'),
(23, 'Speed Networking Étudiants-Entreprises', 'Rencontre rapide avec des recruteurs de 10 entreprises partenaires.', '2026-01-14 23:50:27', '2026-01-15 02:50:27', 'Espace entreprises', 60, 5, 'Planifiee', 1, 4, '2026-01-12 22:50:27'),
(24, 'Marathon Universitaire 2026', 'Course à pied de 10km ouverte à tous les étudiants. Médaille pour tous les finisseurs.', '2026-02-14 08:00:00', '2026-02-14 12:00:00', 'Campus principal', 200, 200, 'Planifiee', 6, 1, '2026-01-12 22:55:05'),
(25, 'Tournoi de Basketball 3x3', 'Compétition de basketball 3 contre 3. Inscription par équipe de 3 joueurs.', '2026-03-05 09:00:00', '2026-03-05 18:00:00', 'Terrain de basket FSTT', 48, 48, 'Planifiee', 1, 1, '2026-01-12 22:55:05'),
(26, 'Stage d\'Équitation', 'Découverte de l\'équitation sur 3 jours au centre équestre partenaire.', '2026-04-10 09:00:00', '2026-04-12 17:00:00', 'Centre équestre Les Crins', 15, 15, 'Planifiee', 6, 1, '2026-01-14 00:16:37'),
(27, 'Festival des Arts Numériques', 'Festival sur 2 jours avec installations interactives et performances en direct.', '2026-01-25 10:00:00', '2026-01-26 22:00:00', 'Espace culturel universitaire', 500, 500, 'Planifiee', 1, 2, '2026-01-12 22:55:05'),
(28, 'Concours d\'Éloquence', 'Finale du concours d\'éloquence 2026. Thème: \"L\'innovation au service de l\'humain\".', '2026-02-20 19:00:00', '2026-02-20 22:00:00', 'Grand Amphi', 300, 300, 'Planifiee', 6, 2, '2026-01-12 22:55:05'),
(29, 'Exposition \"Futurs Possibles\"', 'Exposition d\'art contemporain explorant les technologies émergentes.', '2026-03-15 09:00:00', '2026-04-15 18:00:00', 'Musée universitaire', 1000, 1000, 'Planifiee', 1, 2, '2026-01-12 22:55:05'),
(30, 'Masterclass Intelligence Artificielle', 'Formation avancée en IA avec experts du secteur. Prérequis: bases en Python.', '2026-02-10 14:00:00', '2026-02-12 18:00:00', 'Campus Tech', 40, 40, 'Planifiee', 6, 3, '2026-01-12 22:55:05'),
(31, 'Séminaire Innovation Durable', 'Comment concilier innovation technologique et développement durable.', '2026-03-22 09:00:00', '2026-03-22 17:00:00', 'Salle de conférence A1', 80, 80, 'Planifiee', 1, 3, '2026-01-12 22:55:05'),
(32, 'Workshop Cybersécurité', 'Apprenez à protéger vos systèmes contre les cyberattaques.', '2026-04-05 14:00:00', '2026-04-05 18:00:00', 'Lab Sécurité', 25, 25, 'Planifiee', 6, 3, '2026-01-12 22:55:05'),
(33, 'Gala de Printemps 2026', 'Soirée de gala avec dîner et animations. Tenue de soirée requise.', '2026-03-28 20:00:00', '2026-03-29 02:00:00', 'Hôtel de ville', 150, 150, 'Planifiee', 1, 4, '2026-01-12 22:55:05'),
(34, 'Week-end d\'Intégration Nouveaux Membres', 'Week-end en montagne pour accueillir les nouveaux membres du club.', '2026-01-30 16:00:00', '2026-02-01 18:00:00', 'Chalet alpin', 60, 60, 'Planifiee', 6, 4, '2026-01-12 22:55:05'),
(35, 'Soirée Internationale', 'Voyage culinaire à travers les pays représentés à l\'université.', '2026-02-15 19:00:00', '2026-02-15 23:00:00', 'Restaurant universitaire', 120, 120, 'Planifiee', 1, 4, '2026-01-12 22:55:05'),
(36, 'Hackathon Robotique 2026', 'Construisez et programmez un robot pour relever des défis techniques.', '2026-03-07 09:00:00', '2026-03-09 18:00:00', 'FabLab robotique', 50, 50, 'Planifiee', 6, 5, '2026-01-12 22:55:05'),
(37, 'Conférence \"Métavers et Réalité Virtuelle\"', 'Explorez les opportunités professionnelles dans le métavers.', '2026-04-18 16:00:00', '2026-04-18 19:00:00', 'Salle VR immersive', 45, 45, 'Planifiee', 1, 5, '2026-01-12 22:55:05'),
(38, 'Challenge Data Science', 'Analysez des jeux de données complexes pour résoudre des problèmes réels.', '2026-05-12 10:00:00', '2026-05-14 18:00:00', 'Data Center universitaire', 30, 30, 'Planifiee', 6, 5, '2026-01-12 22:55:05'),
(39, 'Cours Privé de Guitare', 'Cours de guitare individuel avec professeur expérimenté. 10 séances.', '2026-02-01 17:00:00', '2026-04-30 18:00:00', 'Studio de musique', 8, 2, 'Planifiee', 1, 2, '2026-01-12 22:55:05'),
(40, 'Atelier Poterie Avancé', 'Pour les pratiquants confirmés. Création de pièces sur tour.', '2026-03-10 14:00:00', '2026-03-10 18:00:00', 'Atelier céramique', 6, 1, 'Planifiee', 6, 2, '2026-01-12 22:55:05'),
(41, 'Programme Mentorat Annuel 2026', 'Programme de mentorat sur toute l\'année académique.', '2026-01-20 00:00:00', '2026-12-15 23:59:00', 'Campus entier', 100, 75, 'Planifiee', 1, 3, '2026-01-12 22:55:05'),
(42, 'Forum Entreprises-Tech 2026', 'Rencontre avec les entreprises tech de la région. Stands et recrutement.', '2026-02-25 09:00:00', '2026-02-25 18:00:00', 'Palais des congrès', 800, 800, 'Planifiee', 6, 3, '2026-01-12 22:55:05'),
(43, 'Symposium International IA 2026', 'Événement majeur avec chercheurs internationaux en IA.', '2026-11-15 09:00:00', '2026-11-17 18:00:00', 'Centre des congrès international', 1200, 1200, 'Planifiee', 1, 3, '2026-01-12 22:55:05'),
(44, 'actvite teste ', 'activite teste', '2026-01-15 08:10:00', '2026-01-17 08:11:00', 'fstt salle ', 20, 20, 'Planifiee', 6, 3, '2026-01-13 07:11:25'),
(45, 'actviteeeeeeeeeee', 'activite teste', '2026-01-15 08:10:00', '2026-01-17 08:11:00', 'fstt salle ', 20, 20, 'Planifiee', 6, NULL, '2026-01-13 07:22:56'),
(46, 'ikram houzane ukhan', 'ikhaaaaaaaaaaaaaaan', '2026-01-15 10:55:00', '2026-01-17 10:55:00', 'bit 204', 20, 20, 'Planifiee', 6, 1, '2026-01-13 09:55:41'),
(47, 'ikram houzane ukhan', 'ikhaaaaaaaaaaaaaaan', '2026-01-15 10:55:00', '2026-01-17 10:55:00', 'bit 204', 20, 20, 'Planifiee', 6, 3, '2026-01-13 10:03:58'),
(48, 'ikram houzane ukhan', 'ikhaaaaaaaaaaaaaaan', '2026-01-15 10:55:00', '2026-01-17 10:55:00', 'bit 204', 20, 20, 'Planifiee', 6, 4, '2026-01-13 10:04:57'),
(49, 'ikram houzane ukhan ikhaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaan', 'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh', '2026-01-14 08:07:00', '2026-01-15 08:07:00', 'bit 204', 20, 20, 'Planifiee', 6, 2, '2026-01-13 23:12:38'),
(50, 'activite final', 'asdfghj', '2026-01-15 13:19:00', '2026-01-16 13:19:00', 'bit 204', 20, 20, 'Planifiee', 6, 3, '2026-01-13 12:19:32'),
(51, 'activite salma az', 'sdfg', '2026-01-16 13:23:00', '2026-01-18 13:23:00', 'fstt salle', 20, 20, 'Planifiee', 6, 2, '2026-01-13 12:23:46'),
(52, 'actvite de salmaazhich', 'activite salma azhich', '2026-01-17 23:24:00', '2026-01-18 23:24:00', 'd34', 50, 50, 'Planifiee', 6, 5, '2026-01-13 22:24:23');

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `nom`, `description`) VALUES
(1, 'Sport', 'Activités sportives et compétitions'),
(2, 'Culture', 'Événements culturels et artistiques'),
(3, 'Formation', 'Ateliers, séminaires et conférences'),
(4, 'Social', 'Rencontres et événements sociaux'),
(5, 'Technologie', 'Tech talks, hackathons et workshops');

-- --------------------------------------------------------

--
-- Structure de la table `inscriptions`
--

CREATE TABLE `inscriptions` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `activite_id` bigint(20) UNSIGNED NOT NULL,
  `membre_id` bigint(20) UNSIGNED NOT NULL,
  `date_inscription` timestamp NOT NULL DEFAULT current_timestamp(),
  `statut` enum('inscrit','annule','present') DEFAULT 'inscrit'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `inscriptions`
--

INSERT INTO `inscriptions` (`id`, `activite_id`, `membre_id`, `date_inscription`, `statut`) VALUES
(7, 26, 10, '2026-01-13 23:55:50', 'inscrit');

-- --------------------------------------------------------

--
-- Structure de la table `membres`
--

CREATE TABLE `membres` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `motDePasse` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `filiere` varchar(100) DEFAULT NULL,
  `anneeEtude` int(11) DEFAULT NULL,
  `poste` varchar(100) DEFAULT NULL,
  `estActif` tinyint(1) DEFAULT 1,
  `role` enum('ADMIN','MEMBRE_BUREAU','MEMBRE') NOT NULL DEFAULT 'MEMBRE',
  `createdAt` timestamp NOT NULL DEFAULT current_timestamp(),
  `updatedAt` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `membres`
--

INSERT INTO `membres` (`id`, `nom`, `prenom`, `email`, `motDePasse`, `telephone`, `filiere`, `anneeEtude`, `poste`, `estActif`, `role`, `createdAt`, `updatedAt`) VALUES
(1, 'Admin', 'Test', 'salmaah29@gmail.com', 'salma_salma', NULL, NULL, NULL, NULL, 1, 'ADMIN', '2026-01-09 14:57:29', '2026-01-12 16:04:52'),
(3, 'ikram', 'houzane', 'ikrame@gmail.com', 'ikrameikrame', '0676783567', 'lsi2', 2026, 'secritaire', 1, 'MEMBRE', '2026-01-09 15:57:19', '2026-01-09 15:57:19'),
(5, 'salma', 'bouzid', 'salmaazhich@gmail.com', '$2b$10$a9Kqn/523eMFJrAlS6Zx7uBcM/puiLggIYr1.KXWsVG/2SjShd2Gy', '0697989493', 'lsi2', 3, NULL, 1, 'ADMIN', '2026-01-12 19:33:59', '2026-01-13 23:28:45'),
(6, 'salomaa', 'azhicha', 'azhich.salma@etu.uae.ac.ma', '$2b$10$YusNxXVUwQo7LmyikVk8wO3.TW78acWfw45FXVArK6aCspQcC0YYG', '0697989493', 'lsi3', 4, NULL, 1, 'MEMBRE_BUREAU', '2026-01-12 21:33:03', '2026-01-12 21:33:19'),
(7, 'JEE', 'bouzid', 'salma@gmail.com', '$2b$10$hhtJHTlYmh6figR6k/vWw.BYBa25ZdYgqL6MAIM3qjp08sDSrs9Zq', '0697989493', 'lsi2', 3, NULL, 1, 'MEMBRE', '2026-01-12 22:04:37', '2026-01-12 22:04:37'),
(8, 'youness', 'azhich', 'younessazhich@gmail.com', '$2b$10$YbClnlW/YUgnQuazKDW7SuW9fFwHPaQYPfvJy.m35Hpn1y2y/Ub2y', '0697989493', 'lsi2', 3, NULL, 1, 'MEMBRE', '2026-01-12 22:51:42', '2026-01-12 22:51:42'),
(9, 'fati fati', 'allali', 'allali222@gmail.com', '$2b$10$vmHIyo7JsyzLFhbotoI1uuKmOwUch./HdvK4BO06KfofrH.YHuH6q', '0697989493', 'lsi3', 4, NULL, 1, 'MEMBRE', '2026-01-13 12:50:12', '2026-01-13 21:52:45'),
(10, 'salma', 'azhich', 'salmaazhich29@gmail.com', '$2b$10$iWWCEZocNdQi9fPEplgEYujVBOUPXFLKHsx0kijOSxj3vEY0f4SoO', '0697989493', 'lsi3', 5, NULL, 1, 'MEMBRE', '2026-01-13 23:31:04', '2026-01-13 23:31:04');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `activite`
--
ALTER TABLE `activite`
  ADD PRIMARY KEY (`id`),
  ADD KEY `organisateur_id` (`organisateur_id`),
  ADD KEY `categorie_id` (`categorie_id`);

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_inscription` (`activite_id`,`membre_id`),
  ADD KEY `membre_id` (`membre_id`);

--
-- Index pour la table `membres`
--
ALTER TABLE `membres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `activite`
--
ALTER TABLE `activite`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `membres`
--
ALTER TABLE `membres`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activite`
--
ALTER TABLE `activite`
  ADD CONSTRAINT `activite_ibfk_1` FOREIGN KEY (`organisateur_id`) REFERENCES `membres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activite_ibfk_2` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `inscriptions`
--
ALTER TABLE `inscriptions`
  ADD CONSTRAINT `inscriptions_ibfk_1` FOREIGN KEY (`activite_id`) REFERENCES `activite` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscriptions_ibfk_2` FOREIGN KEY (`membre_id`) REFERENCES `membres` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
