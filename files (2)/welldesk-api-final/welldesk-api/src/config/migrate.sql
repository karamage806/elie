-- Run this file once to set up your database schema
-- mysql -u root -p welldesk < src/config/migrate.sql

CREATE TABLE IF NOT EXISTS companies (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  logo_url    VARCHAR(255),
  invite_token CHAR(36)   NOT NULL DEFAULT (UUID()),
  created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invite_token (invite_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id    CHAR(36)     NOT NULL,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('owner','employee') NOT NULL DEFAULT 'employee',
  avatar_url    VARCHAR(255),
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS checkins (
  id            CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id       CHAR(36)  NOT NULL,
  mood_score    TINYINT   NOT NULL CHECK (mood_score BETWEEN 1 AND 5),
  energy_score  TINYINT   NOT NULL CHECK (energy_score BETWEEN 1 AND 5),
  notes         TEXT,
  sick_note_url VARCHAR(255),
  checkin_date  DATE      NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_date (user_id, checkin_date),
  CONSTRAINT fk_checkins_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wellness_goals (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  company_id   CHAR(36)     NOT NULL,
  title        VARCHAR(150) NOT NULL,
  description  TEXT,
  target_value DECIMAL(5,2) NOT NULL,
  metric       VARCHAR(50)  NOT NULL,
  start_date   DATE         NOT NULL,
  end_date     DATE         NOT NULL,
  status       ENUM('active','completed','archived') NOT NULL DEFAULT 'active',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_goals_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS goal_progress (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  goal_id     CHAR(36)     NOT NULL,
  user_id     CHAR(36)     NOT NULL,
  value       DECIMAL(5,2) NOT NULL,
  logged_date DATE         NOT NULL,
  note        TEXT,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_progress_goal FOREIGN KEY (goal_id) REFERENCES wellness_goals(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS password_resets (
  id         CHAR(36)  NOT NULL DEFAULT (UUID()),
  user_id    CHAR(36)  NOT NULL,
  token      CHAR(64)  NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used       BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_token (token),
  CONSTRAINT fk_resets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
