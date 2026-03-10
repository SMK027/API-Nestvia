-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 18 déc. 2025 à 16:29
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
-- Base de données : `projet_location`
--

-- --------------------------------------------------------


CREATE DATABASE IF NOT EXISTS projet_location;
USE projet_location;

--
-- Structure de la table `administrateurs`
--

CREATE TABLE `administrateurs` (
  `id_admin` int(11) NOT NULL,
  `nom_admin` varchar(50) NOT NULL,
  `prenom_admin` varchar(50) NOT NULL,
  `email_admin` varchar(50) NOT NULL,
  `pass_admin` text NOT NULL,
  `tel_admin` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `bien`
--

CREATE TABLE `bien` (
  `id_bien` int(11) NOT NULL,
  `nom_bien` varchar(50) NOT NULL,
  `rue_bien` varchar(50) NOT NULL,
  `com_bien` varchar(50) NOT NULL,
  `superficie_bien` varchar(50) NOT NULL,
  `description_bien` varchar(50) NOT NULL,
  `animaux_bien` varchar(50) NOT NULL,
  `nb_couchage` varchar(50) NOT NULL,
  `id_commune` int(11) NOT NULL,
  `id_typebien` int(11) NOT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `blocage`
--

CREATE TABLE `blocage` (
  `id_blocage` int(11) NOT NULL,
  `id_bien` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `motif` varchar(255) DEFAULT NULL,
  `id_admin` int(11) DEFAULT NULL,
  `date_creation` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `commune`
--

CREATE TABLE `commune` (
  `id_commune` int(11) NOT NULL,
  `commune_departement` varchar(3) DEFAULT NULL,
  `commune_slug` varchar(255) DEFAULT NULL,
  `nom_commune` varchar(45) DEFAULT NULL,
  `commune_nom_simple` varchar(45) DEFAULT NULL,
  `commune_nom_reel` varchar(45) DEFAULT NULL,
  `commune_nom_soundex` varchar(20) DEFAULT NULL,
  `commune_nom_metaphone` varchar(22) DEFAULT NULL,
  `cp_commune` varchar(255) DEFAULT NULL,
  `commune` varchar(3) DEFAULT NULL,
  `code_commune` varchar(5) NOT NULL,
  `commune_arrondissement` smallint(3) UNSIGNED DEFAULT NULL,
  `commune_canton` varchar(4) DEFAULT NULL,
  `commune_amdi` smallint(5) UNSIGNED DEFAULT NULL,
  `commune_population_2010` mediumint(11) UNSIGNED DEFAULT NULL,
  `commune_population_1999` mediumint(11) UNSIGNED DEFAULT NULL,
  `commune_population_2012` mediumint(10) UNSIGNED DEFAULT NULL COMMENT 'approximatif',
  `commune_densite_2010` int(11) DEFAULT NULL,
  `commune_surface` float DEFAULT NULL,
  `commune_longitude_deg` float DEFAULT NULL,
  `commune_latitude_deg` float DEFAULT NULL,
  `commune_longitude_grd` varchar(9) DEFAULT NULL,
  `commune_latitude_grd` varchar(8) DEFAULT NULL,
  `commune_longitude_dms` varchar(9) DEFAULT NULL,
  `commune_latitude_dms` varchar(8) DEFAULT NULL,
  `commune_zmin` mediumint(4) DEFAULT NULL,
  `commune_zmax` mediumint(4) DEFAULT NULL,
  `statut_commune` enum('active','fusionnee','supprimee','nouvelle') DEFAULT 'active' COMMENT 'Statut administratif de la commune',
  `date_modification_statut` date DEFAULT NULL COMMENT 'Date du dernier changement de statut',
  `commune_fusion_id` int(11) DEFAULT NULL COMMENT 'ID de la commune résultante en cas de fusion',
  `commentaire_statut` text DEFAULT NULL COMMENT 'Commentaire ou précisions sur le changement de statut'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--

--
-- Structure de la table `favoris`
--

CREATE TABLE `favoris` (
  `id_favori` int(11) NOT NULL,
  `id_locataire` int(11) NOT NULL,
  `id_bien` int(11) NOT NULL,
  `date_ajout` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `locataire`
--

CREATE TABLE `locataire` (
  `id_locataire` int(11) NOT NULL,
  `nom_locataire` varchar(50) NOT NULL,
  `prenom_locataire` varchar(50) NOT NULL,
  `dna_locataire` date NOT NULL,
  `email_locataire` varchar(50) NOT NULL,
  `rue_locataire` varchar(50) NOT NULL,
  `pass_locataire` text NOT NULL,
  `tel_locataire` varchar(50) NOT NULL,
  `comp_locataire` varchar(50) NOT NULL,
  `id_commune` int(11) NOT NULL,
  `raison_sociale` varchar(50) NOT NULL,
  `siret` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id_notification` int(11) NOT NULL,
  `id_locataire` int(11) NOT NULL,
  `id_reservation` int(11) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'review_request',
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `date_created` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `photo`
--

CREATE TABLE `photo` (
  `id_photo` int(11) NOT NULL,
  `nom_photo` varchar(50) NOT NULL,
  `lien_photo` varchar(100) NOT NULL,
  `id_bien` int(11) DEFAULT NULL,
  `date_upload` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `prestation`
--

CREATE TABLE `prestation` (
  `id_prestation` int(11) NOT NULL,
  `libelle_prestation` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `reservation`
--

CREATE TABLE `reservation` (
  `id_reservations` int(11) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `id_locataire` int(11) NOT NULL,
  `id_bien` int(11) NOT NULL,
  `id_tarif` int(11) NOT NULL,
  `montant_total` decimal(10,2) DEFAULT NULL COMMENT 'Montant total de la réservation calculé automatiquement'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `reviews`
--

CREATE TABLE `reviews` (
  `id_review` int(11) NOT NULL,
  `id_locataire` int(11) NOT NULL,
  `id_bien` int(11) NOT NULL,
  `id_reservation` int(11) NOT NULL,
  `rating` tinyint(1) NOT NULL CHECK (`rating` >= 1 and `rating` <= 5),
  `comment` text DEFAULT NULL,
  `is_validated` tinyint(1) DEFAULT 0,
  `date_created` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `saison`
--

CREATE TABLE `saison` (
  `id_saison` int(11) NOT NULL,
  `libelle_saison` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `secompose`
--

CREATE TABLE `secompose` (
  `id_bien` int(11) NOT NULL,
  `id_prestation` int(11) NOT NULL,
  `quantite` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `tarif`
--

CREATE TABLE `tarif` (
  `id_tarif` int(11) NOT NULL,
  `semaine_tarif` varchar(50) NOT NULL,
  `annee_tarif` varchar(50) NOT NULL,
  `tarif` varchar(50) NOT NULL,
  `id_bien` int(11) NOT NULL,
  `id_saison` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `tentatives_connexion`
--

CREATE TABLE `tentatives_connexion` (
  `id_tentative` int(11) NOT NULL,
  `email_tentative` varchar(50) NOT NULL,
  `date_tentative` datetime NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--

--
-- Structure de la table `type_bien`
--

CREATE TABLE `type_bien` (
  `id_typebien` int(11) NOT NULL,
  `des_typebien` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
