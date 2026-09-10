CREATE TABLE `bm_ip_ban_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` int(10) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_ban_records_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_ip_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_bans_created_idx` (`created`),
  KEY `bm_ip_bans_expires_idx` (`expires`),
  KEY `bm_ip_bans_updated_idx` (`updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_ip_mute_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` int(10) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `soft` tinyint(1) DEFAULT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_mute_records_created_idx` (`created`),
  KEY `bm_ip_mute_records_soft_idx` (`soft`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_ip_mutes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `soft` tinyint(1) DEFAULT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_mutes_updated_idx` (`updated`),
  KEY `bm_ip_mutes_soft_idx` (`soft`),
  KEY `bm_ip_mutes_created_idx` (`created`),
  KEY `bm_ip_mutes_expires_idx` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_ip_range_ban_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fromIp` varbinary(16) NOT NULL,
  `toIp` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` int(10) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_range_ban_records_created_idx` (`created`),
  KEY `bm_ip_range_ban_records_toIp_idx` (`toIp`),
  KEY `bm_ip_range_ban_records_fromIp_idx` (`fromIp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_ip_range_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fromIp` varbinary(16) NOT NULL,
  `toIp` varbinary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_ip_range_bans_expires_idx` (`expires`),
  KEY `bm_ip_range_bans_created_idx` (`created`),
  KEY `bm_ip_range_bans_updated_idx` (`updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_name_ban_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` bigint(20) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_name_ban_records_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_name_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_name_bans_updated_idx` (`updated`),
  KEY `bm_name_bans_created_idx` (`created`),
  KEY `bm_name_bans_expires_idx` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_ban_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` bigint(20) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_ban_records_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_bans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bm_player_bans_player_idx` (`player_id`),
  KEY `bm_player_bans_created_idx` (`created`),
  KEY `bm_player_bans_expires_idx` (`expires`),
  KEY `bm_player_bans_updated_idx` (`updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `ip` varbinary(16) NOT NULL,
  `join` int(10) NOT NULL,
  `leave` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_history_ip_idx` (`ip`),
  KEY `bm_player_history_leave_idx` (`leave`),
  KEY `bm_player_history_join_idx` (`join`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_kicks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_kicks_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_mute_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `expired` bigint(20) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `pastActor_id` binary(16) NOT NULL,
  `pastCreated` int(10) NOT NULL,
  `created` int(10) NOT NULL,
  `createdReason` varchar(255) NOT NULL,
  `soft` tinyint(1) DEFAULT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_mute_records_soft_idx` (`soft`),
  KEY `bm_player_mute_records_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_mutes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `soft` tinyint(1) DEFAULT NULL,
  `silent` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bm_player_mutes_player_idx` (`player_id`),
  KEY `bm_player_mutes_expires_idx` (`expires`),
  KEY `bm_player_mutes_soft_idx` (`soft`),
  KEY `bm_player_mutes_updated_idx` (`updated`),
  KEY `bm_player_mutes_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `message` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_notes_created_idx` (`created`),
  KEY `bm_player_notes_actor_idx` (`actor_id`),
  KEY `bm_player_notes_player_idx` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_pins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `pin` varchar(255) NOT NULL,
  `expires` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_pins_player_idx` (`player_id`),
  KEY `bm_player_pins_pin_idx` (`player_id`,`pin`),
  KEY `bm_player_pins_expires_idx` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_report_commands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `command` varchar(255) NOT NULL,
  `args` varchar(255) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_report_commands_actor_idx` (`actor_id`),
  KEY `bm_player_report_commands_updated_idx` (`updated`),
  KEY `bm_player_report_commands_command_idx` (`command`),
  KEY `bm_player_report_commands_report_idx` (`report_id`),
  KEY `bm_player_report_commands_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_report_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `comment` varchar(255) NOT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_report_comments_updated_idx` (`updated`),
  KEY `bm_player_report_comments_report_idx` (`report_id`),
  KEY `bm_player_report_comments_actor_idx` (`actor_id`),
  KEY `bm_player_report_comments_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_report_locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `player_id` binary(16) NOT NULL,
  `world` varchar(255) NOT NULL,
  `x` double NOT NULL,
  `y` double NOT NULL,
  `z` double NOT NULL,
  `pitch` float NOT NULL,
  `yaw` float NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_report_locations_player_idx` (`player_id`),
  KEY `bm_player_report_locations_world_idx` (`world`),
  KEY `bm_player_report_locations_report_idx` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_report_states` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bm_player_report_states` (`id`, `name`) VALUES
  (1, 'Open'),
  (2, 'Assigned'),
  (3, 'Resolved'),
  (4, 'Closed');

CREATE TABLE `bm_player_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `state_id` int(11) NOT NULL,
  `assignee_id` binary(16) DEFAULT NULL,
  `created` int(10) NOT NULL,
  `updated` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_player_reports_player_idx` (`player_id`),
  KEY `bm_player_reports_actor_idx` (`actor_id`),
  KEY `bm_player_reports_state_idx` (`state_id`),
  KEY `bm_player_reports_assignee_idx` (`assignee_id`),
  KEY `bm_player_reports_created_idx` (`created`),
  KEY `bm_player_reports_updated_idx` (`updated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_player_warnings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `reason` varchar(255) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `created` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  `read` tinyint(1) DEFAULT NULL,
  `points` decimal(60,2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (`id`),
  KEY `bm_player_warnings_expires_idx` (`expires`),
  KEY `bm_player_warnings_read_idx` (`read`),
  KEY `bm_player_warnings_points_idx` (`points`),
  KEY `bm_player_warnings_created_idx` (`created`),
  KEY `bm_player_warnings_player_idx` (`player_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_players` (
  `id` binary(16) NOT NULL,
  `name` varchar(16) NOT NULL,
  `ip` varbinary(16) NOT NULL,
  `lastSeen` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_players_ip_idx` (`ip`),
  KEY `bm_players_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_report_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `report_id` int(11) NOT NULL,
  `log_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_report_logs_log_idx` (`log_id`),
  KEY `bm_report_logs_report_idx` (`report_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_rollbacks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `player_id` binary(16) NOT NULL,
  `actor_id` binary(16) NOT NULL,
  `type` varchar(255) NOT NULL,
  `created` int(10) NOT NULL,
  `expires` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_rollbacks_created_idx` (`created`),
  KEY `bm_rollbacks_expires_idx` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `bm_server_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `created` int(10) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bm_server_logs_created_idx` (`created`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
