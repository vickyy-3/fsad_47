package com.platform.backend.controller;

import com.platform.backend.entity.Notification;
import com.platform.backend.repository.NotificationRepository;
import com.platform.backend.security.UserDetailsImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<?> getNotifications() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userDetails.getId());
        // Limit to top 50 for performance
        if(notifications.size() > 50) {
            notifications = notifications.subList(0, 50);
        }
        return ResponseEntity.ok(notifications);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        Notification notif = notificationRepository.findById(id).orElse(null);
        
        if (notif != null && notif.getUser().getId().equals(userDetails.getId())) {
            notif.setRead(true);
            notificationRepository.save(notif);
            return ResponseEntity.ok("Marked as read");
        }
        return ResponseEntity.badRequest().body("Notification not found or access denied");
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead() {
        UserDetailsImpl userDetails = (UserDetailsImpl) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        List<Notification> unread = notificationRepository.findByUserIdAndIsReadFalse(userDetails.getId());
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok("All marked as read");
    }
}
