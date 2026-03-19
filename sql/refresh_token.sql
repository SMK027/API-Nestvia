-- Table pour les refresh tokens
CREATE TABLE IF NOT EXISTS `refresh_token` (
  `id_refresh` int(11) NOT NULL AUTO_INCREMENT,
  `id_locataire` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id_refresh`),
  UNIQUE KEY `uk_token` (`token`),
  KEY `idx_locataire` (`id_locataire`),
  KEY `idx_expires` (`expires_at`),
  CONSTRAINT `fk_refresh_locataire` FOREIGN KEY (`id_locataire`) REFERENCES `locataire` (`id_locataire`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
