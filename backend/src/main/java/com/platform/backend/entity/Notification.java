package com.platform.backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String type; // e.g., COMMENT, MILESTONE, DOCUMENT

    @Column(nullable = false)
    private boolean isRead = false;

    @Column
    private String actionUrl;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
