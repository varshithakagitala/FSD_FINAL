export const PROJECT_FILES: Record<string, string> = {
  'pom.xml': `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.rescuegrid</groupId>
    <artifactId>RescueGrid</artifactId>
    <version>1.0.0</version>
    <packaging>war</packaging>

    <name>RescueGrid - Campus Emergency Reporting and Response</name>
    <description>FSD-2 Mini Project: Real-Time Campus Emergency Reporting, Email OTP Authentication, Severity Rule Engine, and Responder Dispatch Web Application</description>

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <jakarta.servlet.version>6.0.0</jakarta.servlet.version>
        <jakarta.jsp.version>3.1.0</jakarta.jsp.version>
        <jstl.version>3.0.1</jstl.version>
        <mysql.version>8.3.0</mysql.version>
        <jakarta.mail.version>2.1.2</jakarta.mail.version>
        <angus.mail.version>2.0.2</angus.mail.version>
        <jbcrypt.version>0.4</jbcrypt.version>
        <gson.version>2.10.1</gson.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>jakarta.servlet</groupId>
            <artifactId>jakarta.servlet-api</artifactId>
            <version>\${jakarta.servlet.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>jakarta.servlet.jsp</groupId>
            <artifactId>jakarta.servlet.jsp-api</artifactId>
            <version>\${jakarta.jsp.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.glassfish.web</groupId>
            <artifactId>jakarta.servlet.jsp.jstl</artifactId>
            <version>\${jstl.version}</version>
        </dependency>
        <dependency>
            <groupId>com.mysql</groupId>
            <artifactId>mysql-connector-j</artifactId>
            <version>\${mysql.version}</version>
        </dependency>
        <dependency>
            <groupId>jakarta.mail</groupId>
            <artifactId>jakarta.mail-api</artifactId>
            <version>\${jakarta.mail.version}</version>
        </dependency>
        <dependency>
            <groupId>org.eclipse.angus</groupId>
            <artifactId>angus-mail</artifactId>
            <version>\${angus.mail.version}</version>
        </dependency>
        <dependency>
            <groupId>org.mindrot</groupId>
            <artifactId>jbcrypt</artifactId>
            <version>\${jbcrypt.version}</version>
        </dependency>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>\${gson.version}</version>
        </dependency>
    </dependencies>

    <build>
        <finalName>RescueGrid</finalName>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-war-plugin</artifactId>
                <version>3.4.0</version>
            </plugin>
        </plugins>
    </build>
</project>`,

  'README.md': `# RescueGrid: Campus Emergency Reporting and Response Web Application
FSD-2 Mini Project Built with Java Servlets, JSP, JDBC, MySQL 8, Jakarta Mail SMTP, and Leaflet.

## Windows Setup Instructions
1. Install JDK 17+ and Apache Tomcat 10.1.x.
2. Run database/schema.sql and database/seed.sql in MySQL 8.
3. Update application.properties with Gmail App Password (SMTP).
4. Run 'mvn clean package' to build target/RescueGrid.war.
5. Deploy WAR to Tomcat webapps/ and navigate to http://localhost:8080/RescueGrid/`,

  'database/schema.sql': `-- RescueGrid MySQL 8.0+ Schema
CREATE DATABASE IF NOT EXISTS rescuegrid_db;
USE rescuegrid_db;

CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'RESPONDER', 'ADMIN') NOT NULL DEFAULT 'STUDENT',
    student_id VARCHAR(50) NULL,
    department VARCHAR(100) NULL,
    phone_number VARCHAR(20) NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE email_otps (
    otp_id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(150) NOT NULL,
    otp_code VARCHAR(10) NOT NULL,
    otp_type ENUM('SIGNUP', 'LOGIN') NOT NULL,
    expiry_time TIMESTAMP NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 5,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE incidents (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    incident_code VARCHAR(30) NOT NULL UNIQUE,
    reporter_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    category ENUM('Medical', 'Fire', 'Security', 'Accident', 'Electrical', 'Infrastructure', 'Other') NOT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    calculated_priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Reported', 'Assigned', 'Accepted', 'En Route', 'On Scene', 'Resolved', 'Unable to Respond', 'Cancelled') NOT NULL DEFAULT 'Reported',
    campus_location VARCHAR(200) NOT NULL,
    latitude DECIMAL(10, 7) NULL,
    longitude DECIMAL(10, 7) NULL,
    description TEXT NOT NULL,
    contact_number VARCHAR(20) NULL,
    photo_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE responder_profiles (
    profile_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    badge_number VARCHAR(50) NOT NULL UNIQUE,
    specialization ENUM('Medical', 'Fire', 'Security', 'Electrical', 'General') NOT NULL DEFAULT 'General',
    current_status ENUM('Available', 'Dispatched', 'Busy', 'Off Duty') NOT NULL DEFAULT 'Available',
    current_latitude DECIMAL(10, 7) NULL,
    current_longitude DECIMAL(10, 7) NULL,
    campus_base_zone VARCHAR(100) NOT NULL DEFAULT 'Main Security HQ',
    active_incidents_count INT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE incident_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    responder_id INT NOT NULL,
    assigned_by_admin_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    status ENUM('Pending', 'Accepted', 'Declined', 'Completed') NOT NULL DEFAULT 'Pending',
    assignment_notes TEXT NULL,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE,
    FOREIGN KEY (responder_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE incident_updates (
    update_id INT AUTO_INCREMENT PRIMARY KEY,
    incident_id INT NOT NULL,
    updated_by_user_id INT NOT NULL,
    status_before VARCHAR(50) NOT NULL,
    status_after VARCHAR(50) NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    incident_id INT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    channel ENUM('EMAIL', 'IN_APP', 'BOTH') NOT NULL DEFAULT 'BOTH',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(50) NOT NULL,
    entity_id INT NULL,
    ip_address VARCHAR(45) NULL,
    details_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`,

  'database/seed.sql': `-- RescueGrid Seed Data
USE rescuegrid_db;
INSERT INTO users (user_id, full_name, email, password_hash, role, phone_number, is_verified, is_active) VALUES
(1, 'Prof. Arthur Pendelton', 'admin@rescuegrid.campus.edu', '$2a$10$wT8m9M21r0zVwJ41bK9l..gOQxVlM6E1K0T0f8N3h2gRz4W3V1aCe', 'ADMIN', '+1 (555) 019-2831', TRUE, TRUE),
(2, 'Capt. Marcus Vance', 'marcus.vance@rescuegrid.campus.edu', '$2a$10$wT8m9M21r0zVwJ41bK9l..gOQxVlM6E1K0T0f8N3h2gRz4W3V1aCe', 'RESPONDER', '+1 (555) 019-3341', TRUE, TRUE),
(3, 'Paramedic Sarah Jenkins', 'sarah.jenkins@rescuegrid.campus.edu', '$2a$10$wT8m9M21r0zVwJ41bK9l..gOQxVlM6E1K0T0f8N3h2gRz4W3V1aCe', 'RESPONDER', '+1 (555) 019-8822', TRUE, TRUE),
(6, 'Alex Rivera', 'alex.rivera@student.campus.edu', '$2a$10$wT8m9M21r0zVwJ41bK9l..gOQxVlM6E1K0T0f8N3h2gRz4W3V1aCe', 'STUDENT', '+1 (555) 019-9111', TRUE, TRUE);`,

  'src/main/java/com/rescuegrid/config/DBConnection.java': `package com.rescuegrid.config;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

public class DBConnection {
    private static final String URL = "jdbc:mysql://localhost:3306/rescuegrid_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASS = "root";

    static {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            e.printStackTrace();
        }
    }

    public static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }
}`,

  'src/main/java/com/rescuegrid/service/SeverityEngine.java': `package com.rescuegrid.service;

import java.util.Locale;

public class SeverityEngine {
    public static String calculateSuggestedPriority(String category, String description, String title) {
        int score = 30;
        switch (category != null ? category.trim() : "") {
            case "Fire": score = 85; break;
            case "Medical": score = 80; break;
            case "Electrical": score = 70; break;
            case "Security": score = 65; break;
            case "Accident": score = 60; break;
            case "Infrastructure": score = 40; break;
            default: score = 30; break;
        }

        String combined = ((title != null ? title : "") + " " + (description != null ? description : "")).toLowerCase(Locale.ROOT);
        String[] criticalKeywords = {"unconscious", "collapse", "cardiac", "explosion", "flame", "fire", "smoke", "weapon", "bleeding"};
        for (String kw : criticalKeywords) {
            if (combined.contains(kw)) {
                score += 20;
                break;
            }
        }

        String[] severeKeywords = {"severe", "fumes", "chemical", "shock", "leak", "flood"};
        for (String kw : severeKeywords) {
            if (combined.contains(kw)) {
                score += 15;
                break;
            }
        }

        if (score >= 85) return "Critical";
        if (score >= 65) return "High";
        if (score >= 45) return "Medium";
        return "Low";
    }
}`,

  'src/main/java/com/rescuegrid/service/ResponderRankingService.java': `package com.rescuegrid.service;

import com.rescuegrid.model.Incident;
import com.rescuegrid.model.ResponderProfile;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

public class ResponderRankingService {
    public static void rankRespondersForIncident(List<ResponderProfile> responders, Incident incident) {
        for (ResponderProfile profile : responders) {
            double score = 0;
            if (profile.getSpecialization().equalsIgnoreCase(incident.getCategory())) score += 40;
            else if ("General".equalsIgnoreCase(profile.getSpecialization())) score += 20;
            else score += 10;

            if ("Available".equalsIgnoreCase(profile.getCurrentStatus())) score += 30;
            else if ("Dispatched".equalsIgnoreCase(profile.getCurrentStatus())) score += 10;
            else if ("Busy".equalsIgnoreCase(profile.getCurrentStatus())) score += 5;
            else score -= 30;

            score -= (profile.getActiveIncidentsCount() * 10);
            profile.setMatchScore(Math.max(0, score));
        }
        responders.sort(Comparator.comparingDouble(ResponderProfile::getMatchScore).reversed());
    }
}`,

  'src/main/webapp/WEB-INF/web.xml': `<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="https://jakarta.ee/xml/ns/jakartaee
                             https://jakarta.ee/xml/ns/jakartaee/web-app_6_0.xsd"
         version="6.0">
    <display-name>RescueGrid Emergency Management</display-name>
    <welcome-file-list>
        <welcome-file>index.jsp</welcome-file>
    </welcome-file-list>
    <session-config>
        <session-timeout>30</session-timeout>
    </session-config>
</web-app>`,

  'docs/test-cases.md': `# RescueGrid: Complete 18-Test Specification
TC-01: Valid Student Registration with Email OTP
TC-02: Duplicate Email Protection
TC-03: Incorrect Signup OTP Verification
TC-04: Expired OTP Invalidation (5-Minute Expiry)
TC-05: OTP Resend 60-Second Cooldown Enforcement
TC-06: Two-Step Login OTP Authentication
TC-07: Incorrect Password Rejection
TC-08: Unverified Account Sign-In Block
TC-09: AuthenticationFilter Unauthorized Access Interception
TC-10: RoleFilter Administrative Privilege Escalation Defense
TC-11: Incident Submission & Rule-Based Severity Engine
TC-12: Server-Side Required Input Sanitization & Validation
TC-13: File Upload Validation (JPG/PNG only, 5MB limit)
TC-14: Administrative Responder Dispatch
TC-15: Responder Status Progression (En Route -> On Scene -> Resolved)
TC-16: Session Invalidation on Logout
TC-17: Database Connection Failure Graceful Recovery
TC-18: SMTP Delivery Failure Diagnostic Handling`,

  'docs/project-report.md': `# ACADEMIC MINI PROJECT REPORT
TITLE: RESCUEGRID: A REAL-TIME CAMPUS EMERGENCY REPORTING AND RESPONSE WEB APPLICATION
Course: Full Stack Development-II (FSD-2)
Technologies: Jakarta Servlets 6.0, JSP, JDBC, MySQL 8, Jakarta Mail SMTP, Leaflet.js
Allocation:
- Chapter 1: Technologies Used (Pages 6-17)
- Chapter 2: Web Application Architecture (Page 18)
- Chapter 3: Coding and Implementation (Pages 19-25)
- Chapter 4: Results and Screenshots (Pages 26-29)
- Chapter 5: Conclusion (Page 30)
- Chapter 6: References (Page 31)`
};
